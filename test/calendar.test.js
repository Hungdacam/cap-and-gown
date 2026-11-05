import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { googleCalendarUrl, buildIcs, calendarRange, icsText, needsSafariForIcs } from "../public/src/calendar.js";
import { formatDateVi, formatDayMonth } from "../public/src/util.js";
import calendarHandler from "../api/calendar.js";
import { fakeRes } from "./helpers.js";

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

test("ký tự đặc biệt trong .ics được escape, kể cả dấu chấm phẩy", () => {
  assert.equal(icsText("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne");
});

test("GET /api/calendar trả file lịch để iPhone mở hộp thêm lịch", () => {
  const res = fakeRes();
  calendarHandler({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"], /^text\/calendar/);
  assert.match(res.headers["content-disposition"], /^inline/);
  assert.ok(res.body.startsWith("BEGIN:VCALENDAR\r\n"));

  const head = fakeRes();
  calendarHandler({ method: "HEAD" }, head);
  assert.equal(head.statusCode, 200);
  assert.equal(head.body, undefined);

  const bad = fakeRes();
  calendarHandler({ method: "POST" }, bad);
  assert.equal(bad.statusCode, 405);
});

test("nút .ics là link thật, không có download để iPhone không chỉ lưu vào Tệp", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const tag = html.match(/<a [^>]*id="calIcs"[^>]*>/)?.[0];
  assert.ok(tag?.includes('href="/api/calendar"'));
  assert.ok(!tag.includes("download"));
});

test("chỉ nhắc mở Safari khi đang ở iPhone/iPad và không phải Safari", () => {
  const ios = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
  assert.equal(needsSafariForIcs(`${ios} Version/17.0 Mobile/15E148 Safari/604.1`), false);
  assert.equal(needsSafariForIcs(`${ios} CriOS/120.0 Mobile/15E148 Safari/604.1`), true);
  assert.equal(needsSafariForIcs(`${ios} Mobile/15E148 Zalo iOS/500`), true);
  assert.equal(needsSafariForIcs(`${ios} Mobile/15E148 [FBAN/FBIOS;FBAV/400.0]`), true);
  const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
  assert.equal(needsSafariForIcs(mac, 0), false);
  assert.equal(needsSafariForIcs(mac, 5), false, "iPad giả làm Mac nhưng vẫn là Safari");
  assert.equal(needsSafariForIcs("Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36"), false);
});

test("định dạng ngày tiếng Việt", () => {
  assert.equal(formatDateVi("2026-11-25"), "Thứ Tư, 25/11/2026");
  assert.equal(formatDateVi("2026-12-12"), "Thứ Bảy, 12/12/2026");
  assert.equal(formatDayMonth("2026-11-23"), "23/11");
});
