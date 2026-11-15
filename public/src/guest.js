import { COPY } from "./config.js";
export { pronoun } from "./address.js";

const SLUG_RE = /^[a-z0-9-]{3,64}$/;

/** Slug khách lấy từ /t/<slug>, hoặc #<slug> để chạy thử. */
export function getSlug(loc = location) {
  const m = loc.pathname.match(/^\/t\/([a-z0-9-]{3,64})\/?$/);
  if (m) return m[1];
  const h = (loc.hash || "").slice(1);
  return SLUG_RE.test(h) ? h : "";
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
  return { guest: { name: data.name, call: data.call, short: data.short?.trim() || data.name || "" }, rsvp: data.rsvp || null };
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
