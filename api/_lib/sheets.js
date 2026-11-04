// Lưu trữ bằng Google Sheets qua REST API, không dùng thư viện ngoài.
// Hai tab:
//   Khach    : slug | ho_ten | ten_goi | xung_ho | nhom | kenh_gui | da_gui | mo_lan_dau
//   XacNhan  : slug | trang_thai | so_nguoi_di_cung | loi_nhan | cap_nhat_luc
import { createSign } from "node:crypto";
import { safeCall } from "./validate.js";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

export const STATUS_LABEL = { yes: "Sẽ đến", maybe: "Chưa chắc", no: "Không đi được" };
const LABEL_TO_STATUS = Object.fromEntries(Object.entries(STATUS_LABEL).map(([k, v]) => [v.toLowerCase(), k]));
const toStatus = (cell) => {
  const v = String(cell ?? "").trim().toLowerCase();
  return ["yes", "maybe", "no"].includes(v) ? v : LABEL_TO_STATUS[v] || null;
};

const GUEST_TTL_MS = 60_000; // đọc lại danh sách khách tối đa mỗi 60 giây
const MISS_REFRESH_MS = 10_000; // slug không thấy trong cache cũ hơn 10 giây thì đọc lại một lần

/**
 * Chấp nhận nhiều kiểu dán GOOGLE_PRIVATE_KEY trên Vercel: có dấu nháy bao quanh,
 * ký tự \n dạng chữ, xuống dòng bị đổi thành dấu cách, hoặc dán cả file JSON của service account.
 * Trả về PEM chuẩn (thân khóa chia dòng 64 ký tự).
 */
export function normalizePrivateKey(raw) {
  let s = String(raw ?? "").trim();
  if (s.startsWith("{")) {
    try { s = String(JSON.parse(s).private_key ?? ""); } catch { /* để bước dưới báo lỗi */ }
  }
  s = s.replace(/^["']+|["']+$/g, "");
  const m = s.match(/-----BEGIN ((?:RSA |EC )?PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  if (!m) return s.replace(/\\n/g, "\n"); // không nhận ra, trả nguyên để Node báo lỗi
  const body = m[2].replace(/\\n|\\r|\s/g, "");
  return `-----BEGIN ${m[1]}-----\n${body.match(/.{1,64}/g)?.join("\n") ?? ""}\n-----END ${m[1]}-----\n`;
}

export function createSheetsStore({ sheetId, email, privateKey, fetchImpl = fetch, now = () => Date.now() }) {
  const key = normalizePrivateKey(privateKey);
  let token = { value: null, exp: 0 };
  let guestCache = { rows: null, at: 0 };

  async function accessToken() {
    const t = Math.floor(now() / 1000);
    if (token.value && token.exp - 60 > t) return token.value;
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: t, exp: t + 3600 })}`;
    const sig = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    });
    if (!res.ok) throw new Error(`google token ${res.status}`);
    const data = await res.json();
    token = { value: data.access_token, exp: t + (data.expires_in || 3600) };
    return token.value;
  }

  async function call(method, path, { query = "", body } = {}) {
    const res = await fetchImpl(`${API}/${sheetId}/values/${path}${query}`, {
      method,
      headers: { authorization: `Bearer ${await accessToken()}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`sheets ${method} ${res.status}`);
    return res.json();
  }

  const read = async (range) => (await call("GET", encodeURIComponent(range))).values || [];
  const update = (range, values) =>
    call("PUT", encodeURIComponent(range), { query: "?valueInputOption=RAW", body: { values } });
  const append = (range, values) =>
    call("POST", `${encodeURIComponent(range)}:append`, { query: "?valueInputOption=RAW&insertDataOption=INSERT_ROWS", body: { values } });

  const toGuest = (r, i) => ({
    row: i + 2,
    slug: String(r[0] ?? "").trim(),
    name: String(r[1] ?? "").trim(),
    short: String(r[2] ?? "").trim(),
    call: safeCall(r[3]),
    openedAt: String(r[7] ?? "").trim(),
  });

  async function guestRows(force = false) {
    if (!force && guestCache.rows && now() - guestCache.at < GUEST_TTL_MS) return guestCache;
    const rows = (await read("Khach!A2:H")).map(toGuest).filter((g) => g.slug && g.name);
    guestCache = { rows, at: now() };
    return guestCache;
  }

  return {
    async getGuest(slug) {
      let { rows, at } = await guestRows();
      let g = rows.find((x) => x.slug === slug);
      if (!g && now() - at > MISS_REFRESH_MS) {
        ({ rows } = await guestRows(true));
        g = rows.find((x) => x.slug === slug);
      }
      return g || null;
    },

    async getRsvp(slug) {
      const rows = await read("XacNhan!A2:E");
      let hit = null;
      rows.forEach((r, i) => {
        if (String(r[0] ?? "").trim() === slug) hit = { r, row: i + 2 }; // nếu trùng dòng thì lấy dòng cuối
      });
      if (!hit) return null;
      const status = toStatus(hit.r[1]);
      if (!status) return null;
      return {
        row: hit.row,
        status,
        plusOnes: Number.parseInt(hit.r[2], 10) || 0,
        message: String(hit.r[3] ?? ""),
        updatedAt: String(hit.r[4] ?? ""),
      };
    },

    async upsertRsvp({ slug, status, plusOnes, message, updatedAt }) {
      const values = [[slug, STATUS_LABEL[status], plusOnes, message, updatedAt]];
      const existing = await this.getRsvp(slug);
      if (existing) await update(`XacNhan!A${existing.row}:E${existing.row}`, values);
      else await append("XacNhan!A:E", values);
    },

    async markOpened(slug, row, at) {
      await update(`Khach!H${row}`, [[at]]);
      const g = guestCache.rows?.find((x) => x.slug === slug);
      if (g) g.openedAt = at;
    },
  };
}
