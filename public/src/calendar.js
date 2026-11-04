import { EVENT, CALENDAR } from "./config.js";
import { eventAt } from "./util.js";

// 2026-11-25T03:00:00.000Z -> 20261125T030000Z
const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function calendarRange() {
  return { start: eventAt(EVENT.guestArrive), end: eventAt(EVENT.calendarEnd) };
}

export function googleCalendarUrl() {
  const { start, end } = calendarRange();
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: CALENDAR.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: CALENDAR.details,
    location: `${EVENT.school}, ${EVENT.address}`,
    ctz: "Asia/Ho_Chi_Minh",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

// RFC 5545: escape \ ; , và xuống dòng
const icsText = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// RFC 5545: dòng tối đa 75 byte, gập dòng bằng CRLF + space
function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(now = new Date()) {
  const { start, end } = calendarRange();
  const alarm = (trigger, desc) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(desc)}`, `TRIGGER:${trigger}`, "END:VALARM"];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//cap-and-gown//thiep-tot-nghiep//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${EVENT.date}-tot-nghiep@cap-and-gown`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(CALENDAR.title)}`,
    `LOCATION:${icsText(`${EVENT.school}, ${EVENT.address}`)}`,
    `DESCRIPTION:${icsText(CALENDAR.details)}`,
    ...alarm("-P1D", "Ngày mai là buổi chúc mừng tốt nghiệp"),
    ...alarm("-PT2H", "Còn 2 giờ nữa là buổi chúc mừng tốt nghiệp"),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chuc-mung-tot-nghiep.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
