import { normalizeCall } from "../../public/src/address.js";
import { isValidSlug } from "../../public/src/slug.js";
import { isArrival } from "../../public/src/arrival.js";
export { SLUG_RE, isValidSlug } from "../../public/src/slug.js";

export const STATUSES = ["yes", "maybe", "no"];
export { GUEST_CALLS as CALLS } from "../../public/src/address.js";
export const MAX_MESSAGE = 300;
export const MAX_PLUS_ONES = 5;

/** Xưng hô dùng chung với frontend; giữ ô trống để dùng nguyên tên gọi. */
export const safeCall = normalizeCall;

/**
 * Kiểm tra body của POST /api/rsvp.
 * Trả về { ok: true, value } hoặc { ok: false, error }.
 */
export function parseRsvpBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "bad_body" };
  const { slug, status } = body;
  if (!isValidSlug(slug)) return { ok: false, error: "bad_slug" };
  if (!STATUSES.includes(status)) return { ok: false, error: "bad_status" };

  let plusOnes = body.plusOnes ?? 0;
  if (typeof plusOnes === "string" && /^\d+$/.test(plusOnes)) plusOnes = Number(plusOnes);
  if (!Number.isInteger(plusOnes) || plusOnes < 0 || plusOnes > MAX_PLUS_ONES) return { ok: false, error: "bad_plus_ones" };
  if (status === "no") plusOnes = 0;

  // Khung giờ sẽ đến: bắt buộc khi "Sẽ đến", không bắt buộc khi "Chưa chắc", bỏ qua khi "Không đi được".
  let arrival = body.arrival ?? "";
  if (arrival !== "" && !isArrival(arrival)) return { ok: false, error: "bad_arrival" };
  if (status === "yes" && !arrival) return { ok: false, error: "missing_arrival" };
  if (status === "no") arrival = "";

  let message = body.message ?? "";
  if (typeof message !== "string") return { ok: false, error: "bad_message" };
  // bỏ ký tự điều khiển (giữ xuống dòng), rồi cắt khoảng trắng hai đầu
  message = message.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();
  if ([...message].length > MAX_MESSAGE) return { ok: false, error: "message_too_long" };

  return { ok: true, value: { slug, status, plusOnes, arrival, message } };
}

/**
 * Cột link_chung của tab Khach: đánh dấu slug gửi cho cả nhóm (group công ty, lớp...).
 * Nhiều người mở chung một link nên không nhận xác nhận (sẽ ghi đè nhau), chỉ nhận lời chúc, mỗi lời một dòng.
 */
export const isSharedFlag = (v) => /^(x|có|co|chung|1|true|yes)$/i.test(String(v ?? "").trim());
/** Cột khach_di_tiec: điền 1 (hoặc x, có) là khách được mời dự tiệc thân mật. */
export const isPartyFlag = (v) => /^(1|x|có|co|true|yes)$/i.test(String(v ?? "").trim());

export const MIN_WISH = 2;
export const MAX_WISH_NAME = 60;

/**
 * Kiểm tra body của POST /api/wish (lời chúc riêng tư từ link công khai).
 * `name` là chữ ký, không bắt buộc. `website` là ô bẫy bot: người thật không thấy nên luôn để trống.
 * Trả về { ok: true, value } | { ok: true, spam: true } | { ok: false, error }.
 */
export function parseWishBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "bad_body" };
  if (typeof body.website === "string" && body.website.trim()) return { ok: true, spam: true };
  let message = body.message ?? "";
  if (typeof message !== "string") return { ok: false, error: "bad_message" };
  message = message.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();
  if ([...message].length < MIN_WISH) return { ok: false, error: "empty_wish" };
  if ([...message].length > MAX_MESSAGE) return { ok: false, error: "message_too_long" };
  let name = body.name ?? "";
  if (typeof name !== "string") return { ok: false, error: "bad_name" };
  name = name.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if ([...name].length > MAX_WISH_NAME) return { ok: false, error: "name_too_long" };
  // slug của link chung (nếu có) chỉ để biết lời chúc từ nhóm nào; sai định dạng thì bỏ qua, không chặn lời chúc.
  const slug = isValidSlug(body.slug) ? body.slug : "";
  return { ok: true, value: { message, name, slug } };
}
