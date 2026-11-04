import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import guestHandler from "../api/guest.js";
import rsvpHandler from "../api/rsvp.js";
import { __setStoreForTests, getStore } from "../api/_lib/store.js";
import { fakeRes } from "./helpers.js";

let db, store;
beforeEach(() => {
  db = {
    guests: { "thuy-duong-k7q2": { row: 2, slug: "thuy-duong-k7q2", name: "Đặng Thùy Dương", short: "Dương", call: "chị", openedAt: "" } },
    rsvps: {}, opened: [], failOpen: false,
  };
  store = {
    getGuest: async (s) => db.guests[s] || null,
    getRsvp: async (s) => db.rsvps[s] || null,
    upsertRsvp: async (r) => { db.rsvps[r.slug] = { status: r.status, plusOnes: r.plusOnes, message: r.message, updatedAt: r.updatedAt }; },
    markOpened: async (slug, row, at) => { if (db.failOpen) throw new Error("boom"); db.opened.push([slug, row]); db.guests[slug].openedAt = at; },
  };
  __setStoreForTests(store);
});

const get = async (slug, method = "GET") => { const res = fakeRes(); await guestHandler({ method, query: { slug } }, res); return res; };
const post = async (body, headers = { "content-type": "application/json" }, method = "POST") => { const res = fakeRes(); await rsvpHandler({ method, headers, body }, res); return res; };

test("GET /api/guest: trả đúng tên và không lộ trường khác", async () => {
  const res = await get("thuy-duong-k7q2");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { name: "Đặng Thùy Dương", short: "Dương", call: "chị", rsvp: null });
  assert.equal(res.headers["cache-control"], "no-store");
});

test("GET /api/guest: ghi lần mở đầu tiên đúng một lần, lỗi ghi không làm hỏng thiệp", async () => {
  await get("thuy-duong-k7q2");
  await get("thuy-duong-k7q2");
  assert.deepEqual(db.opened, [["thuy-duong-k7q2", 2]]);

  db.guests["thuy-duong-k7q2"].openedAt = ""; db.failOpen = true;
  const res = await get("thuy-duong-k7q2");
  assert.equal(res.statusCode, 200);
});

test("GET /api/guest: slug sai, lạ, hoặc sai phương thức", async () => {
  assert.equal((await get("khong-co-1")).statusCode, 404);
  assert.equal((await get("../../etc")).statusCode, 404);
  assert.equal((await get(undefined)).statusCode, 404);
  const r = await get("thuy-duong-k7q2", "POST");
  assert.equal(r.statusCode, 405);
});

test("POST /api/rsvp rồi GET trả lại đúng lựa chọn đã lưu", async () => {
  const res = await post({ slug: "thuy-duong-k7q2", status: "yes", plusOnes: 2, message: "Hẹn gặp" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  const g = await get("thuy-duong-k7q2");
  assert.equal(g.body.rsvp.status, "yes");
  assert.equal(g.body.rsvp.plusOnes, 2);
  assert.equal(g.body.rsvp.message, "Hẹn gặp");
  assert.ok(!Number.isNaN(Date.parse(g.body.rsvp.updatedAt)));
});

test("POST /api/rsvp: dữ liệu sai bị từ chối và không ghi gì", async () => {
  assert.equal((await post({ slug: "thuy-duong-k7q2", status: "maybe?" })).statusCode, 400);
  assert.equal((await post({ slug: "thuy-duong-k7q2", status: "yes", plusOnes: 9 })).statusCode, 400);
  const unknown = await post({ slug: "chua-co-1", status: "yes" });
  assert.equal(unknown.statusCode, 400);
  assert.equal(unknown.body.error, "unknown_guest");
  assert.deepEqual(db.rsvps, {});
});

test("POST /api/rsvp: chấp nhận body dạng chuỗi JSON, từ chối JSON hỏng và sai content-type", async () => {
  assert.equal((await post(JSON.stringify({ slug: "thuy-duong-k7q2", status: "no" }))).statusCode, 200);
  assert.equal((await post("{oops")).statusCode, 400);
  assert.equal((await post({ slug: "thuy-duong-k7q2", status: "yes" }, { "content-type": "text/plain" })).statusCode, 415);
  assert.equal((await post({ slug: "thuy-duong-k7q2", status: "yes" }, {})).statusCode, 415);
  assert.equal((await post({}, {}, "GET")).statusCode, 405);
});

test("lỗi lưu trữ trả 500, thiếu cấu hình trả 503 (không lộ chi tiết)", async () => {
  store.getRsvp = async () => { throw new Error("secret detail"); };
  const r500 = await get("thuy-duong-k7q2");
  assert.equal(r500.statusCode, 500);
  assert.deepEqual(r500.body, { error: "server_error" });

  __setStoreForTests(null);
  const prev = process.env.VERCEL; process.env.VERCEL = "1";
  for (const k of ["SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY"]) delete process.env[k];
  try {
    const r503 = await get("thuy-duong-k7q2");
    assert.equal(r503.statusCode, 503);
    assert.deepEqual(r503.body, { error: "not_configured" });
  } finally {
    if (prev === undefined) delete process.env.VERCEL; else process.env.VERCEL = prev;
  }
});

test("getStore chọn Sheets khi đủ biến, file local khi chạy ở máy", async () => {
  __setStoreForTests(null);
  const sheets = await getStore({ SHEET_ID: "s", GOOGLE_SERVICE_ACCOUNT_EMAIL: "e", GOOGLE_PRIVATE_KEY: "k" });
  assert.equal(typeof sheets.markOpened, "function");
  __setStoreForTests(null);
  const local = await getStore({});
  assert.equal(typeof local.getGuest, "function");
  __setStoreForTests(null);
  await assert.rejects(() => getStore({ VERCEL: "1" }), { code: "not_configured" });
});
