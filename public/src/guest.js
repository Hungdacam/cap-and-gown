import { COPY } from "./config.js";
import { isValidSlug } from "./slug.js";
export { pronoun } from "./address.js";

/** Slug khách lấy từ /t/<slug>, hoặc #<slug> để chạy thử. */
export function getSlug(loc = location) {
  const m = loc.pathname.match(/^\/t\/([^/]+)\/?$/);
  if (m && isValidSlug(m[1])) return m[1];
  const h = (loc.hash || "").slice(1);
  return isValidSlug(h) ? h : "";
}

export const GENERIC_GUEST = { name: COPY.genericName, call: "bạn", short: "" };

/**
 * Trả về { guest, rsvp } khi có khách, null khi link không tồn tại (404).
 * Lỗi mạng hoặc lỗi server thì ném lỗi để giao diện báo riêng.
 */
export async function fetchGuest(slug, fetchImpl = fetch) {
  const res = await fetchImpl(`/api/guest?slug=${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`guest ${res.status}`);
  const data = await res.json();
  return {
    guest: { name: data.name, call: data.call, short: data.short?.trim() || data.name || "", shared: data.shared === true },
    rsvp: data.rsvp || null,
    party: data.party || null, // chỉ có với khách được mời tiệc thân mật
  };
}

/** Lời chúc (chữ ký không bắt buộc) từ link công khai. Ném lỗi kèm mã (`err.code`) để giao diện báo đúng. */
export async function sendWish(payload, fetchImpl = fetch) {
  const res = await fetchImpl("/api/wish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = new Error(`wish ${res.status}`);
    err.code = res.status === 429 ? "too_many" : (await res.json().catch(() => ({}))).error || "server_error";
    throw err;
  }
  return res.json();
}

export async function sendRsvp(payload, fetchImpl = fetch) {
  const res = await fetchImpl("/api/rsvp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`rsvp ${res.status}`);
  return res.json();
}
