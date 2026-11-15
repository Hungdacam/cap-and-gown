// Các xưng hô gợi ý; Sheet có thể dùng cách gọi khác.
export const GUEST_CALLS = ["bạn", "anh", "chị", "em", "thầy", "cô", "cả nhóm", "anh em"];
const GROUP_CALLS = ["cả nhóm", "anh em"];

/** Chỉ dùng "bạn" khi không có xưng hô; giữ cách gọi tùy chỉnh trong Sheet. */
export function normalizeCall(value) {
  if (typeof value !== "string") return "bạn";
  return value.normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, " ").trim().replace(/\s+/g, " ").toLowerCase() || "bạn";
}

export const isGroupCall = (call) => GROUP_CALLS.includes(normalizeCall(call));

/** Thầy cô thì "Kính gửi", còn lại "Thân gửi". */
export const greeting = (guest) => ["cô", "thầy"].includes(normalizeCall(guest.call)) ? "Kính gửi" : "Thân gửi";

/** Cách gọi kèm tên ở lời mời và màn hình mở đầu. */
export function pronoun(guest) {
  const call = normalizeCall(guest.call);
  const short = typeof guest.short === "string" ? guest.short.trim() : "";
  return short && !isGroupCall(call) ? `${call} ${short}` : call;
}

/** {call}: xưng hô; {pron}: xưng hô kèm tên gọi. Thay trước khi escape HTML. */
export function guestText(text, guest = {}) {
  return text.replace(/\{(call|pron)\}/g, (_, token) => token === "pron" ? pronoun(guest) : normalizeCall(guest.call));
}
