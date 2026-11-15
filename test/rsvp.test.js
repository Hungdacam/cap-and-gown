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
  initRsvp({ ...state, rsvp: { status: "yes", plusOnes: 1, message: "Hẹn gặp" } });
  assert.equal(el("footLine").textContent, "Hẹn gặp chị ở buổi lễ");
  assert.equal(paragraphs.at(-1).textContent, "Cảm ơn chị đã dành buổi sáng cho mình.");
  assert.match(el("checks").innerHTML, /Sự có mặt của chị/);
  assert.match(el("log").innerHTML, /Chị đã trả lời: Sẽ đến/);
  assert.equal(el("yes").textContent, "✓ Sẽ đến");
  let payload;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true }) };
  });
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.equal(payload.slug, state.slug);
  assert.equal(payload.plusOnes, 1);
  assert.match(el("log").innerHTML, /Hẹn gặp chị lúc 10:00/);
});

test("xưng hô trống và thiệp chung dùng bạn, thiệp chung không có form xác nhận", (t) => {
  const { el } = setupDocument(t);
  initRsvp({ ...state, guest: { ...guest, call: " " } });
  assert.match(el("checks").innerHTML, /Sự có mặt của bạn/);
  renderGuestCopy(GENERIC_GUEST);
  initRsvp({ slug: "", guest: GENERIC_GUEST, rsvp: null, mode: "generic" });
  assert.equal(el("footLine").textContent, "Hẹn gặp bạn ở buổi lễ");
  assert.equal(el("rsvpBtns").hidden, true);
  assert.equal(el("rsvpForm").hidden, true);
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
  await el("rsvpForm").events.submit({ preventDefault() {} });
  assert.match(el("log").innerHTML, /Sếp &lt;img/);
  assert.ok(!el("log").innerHTML.includes("<img"));
  assert.equal(el("rsvpSend").disabled, false);
});
