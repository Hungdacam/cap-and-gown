import { EVENT } from "./config.js";

export const $ = (id) => document.getElementById(id);

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const pad2 = (n) => String(n).padStart(2, "0");
export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Hiệu ứng chỉ để trang trí: thiếu GSAP thì thiệp vẫn phải dùng được. */
export const canAnimate = () =>
  ["gsap", "ScrollTrigger", "ScrollSmoother"].every((lib) => window[lib]) && !prefersReducedMotion();

/** Thời điểm `time` (HH:MM) của ngày lễ, theo múi giờ cấu hình. */
export const eventAt = (time) => new Date(`${EVENT.date}T${time}:00${EVENT.tz}`);

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-11-25" -> "Thứ Tư, 25/11/2026" */
export function formatDateVi(isoDate, tz = EVENT.tz) {
  const [y, m, d] = isoDate.split("-");
  const wd = new Date(`${isoDate}T12:00:00${tz}`).getUTCDay();
  return `${WEEKDAYS[wd]}, ${d}/${m}/${y}`;
}

/** "2026-11-23" -> "23/11" */
export const formatDayMonth = (isoDate) => {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
};
