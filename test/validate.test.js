import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidSlug, parseRsvpBody, safeCall, CALLS } from "../api/_lib/validate.js";
import { GUEST_CALLS } from "../public/src/config.js";

test("danh sách xưng hô ở client và server khớp nhau", () => {
  assert.deepEqual(CALLS, GUEST_CALLS);
});

test("slug hợp lệ và không hợp lệ", () => {
  for (const s of ["thuy-duong-k7q2", "abc", "a-b-c-1"]) assert.equal(isValidSlug(s), true, s);
  for (const s of ["", "ab", "Thuy-Duong", "a b c", "../etc/passwd", "x".repeat(65), null, undefined, 123, "thủy-dương"]) assert.equal(isValidSlug(s), false, String(s));
});

test("xưng hô lạ rơi về 'bạn'", () => {
  assert.equal(safeCall("Chị"), "chị");
  assert.equal(safeCall(" cả nhóm "), "cả nhóm");
  assert.equal(safeCall("sếp"), "bạn");
  assert.equal(safeCall(undefined), "bạn");
});

const ok = (o) => ({ slug: "thuy-duong-k7q2", status: "yes", ...o });

test("rsvp hợp lệ, mặc định plusOnes 0 và message rỗng", () => {
  const r = parseRsvpBody(ok());
  assert.deepEqual(r, { ok: true, value: { slug: "thuy-duong-k7q2", status: "yes", plusOnes: 0, message: "" } });
});

test("rsvp: 'no' luôn ép plusOnes về 0", () => {
  const r = parseRsvpBody(ok({ status: "no", plusOnes: 3 }));
  assert.equal(r.value.plusOnes, 0);
});

test("rsvp: chuỗi số được chấp nhận, ngoài 0..5 hoặc không nguyên bị từ chối", () => {
  assert.equal(parseRsvpBody(ok({ plusOnes: "2" })).value.plusOnes, 2);
  for (const v of [-1, 6, 1.5, "abc", {}, NaN]) assert.equal(parseRsvpBody(ok({ plusOnes: v })).error, "bad_plus_ones", String(v));
});

test("rsvp: status và slug sai bị từ chối", () => {
  assert.equal(parseRsvpBody(ok({ status: "ok" })).error, "bad_status");
  assert.equal(parseRsvpBody(ok({ slug: "A" })).error, "bad_slug");
  for (const b of [null, undefined, "x", [], 5]) assert.equal(parseRsvpBody(b).error, "bad_body");
});

test("rsvp: lời nhắn được làm sạch và giới hạn 300 ký tự", () => {
  assert.equal(parseRsvpBody(ok({ message: "  Chào bạn\u0000\u0007  " })).value.message, "Chào bạn");
  assert.equal(parseRsvpBody(ok({ message: "a\nb" })).value.message, "a\nb");
  assert.equal(parseRsvpBody(ok({ message: "ê".repeat(300) })).ok, true);
  assert.equal(parseRsvpBody(ok({ message: "ê".repeat(301) })).error, "message_too_long");
  assert.equal(parseRsvpBody(ok({ message: 5 })).error, "bad_message");
});
