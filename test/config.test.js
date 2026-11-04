import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as C from "../public/src/config.js";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

test("giờ trong cấu hình hợp lệ và đúng thứ tự", () => {
  for (const t of [C.EVENT.ceremonyStart, C.EVENT.guestArrive, C.EVENT.guestWindowEnd, C.EVENT.calendarEnd]) assert.match(t, hhmm);
  assert.ok(C.EVENT.guestArrive < C.EVENT.guestWindowEnd && C.EVENT.guestWindowEnd <= C.EVENT.calendarEnd);
  assert.match(C.EVENT.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(C.EVENT.rsvpDeadline < C.EVENT.date);
});

test("lịch trình hợp lệ, không chồng nhau", () => {
  C.SCHEDULE.forEach((s, i) => {
    assert.match(s.at, hhmm); assert.match(s.end, hhmm); assert.ok(s.at < s.end);
    if (i) assert.ok(C.SCHEDULE[i - 1].end <= s.at, `${s.title} chồng giờ`);
  });
});

test("mỗi lộ trình trỏ tới id có thật trong sơ đồ, và id mặc định tồn tại", () => {
  const ids = new Set();
  for (const r of C.ROUTES) {
    assert.ok(!ids.has(r.id), `trùng id ${r.id}`); ids.add(r.id);
    assert.ok(html.includes(`id="${r.focus}"`), `thiếu #${r.focus} trong index.html`);
    assert.match(r.path, /^M[\d\sMHVL.]+$/);
    assert.ok(r.hops.length >= 2);
  }
  assert.ok(ids.has(C.DEFAULT_ROUTE));
  for (const id of ["route", "grid", "tabs", "trace", "meetLabel"]) assert.ok(html.includes(`id="${id}"`), id);
});

test("mọi id mà JS tìm đều có trong index.html", () => {
  const src = ["main", "render", "rsvp", "map", "countdown"].map((f) => readFileSync(new URL(`../public/src/${f}.js`, import.meta.url), "utf8")).join("\n");
  const wanted = new Set([...src.matchAll(/\$\("([A-Za-z0-9_-]+)"\)/g)].map((m) => m[1]));
  ["yes", "maybe", "no"].forEach((i) => wanted.add(i));
  const missing = [...wanted].filter((id) => !html.includes(`id="${id}"`) && !["yes", "maybe", "no"].includes(id));
  assert.deepEqual(missing, []);
});

test("mức độ lưu ý hợp lệ", () => {
  for (const n of C.NOTES) assert.ok(n.sev in C.SEV_LABEL);
});
