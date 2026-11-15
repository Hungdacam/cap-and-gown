import { test } from "node:test";
import assert from "node:assert/strict";
import { pronoun, fetchGuest, GENERIC_GUEST } from "../public/src/guest.js";
import { guestText } from "../public/src/address.js";
import { COPY } from "../public/src/config.js";

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
  assert.equal(pronoun(GENERIC_GUEST), "bạn");
});

test("Hưng mời cô Mai và bác Vinh, không tự thêm bạn khi để trống xưng hô", () => {
  const guest = { name: "Cô Mai và bác Vinh", short: "cô Mai và bác Vinh", call: "" };
  assert.equal(pronoun(guest), "cô Mai và bác Vinh");
  assert.match(guestText(COPY.lede, guest), /Hưng rất mong cô Mai và bác Vinh sẽ có mặt/);
  assert.equal(guestText(COPY.footerLine, guest), "Hưng hẹn gặp cô Mai và bác Vinh ở buổi lễ");
  assert.equal(pronoun({ call: "cô", short: "Mai và bác Vinh" }), "cô Mai và bác Vinh");
});

test("thiếu tên gọi thì dùng họ tên, không ghép trùng danh xưng", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ name: "Cô Mai", short: " ", call: "cô" }) });
  const found = await fetchGuest("co-mai-1234", fetchImpl);
  assert.equal(pronoun(found.guest), "Cô Mai");
});

test("câu cá nhân hóa dùng xưng hô từ Sheet, thiệp chung mặc định bạn", () => {
  const text = "Hẹn gặp {call}; thân gửi {pron}.";
  assert.equal(guestText(text, { call: "chị", short: "Linh" }), "Hẹn gặp chị; thân gửi chị Linh.");
  assert.equal(guestText(text, { call: "cậu", short: "Anh" }), "Hẹn gặp cậu; thân gửi cậu Anh.");
  assert.equal(guestText(text, GENERIC_GUEST), "Hẹn gặp bạn; thân gửi bạn.");
  assert.equal(guestText(text), "Hẹn gặp bạn; thân gửi bạn.");
  assert.equal(guestText("Hẹn gặp {pron}", { call: "chị", short: "{call}" }), "Hẹn gặp chị {call}");
});
