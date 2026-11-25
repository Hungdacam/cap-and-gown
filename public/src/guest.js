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

/** Link công khai (không có slug hoặc slug không có trong danh sách): gửi chung cho mọi người. */
export const GENERIC_GUEST = { name: COPY.genericName, call: COPY.genericCall, short: "" };

/**
 * Trả về { guest } khi có khách, null khi link không tồn tại (404).
 * guest.photo: đường dẫn ảnh riêng (cột anh_rieng), trống nếu không có. Lỗi mạng hoặc lỗi server thì ném lỗi.
 */
export async function fetchGuest(slug, fetchImpl = fetch) {
  const res = await fetchImpl(`/api/guest?slug=${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`guest ${res.status}`);
  const data = await res.json();
  const photo = typeof data.photo === "string" && data.photo.startsWith("/media/khach/") ? data.photo : "";
  return { guest: { name: data.name, call: data.call, short: data.short?.trim() || data.name || "", shared: data.shared === true, photo } };
}

/** Lời nhắn gửi Hưng (chữ ký không bắt buộc). Ném lỗi kèm mã (`err.code`) để giao diện báo đúng. */
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
