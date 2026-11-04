import { test } from "node:test";
import assert from "node:assert/strict";
import { googleCalendarUrl, buildIcs, calendarRange } from "../public/src/calendar.js";
import { formatDateVi, formatDayMonth } from "../public/src/util.js";

test("giờ lịch đúng: 10:00–11:30 giờ Việt Nam là 03:00–04:30 UTC", () => {
  const { start, end } = calendarRange();
  assert.equal(start.toISOString(), "2026-11-25T03:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-25T04:30:00.000Z");
});

test("link Google Calendar có đủ tham số", () => {
  const u = new URL(googleCalendarUrl());
  assert.equal(u.origin + u.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(u.searchParams.get("action"), "TEMPLATE");
  assert.equal(u.searchParams.get("dates"), "20261125T030000Z/20261125T043000Z");
  assert.equal(u.searchParams.get("ctz"), "Asia/Ho_Chi_Minh");
  assert.match(u.searchParams.get("location"), /12 Nguyễn Văn Bảo/);
});

test("file .ics đúng cấu trúc RFC 5545", () => {
  const ics = buildIcs(new Date("2026-11-05T00:00:00Z"));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.match(ics, /DTSTART:20261125T030000Z\r\n/);
  assert.match(ics, /DTEND:20261125T043000Z\r\n/);
  assert.match(ics, /DTSTAMP:20261105T000000Z\r\n/);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2);
  assert.equal(ics.includes("\n") && !/[^\r]\n/.test(ics), true, "mọi xuống dòng là CRLF");
  // dấu phẩy trong địa điểm phải được escape
  assert.match(ics.replace(/\r\n /g, ""), /LOCATION:.*Nguyễn Văn Bảo\\, Gò Vấp/);
  // không dòng nào quá 75 byte
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});

test("định dạng ngày tiếng Việt", () => {
  assert.equal(formatDateVi("2026-11-25"), "Thứ Tư, 25/11/2026");
  assert.equal(formatDateVi("2026-12-12"), "Thứ Bảy, 12/12/2026");
  assert.equal(formatDayMonth("2026-11-23"), "23/11");
});
