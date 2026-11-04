import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSlug, makeRow, unaccent } from "../scripts/new-guest.mjs";
import { isValidSlug } from "../api/_lib/validate.js";

test("bỏ dấu tiếng Việt kể cả đ", () => {
  assert.equal(unaccent("Đặng Thùy Dương"), "Dang Thuy Duong");
});

test("slug tạo ra luôn hợp lệ với API và không trùng", () => {
  const used = new Set();
  const slugs = Array.from({ length: 300 }, () => makeSlug("Nguyễn Hoàng Quốc", "anh", used));
  assert.equal(new Set(slugs).size, 300);
  for (const s of slugs) { assert.ok(isValidSlug(s), s); assert.match(s, /^hoang-quoc-[a-z0-9]{4}$/); }
});

test("dòng cho Sheet có đủ 8 cột; nhóm không có tên gọi ngắn", () => {
  const r = makeRow({ name: "Trần Thị Mỹ Linh", call: "chị", group: "Lớp", channel: "Zalo" }, new Set());
  assert.equal(r.cells.length, 8);
  assert.deepEqual(r.cells.slice(1, 6), ["Trần Thị Mỹ Linh", "Linh", "chị", "Lớp", "Zalo"]);
  const g = makeRow({ name: "Hội K17 thân yêu", call: "cả nhóm" }, new Set());
  assert.equal(g.cells[2], "");
  assert.match(g.slug, /^hoi-k17-than-[a-z0-9]{4}$/);
  assert.equal(makeRow({ name: "A B", call: "sếp" }, new Set()).cells[3], "bạn");
});
