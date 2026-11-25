import { test } from "node:test";
import assert from "node:assert/strict";
import { getSlug, pronoun, fetchGuest, GENERIC_GUEST } from "../public/src/guest.js";
import { guestText } from "../public/src/address.js";
import { COPY } from "../public/src/config.js";

test("slug từ link và hash giữ nguyên chữ hoa như trong Sheet", () => {
  assert.equal(getSlug({ pathname: "/t/cM-bV", hash: "" }), "cM-bV");
  assert.equal(getSlug({ pathname: "/t/cM-bV/", hash: "" }), "cM-bV");
  assert.equal(getSlug({ pathname: "/", hash: "#cM-bV" }), "cM-bV");
  assert.equal(getSlug({ pathname: "/t/my-linh-c3d4", hash: "" }), "my-linh-c3d4");
  for (const pathname of ["/", "/t/ab", "/t/has space", "/t/a_b", "/t/abc/def", `/t/${"A".repeat(65)}`]) {
    assert.equal(getSlug({ pathname, hash: "" }), "", pathname);
  }
});

test("lời chào trên splash ghép đúng tên gọi", () => {
  assert.equal(pronoun({ call: "chị", short: "Linh" }), "chị Linh");
  assert.equal(pronoun({ call: "anh em", short: "" }), "anh em");
  assert.equal(pronoun({ call: "bạn", short: "" }), "bạn");
  assert.equal(pronoun({ call: "cả nhóm", short: "K17" }), "cả nhóm");
  assert.equal(pronoun({ call: "anh em", short: "K17" }), "anh em");
  assert.equal(pronoun({ call: "sếp", short: "Hòa" }), "sếp Hòa");
  assert.equal(pronoun({ call: " ", short: "Minh Anh" }), "Minh Anh");
  assert.equal(pronoun({ short: "Minh Anh" }), "Minh Anh");
  assert.equal(pronoun({ call: "cô", short: "Cô Mai" }), "Cô Mai");
  assert.equal(pronoun(GENERIC_GUEST), "mọi người");
});

test("Hưng cảm ơn cô Mai và bác Vinh, không tự thêm bạn khi để trống xưng hô", () => {
  const guest = { name: "Cô Mai và bác Vinh", short: "cô Mai và bác Vinh", call: "" };
  assert.equal(pronoun(guest), "cô Mai và bác Vinh");
  assert.match(guestText(COPY.lede, guest), /Cảm ơn cô Mai và bác Vinh đã dành cho Hưng/);
  assert.equal(guestText(COPY.footerLine, guest), "Hưng cảm ơn cô Mai và bác Vinh rất nhiều");
  assert.equal(pronoun({ call: "cô", short: "Mai và bác Vinh" }), "cô Mai và bác Vinh");
});

test("thiếu tên gọi thì dùng họ tên, không ghép trùng danh xưng", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ name: "Cô Mai", short: " ", call: "cô" }) });
  const found = await fetchGuest("co-mai-1234", fetchImpl);
  assert.equal(pronoun(found.guest), "Cô Mai");
  assert.equal(found.guest.photo, "");
});

test("ảnh riêng chỉ nhận đường dẫn trong /media/khach/", async () => {
  const get = (photo) => fetchGuest("a-b-1", async () => ({ ok: true, json: async () => ({ name: "A", short: "A", call: "anh", photo }) }));
  assert.equal((await get("/media/khach/a.jpg")).guest.photo, "/media/khach/a.jpg");
  for (const p of ["https://x.com/a.jpg", "javascript:alert(1)", 5, undefined]) assert.equal((await get(p)).guest.photo, "", String(p));
});

test("câu cá nhân hóa dùng xưng hô từ Sheet, link công khai gọi mọi người", () => {
  const text = "Hẹn gặp {call}; thân gửi {pron}.";
  assert.equal(guestText(text, { call: "chị", short: "Linh" }), "Hẹn gặp chị; thân gửi chị Linh.");
  assert.equal(guestText(text, { call: "cậu", short: "Anh" }), "Hẹn gặp cậu; thân gửi cậu Anh.");
  assert.equal(guestText(text, GENERIC_GUEST), "Hẹn gặp mọi người; thân gửi mọi người.");
  assert.equal(guestText(text), "Hẹn gặp bạn; thân gửi bạn.");
  assert.equal(guestText("Hẹn gặp {pron}", { call: "chị", short: "{call}" }), "Hẹn gặp chị {call}");
});
