// Các xưng hô gợi ý; Sheet có thể dùng cách gọi khác.
export const GUEST_CALLS = ["bạn", "anh", "chị", "em", "thầy", "cô", "cả nhóm", "anh em"];
const GROUP_CALLS = ["cả nhóm", "anh em"];

/** Giữ xưng hô tùy chỉnh và ô trống; chỉ thiệp chung mới mặc định là "bạn". */
export function normalizeCall(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, " ").trim().replace(/\s+/g, " ").toLowerCase();
}

export const isGroupCall = (call) => GROUP_CALLS.includes(normalizeCall(call));

/** Cách gọi kèm tên ở lời mời và màn hình mở đầu. */
export function pronoun(guest) {
  const call = normalizeCall(guest.call);
  const short = typeof guest.short === "string" ? guest.short.trim() : "";
  if (isGroupCall(call)) return call;
  if (!call) return short || (typeof guest.name === "string" && guest.name.trim()) || "bạn";
  if (!short) return call;
  // Tên gọi đã có danh xưng thì giữ nguyên, tránh "cô cô Mai".
  return short.normalize("NFC").toLowerCase().startsWith(`${call} `) ? short : `${call} ${short}`;
}

/** {call}: xưng hô; {pron}: xưng hô kèm tên gọi. Thay trước khi escape HTML. */
export function guestText(text, guest = {}) {
  return text.replace(/\{(call|pron)\}/g, (_, token) => token === "pron" ? pronoun(guest) : normalizeCall(guest.call) || pronoun(guest));
}
