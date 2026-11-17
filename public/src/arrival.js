import { EVENT } from "./config.js";

// Khung giờ khách chọn sẽ đến. API dùng mã (id); cột F tab XacNhan lưu nhãn.
// Dùng chung cho frontend, API và Sheets.
const [W1, W2] = EVENT.guestWindows;
const span = (w) => `${w.from}–${w.to}`;

export const ARRIVALS = [
  { id: "dot1", label: `Đợt 1 · ${span(W1)}`, when: span(W1) },
  { id: "dot2", label: `Đợt 2 · ${span(W2)}`, when: span(W2) },
  { id: "ca-hai", label: "Cả hai đợt", when: `${span(W1)} và ${span(W2)}` },
];

export const isArrival = (v) => ARRIVALS.some((a) => a.id === v);
export const findArrival = (id) => ARRIVALS.find((a) => a.id === id) || null;

/** Đọc ô trong Sheet: nhận mã, hoặc nhãn bắt đầu bằng "Đợt 1", "Đợt 2", "Cả hai" (kể cả khi đã đổi giờ). Không nhận ra thì trả "". */
export function toArrival(cell) {
  const v = String(cell ?? "").trim().normalize("NFC");
  if (isArrival(v)) return v;
  const n = v.toLowerCase();
  if (/^đợt\s*1(\D|$)/.test(n)) return "dot1";
  if (/^đợt\s*2(\D|$)/.test(n)) return "dot2";
  if (n.startsWith("cả hai")) return "ca-hai";
  return "";
}
