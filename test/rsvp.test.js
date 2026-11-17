import { test } from "node:test";
import assert from "node:assert/strict";
import { initRsvp } from "../public/src/rsvp.js";
import { renderGuestCopy } from "../public/src/render.js";
import { GENERIC_GUEST } from "../public/src/guest.js";
import { SCHEDULE } from "../public/src/config.js";

function setupDocument(t) {
  const previous = globalThis.document;
  const elements = new Map();
  const paragraphs = SCHEDULE.map(() => ({ textContent: "" }));
  const getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, {
      textContent: "", innerHTML: "", value: "", hidden: false,
      events: {}, attributes: {}, classList: { toggle() {} },
      addEventListener(event, callback) { this.events[event] = callback; },
      setAttribute(name, value) { this.attributes[name] = value; },
    });
    return elements.get(id);
  };
  globalThis.document = { getElementById, querySelectorAll: () => paragraphs };
  t.after(() => {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  });
  return { el: getElementById, paragraphs };
}

const guest = { name: "Trần Thị Mỹ Linh", short: "Linh", call: "chị" };
const state = { slug: "my-linh-c3d4", guest, rsvp: null, mode: "ok" };

test("khách đã xác nhận vẫn được gọi đúng xưng hô khi mở lại và cập nhật", async (t) => {
  const { el, paragraphs } = setupDocument(t);
  renderGuestCopy(guest);
  initRsvp({ ...state, rsvp: { status: "yes", plusOnes: 1, arrival: "dot2", message: "Hẹn gặp" } });
  assert.equal(el("footLine").textContent, "Hưng hẹn gặp chị Linh ở buổi lễ");
  assert.equal(paragraphs.at(-1).textContent, "Chụp ảnh cùng Hưng sau khi nhận bằng. Hưng cảm ơn chị Linh đã dành thời gian đến chung vui.");
  assert.match(el("checks").innerHTML, /Sự có mặt của chị Linh/);
  assert.match(el("log").innerHTML, /Chị Linh đã trả lời: Sẽ đến · Đợt 2 · 12:30–13:30/);
  assert.equal(el("arrival").value, "dot2");
  assert.equal(el("yes").textContent, "✓ Sẽ đến");
  let payload;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true }) };
  });
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.equal(payload.slug, state.slug);
  assert.equal(payload.plusOnes, 1);
  assert.equal(payload.arrival, "dot2");
  assert.match(el("log").innerHTML, /Hưng hẹn gặp chị Linh lúc 12:30–13:30 nhé/);
});

test("khách đã xác nhận trước khi có cột giờ đến: phải chọn khung giờ mới gửi lại được", async (t) => {
  const { el } = setupDocument(t);
  initRsvp({ ...state, rsvp: { status: "yes", plusOnes: 0, message: "" } });
  assert.equal(el("arrival").value, "");
  let sent = false;
  t.mock.method(globalThis, "fetch", async () => { sent = true; return { ok: true, json: async () => ({ ok: true }) }; });
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.equal(sent, false);
  assert.match(el("log").innerHTML, /Chị Linh chọn giúp Hưng khung giờ sẽ đến/);
  el("arrival").value = "ca-hai";
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.equal(sent, true);
  assert.match(el("log").innerHTML, /lúc 09:00–11:00 và 12:30–13:30 nhé/);
  el("no").events.click();
  assert.equal(el("arrivalField").hidden, true);
});

test("xưng hô trống dùng tên; thiệp chung dùng bạn và không có form xác nhận", (t) => {
  const { el } = setupDocument(t);
  initRsvp({ ...state, guest: { ...guest, call: " " } });
  assert.match(el("checks").innerHTML, /Sự có mặt của Linh/);
  renderGuestCopy(GENERIC_GUEST);
  initRsvp({ slug: "", guest: GENERIC_GUEST, rsvp: null, mode: "generic" });
  assert.equal(el("footLine").textContent, "Hưng hẹn gặp bạn ở buổi lễ");
  assert.equal(el("rsvpBtns").hidden, true);
  assert.equal(el("rsvpForm").hidden, true);
  assert.match(el("checks").innerHTML, /Gửi Hưng vài lời chúc ↓/, "thiệp chung không còn chờ xác nhận");
});

test("xưng hô tùy chỉnh được escape trong checklist và thông báo RSVP", async (t) => {
  const { el } = setupDocument(t);
  const customGuest = { ...guest, call: 'sếp <img src=x onerror="alert(1)">' };
  initRsvp({ ...state, guest: customGuest, rsvp: { status: "yes" } });
  assert.match(el("checks").innerHTML, /sếp &lt;img/);
  assert.match(el("log").innerHTML, /Sếp &lt;img/);
  assert.ok(!el("checks").innerHTML.includes("<img"));
  t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  t.mock.method(console, "error", () => {});
  el("arrival").value = "dot1";
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.match(el("log").innerHTML, /liên hệ trực tiếp với Hưng/);
  assert.ok(!el("log").innerHTML.includes("<img"));
  assert.equal(el("rsvpSend").disabled, false);
});

test("phản hồi RSVP cho cô Mai và bác Vinh luôn xưng Hưng", async (t) => {
  const { el } = setupDocument(t);
  const recipients = { name: "Cô Mai và bác Vinh", short: "cô Mai và bác Vinh", call: "" };
  initRsvp({ ...state, guest: recipients, rsvp: { status: "yes" } });
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ ok: true }) }));
  el("arrival").value = "ca-hai";
  for (const status of ["yes", "maybe", "no"]) {
    el(status).events.click();
    await el("rsvpForm").events.submit({ preventDefault() {} });
    assert.match(el("log").innerHTML, /Hưng/);
    assert.match(el("log").innerHTML, /[Cc]ô Mai và bác Vinh/);
    assert.doesNotMatch(el("log").innerHTML, /mình|\bbạn\b/);
  }
});
