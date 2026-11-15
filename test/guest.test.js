import { test } from "node:test";
import assert from "node:assert/strict";
import { greeting, pronoun, GENERIC_GUEST } from "../public/src/guest.js";
import { guestText } from "../public/src/address.js";

test("lời chào: thầy cô là Kính gửi, còn lại là Thân gửi", () => {
  assert.equal(greeting({ call: "cô" }), "Kính gửi");
  assert.equal(greeting({ call: "thầy" }), "Kính gửi");
  assert.equal(greeting({ call: "chị" }), "Thân gửi");
  assert.equal(greeting({ call: "cả nhóm" }), "Thân gửi");
  assert.equal(greeting({ call: "  Cô  " }), "Kính gửi");
});

test("lời chào trên splash ghép đúng tên gọi", () => {
  assert.equal(pronoun({ call: "chị", short: "Linh" }), "chị Linh");
  assert.equal(pronoun({ call: "anh em", short: "" }), "anh em");
  assert.equal(pronoun({ call: "bạn", short: "" }), "bạn");
  assert.equal(pronoun({ call: "cả nhóm", short: "K17" }), "cả nhóm");
  assert.equal(pronoun({ call: "anh em", short: "K17" }), "anh em");
  assert.equal(pronoun({ call: "sếp", short: "Hòa" }), "sếp Hòa");
  assert.equal(pronoun({ call: " ", short: "Minh Anh" }), "bạn Minh Anh");
  assert.equal(pronoun({ short: "Minh Anh" }), "bạn Minh Anh");
  assert.equal(pronoun(GENERIC_GUEST), "bạn");
});

test("câu cá nhân hóa dùng xưng hô từ Sheet, thiệp chung mặc định bạn", () => {
  const text = "Hẹn gặp {call}; thân gửi {pron}.";
  assert.equal(guestText(text, { call: "chị", short: "Linh" }), "Hẹn gặp chị; thân gửi chị Linh.");
  assert.equal(guestText(text, { call: "cậu", short: "Anh" }), "Hẹn gặp cậu; thân gửi cậu Anh.");
  assert.equal(guestText(text, GENERIC_GUEST), "Hẹn gặp bạn; thân gửi bạn.");
  assert.equal(guestText(text), "Hẹn gặp bạn; thân gửi bạn.");
  assert.equal(guestText("Hẹn gặp {pron}", { call: "chị", short: "{call}" }), "Hẹn gặp chị {call}");
});
