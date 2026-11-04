export const SLUG_RE = /^[a-z0-9-]{3,64}$/;
export const STATUSES = ["yes", "maybe", "no"];
// Phải trùng với GUEST_CALLS trong public/src/config.js (có test kiểm tra)
export const CALLS = ["bạn", "anh", "chị", "em", "thầy", "cô", "cả nhóm"];
export const MAX_MESSAGE = 300;
export const MAX_PLUS_ONES = 5;

export const isValidSlug = (s) => typeof s === "string" && SLUG_RE.test(s);

/** Xưng hô lạ trong Sheet thì rơi về "bạn", không làm hỏng thiệp. */
export const safeCall = (c) => {
  const v = String(c ?? "").trim().toLowerCase();
  return CALLS.includes(v) ? v : "bạn";
};

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

  let message = body.message ?? "";
  if (typeof message !== "string") return { ok: false, error: "bad_message" };
  // bỏ ký tự điều khiển (giữ xuống dòng), rồi cắt khoảng trắng hai đầu
  message = message.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();
  if ([...message].length > MAX_MESSAGE) return { ok: false, error: "message_too_long" };

  return { ok: true, value: { slug, status, plusOnes, message } };
}
