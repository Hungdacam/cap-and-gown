import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify, createSign } from "node:crypto";
import { createSheetsStore, STATUS_LABEL } from "../api/_lib/sheets.js";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" });
const envKey = pem.replace(/\n/g, "\\n"); // đúng dạng khi dán vào biến môi trường Vercel

const HEAD = ["slug", "ho_ten", "ten_goi", "xung_ho", "nhom", "kenh_gui", "da_gui", "mo_lan_dau", "link_chung", "anh_rieng"];

function setup({ khach = [], xacnhan = [], clock, head = HEAD } = {}) {
  const calls = [];
  const state = { khach, xacnhan, t: clock ?? 1_000_000_000_000 };
  const fetchImpl = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method || "GET", body: init.body, headers: init.headers });
    const json = (o) => ({ ok: true, status: 200, json: async () => o });
    if (u === "https://oauth2.googleapis.com/token") return json({ access_token: "tok", expires_in: 3600 });
    const m = u.match(/values\/([^?]+?)(:append)?(\?|$)/);
    const range = decodeURIComponent(m[1]);
    if ((init.method || "GET") === "GET") {
      if (range === "Khach!A1:Z") return json({ values: [head, ...state.khach] });
      if (range === "XacNhan!A2:F") return json({ values: state.xacnhan });
    }
    return json({});
  };
  const store = createSheetsStore({ sheetId: "SID", email: "bot@x.iam.gserviceaccount.com", privateKey: envKey, fetchImpl, now: () => state.t });
  return { store, calls, state };
}

const sheetCalls = (calls) => calls.filter((c) => c.url.includes("sheets.googleapis.com"));

test("JWT gửi lên Google đúng nội dung và chữ ký RS256 kiểm chứng được", async () => {
  const { store, calls } = setup({ khach: [["a-b-c1", "Nguyễn A", "A", "anh", "", "", "", ""]] });
  await store.getGuest("a-b-c1");
  const tokenCall = calls.find((c) => c.url.includes("oauth2"));
  const form = new URLSearchParams(String(tokenCall.body));
  assert.equal(form.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  const [h, p, s] = form.get("assertion").split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url")), { alg: "RS256", typ: "JWT" });
  const claim = JSON.parse(Buffer.from(p, "base64url"));
  assert.equal(claim.iss, "bot@x.iam.gserviceaccount.com");
  assert.equal(claim.scope, "https://www.googleapis.com/auth/spreadsheets");
  assert.equal(claim.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claim.exp - claim.iat, 3600);
  assert.equal(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s, "base64url")), true);
  assert.equal(sheetCalls(calls)[0].headers.authorization, "Bearer tok");
});

test("token được dùng lại cho các lần gọi sau", async () => {
  const { store, calls } = setup();
  await store.getRsvp("x-y-z1");
  await store.getRsvp("x-y-z1");
  assert.equal(calls.filter((c) => c.url.includes("oauth2")).length, 1);
});

test("getGuest map đúng cột, giữ xưng hô tùy chỉnh và ô trống", async () => {
  const { store } = setup({ khach: [["", "Dòng trống slug"], ["t-l-1abc", "Trần Thị Mỹ Linh", "Linh", "chị", "Lớp", "Zalo", "x", ""], ["s-e-2abc", "Sếp", "", "sếp"], ["a-b-3abc", "Nguyễn A", "A", " "]] });
  const g = await store.getGuest("t-l-1abc");
  assert.deepEqual(g, { row: 3, slug: "t-l-1abc", name: "Trần Thị Mỹ Linh", short: "Linh", call: "chị", openedAt: "", shared: false, photo: "" });
  assert.equal((await store.getGuest("s-e-2abc")).call, "sếp");
  assert.equal((await store.getGuest("a-b-3abc")).call, "");
  assert.equal(await store.getGuest("khong-co-1"), null);
});

test("slug có chữ hoa trong Sheet được tra đúng, không trùng với slug chữ thường", async () => {
  const { store } = setup({ khach: [["cM-bV", "Cô Mai và bác Vinh", "cô Mai và bác Vinh", ""], ["cm-bv", "Khách khác", "Khách khác", ""]] });
  assert.equal((await store.getGuest("cM-bV")).name, "Cô Mai và bác Vinh");
  assert.equal((await store.getGuest("cm-bv")).name, "Khách khác");
});

test("cache danh sách khách 60 giây, slug mới chỉ đọc lại khi cache cũ hơn 10 giây", async () => {
  const { store, calls, state } = setup({ khach: [["a-b-c1", "A", "A", "bạn"]] });
  const reads = () => sheetCalls(calls).filter((c) => c.url.includes("Khach")).length;
  await store.getGuest("a-b-c1");
  await store.getGuest("a-b-c1");
  assert.equal(reads(), 1, "lần 2 dùng cache");

  state.t += 5_000;
  assert.equal(await store.getGuest("moi-them-1"), null);
  assert.equal(reads(), 1, "cache mới (5 giây): không đọc lại khi thiếu slug");

  state.khach = [["a-b-c1", "A", "A", "bạn"], ["moi-them-1", "Mới Thêm", "Thêm", "em"]];
  state.t += 6_000; // cache 11 giây
  assert.equal((await store.getGuest("moi-them-1")).name, "Mới Thêm");
  assert.equal(reads(), 2, "cache > 10 giây: đọc lại một lần khi thiếu slug");

  state.t += 61_000;
  await store.getGuest("a-b-c1");
  assert.equal(reads(), 3, "quá 60 giây: đọc lại");
});

test("getRsvp: nhận nhãn tiếng Việt, lấy dòng cuối nếu trùng, null nếu chưa có", async () => {
  const { store } = setup({ xacnhan: [["a-b-c1", "Chưa chắc", "0", "", "2026-11-05T01:00:00.000Z"], ["x-y-z1", "yes", "1", "ok", "t"], ["a-b-c1", "Sẽ đến", "2", "Hẹn gặp", "2026-11-06T01:00:00.000Z", "Đợt 2 · 12:30–13:30"]] });
  assert.deepEqual(await store.getRsvp("a-b-c1"), { row: 4, status: "yes", plusOnes: 2, message: "Hẹn gặp", updatedAt: "2026-11-06T01:00:00.000Z", arrival: "dot2" });
  assert.equal((await store.getRsvp("x-y-z1")).status, "yes");
  assert.equal((await store.getRsvp("x-y-z1")).arrival, "", "dòng cũ chưa có cột F");
  assert.equal(await store.getRsvp("khong-co-1"), null);
});

test("cột giờ đến (F): nhận mã, nhãn, nhãn đã đổi giờ; ô lạ thì để trống", async () => {
  const rows = [["a-1-x", "Sẽ đến", "0", "", "t", "ca-hai"], ["a-2-x", "Sẽ đến", "0", "", "t", "đợt 1 (08:30–10:30)"], ["a-3-x", "Sẽ đến", "0", "", "t", "Cả hai đợt"], ["a-4-x", "Sẽ đến", "0", "", "t", "buổi chiều"]];
  const { store } = setup({ xacnhan: rows });
  assert.deepEqual(await Promise.all(["a-1-x", "a-2-x", "a-3-x", "a-4-x"].map(async (s) => (await store.getRsvp(s)).arrival)), ["ca-hai", "dot1", "ca-hai", ""]);
});

test("upsertRsvp: dòng mới thì append, đã có thì ghi đè đúng dòng, luôn RAW", async () => {
  const a = setup();
  await a.store.upsertRsvp({ slug: "a-b-c1", status: "yes", plusOnes: 1, arrival: "dot1", message: "=HYPERLINK(1)", updatedAt: "T" });
  const post = sheetCalls(a.calls).find((c) => c.method === "POST");
  assert.match(decodeURIComponent(post.url), /values\/XacNhan!A:F:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS/);
  assert.deepEqual(JSON.parse(post.body), { values: [["a-b-c1", STATUS_LABEL.yes, 1, "=HYPERLINK(1)", "T", "Đợt 1 · 09:00–11:00"]] });

  const b = setup({ xacnhan: [["x-y-z1", "Sẽ đến", "0", "", "t"], ["a-b-c1", "Chưa chắc", "0", "", "t", "Đợt 2 · 12:30–13:30"]] });
  await b.store.upsertRsvp({ slug: "a-b-c1", status: "no", plusOnes: 0, arrival: "", message: "", updatedAt: "T2" });
  const put = sheetCalls(b.calls).find((c) => c.method === "PUT");
  assert.match(decodeURIComponent(put.url), /values\/XacNhan!A3:F3\?valueInputOption=RAW/);
  assert.deepEqual(JSON.parse(put.body), { values: [["a-b-c1", "Không đi được", 0, "", "T2", ""]] }, "không đi thì xoá giờ đến cũ");
});

test("addWish append vào tab LoiChuc A:F (cột F là nguồn), luôn RAW để lời chúc hay chữ ký bắt đầu bằng = không thành công thức", async () => {
  const { store, calls } = setup();
  await store.addWish({ message: "=chúc mừng", name: "=Minh", createdAt: "2026-11-25T03:00:00.000Z", device: "iPhone · Zalo", ip: "1.2.3.4", source: "cty-dotb-x1" });
  const post = sheetCalls(calls).find((c) => c.method === "POST");
  assert.match(decodeURIComponent(post.url), /values\/LoiChuc!A:F:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS/);
  assert.deepEqual(JSON.parse(post.body), { values: [["2026-11-25T03:00:00.000Z", "=chúc mừng", "=Minh", "iPhone · Zalo", "1.2.3.4", "cty-dotb-x1"]] });
});

test("cột I link_chung: x, có, chung, true... đánh dấu link chung; trống hay giá trị khác là khách riêng", async () => {
  const row = (slug, flag) => [slug, "Nhóm", "", "anh chị", "", "", "", "", flag];
  const { store } = setup({ khach: [row("cty-a-1", "x"), row("cty-b-1", " Có "), row("cty-c-1", "chung"), row("cty-d-1", "TRUE"), row("le-e-1", ""), row("le-f-1", "không"), ["le-g-1", "Khách cũ", "G", "anh"]] });
  for (const s of ["cty-a-1", "cty-b-1", "cty-c-1", "cty-d-1"]) assert.equal((await store.getGuest(s)).shared, true, s);
  for (const s of ["le-e-1", "le-f-1", "le-g-1"]) assert.equal((await store.getGuest(s)).shared, false, s);
});

test("cột anh_rieng: tên file thành đường dẫn /media/khach/; tìm cột theo tiêu đề; tên lạ hay đường dẫn bị bỏ qua", async () => {
  const row = (slug, file) => [slug, "Khách", "", "anh", "", "", "", "", "", file];
  const { store } = setup({ khach: [row("a-a-1", "linh.jpg"), row("b-b-1", " dotb-all.webp "), row("c-c-1", ""), row("d-d-1", "../secret.jpg"), row("e-e-1", "a/b.png"), row("f-f-1", "anh.gif"), ["g-g-1", "Khách cũ", "G", "anh"]] });
  assert.equal((await store.getGuest("a-a-1")).photo, "/media/khach/linh.jpg");
  assert.equal((await store.getGuest("b-b-1")).photo, "/media/khach/dotb-all.webp");
  for (const s of ["c-c-1", "d-d-1", "e-e-1", "f-f-1", "g-g-1"]) assert.equal((await store.getGuest(s)).photo, "", s);

  // Chèn cột ở chỗ khác (cột K) vẫn đọc đúng theo tiêu đề; Sheet chưa có cột này thì không ai có ảnh riêng.
  const moved = setup({ head: [...HEAD.slice(0, 9), "ghi_chu", " Anh_Rieng "], khach: [["h-h-1", "H", "", "chị", "", "", "", "", "", "khong-phai.jpg", "h.jpg"]] });
  assert.equal((await moved.store.getGuest("h-h-1")).photo, "/media/khach/h.jpg");
  const noHead = setup({ head: HEAD.slice(0, 9), khach: [row("i-i-1", "i.jpg")] });
  assert.equal((await noHead.store.getGuest("i-i-1")).photo, "");
});

test("markOpened ghi cột H đúng dòng và cập nhật cache", async () => {
  const { store, calls } = setup({ khach: [["a-b-c1", "A", "A", "bạn"], ["c-d-e2", "B", "B", "bạn"]] });
  const g = await store.getGuest("c-d-e2");
  await store.markOpened("c-d-e2", g.row, "2026-11-25T03:00:00.000Z");
  const put = sheetCalls(calls).find((c) => c.method === "PUT");
  assert.match(decodeURIComponent(put.url), /values\/Khach!H3\?valueInputOption=RAW/);
  assert.equal((await store.getGuest("c-d-e2")).openedAt, "2026-11-25T03:00:00.000Z");
});

test("lỗi từ Google được ném ra để API trả 500", async () => {
  const store = createSheetsStore({
    sheetId: "S", email: "e", privateKey: envKey,
    fetchImpl: async (u) => (String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t", expires_in: 3600 }) } : { ok: false, status: 403, json: async () => ({}) }),
  });
  await assert.rejects(() => store.getGuest("a-b-c1"), /sheets GET 403/);
});

import { normalizePrivateKey } from "../api/_lib/sheets.js";

test("normalizePrivateKey: mọi kiểu dán sai phổ biến đều ra đúng khóa dùng được", () => {
  const pemNorm = pem.trim();
  const body = pemNorm.split("\n").slice(1, -1).join("");
  const variants = {
    "xuống dòng thật": pem,
    "ký tự \\n": pem.replace(/\n/g, "\\n"),
    "bao dấu nháy kép": `"${pem.replace(/\n/g, "\\n")}"`,
    "xuống dòng thành dấu cách": pemNorm.replace(/\n/g, " "),
    "thừa khoảng trắng hai đầu": `\n  ${pem}  \n`,
    "nguyên file JSON": JSON.stringify({ type: "service_account", private_key: pem }),
  };
  for (const [name, v] of Object.entries(variants)) {
    const out = normalizePrivateKey(v);
    assert.equal(out, pem, name);
    assert.doesNotThrow(() => createSign("RSA-SHA256").update("x").sign(out), name);
  }
  assert.ok(body.length > 100);
});

test("normalizePrivateKey: giá trị rỗng hoặc không phải khóa thì không làm hỏng, để Node báo lỗi", () => {
  assert.equal(normalizePrivateKey(undefined), "");
  assert.equal(normalizePrivateKey("không phải khóa"), "không phải khóa");
});
