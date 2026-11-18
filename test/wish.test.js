import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import wishHandler, { __resetWishLimitForTests, deviceLabel } from "../api/wish.js";
import { parseWishBody } from "../api/_lib/validate.js";
import { __setStoreForTests } from "../api/_lib/store.js";
import { fakeRes } from "./helpers.js";

let saved;
const GUESTS = { "cty-dotb-x1": { slug: "cty-dotb-x1", shared: true }, "le-linh-1": { slug: "le-linh-1", shared: false } };
beforeEach(() => {
  saved = [];
  __resetWishLimitForTests();
  __setStoreForTests({ addWish: async (w) => { saved.push(w); }, getGuest: async (s) => GUESTS[s] || null });
});

const IPHONE_ZALO = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/500";
const post = async (body, { ip = "1.2.3.4", headers = { "content-type": "application/json", "user-agent": IPHONE_ZALO }, method = "POST" } = {}) => {
  const res = fakeRes();
  await wishHandler({ method, headers: { ...headers, "x-forwarded-for": `${ip}, 10.0.0.1` }, body }, res);
  return res;
};

test("parseWishBody: làm sạch, giới hạn 2–300 ký tự, ô bẫy bot", () => {
  assert.deepEqual(parseWishBody({ message: "  Chúc mừng!\u0007 " }), { ok: true, value: { message: "Chúc mừng!", name: "", slug: "" } });
  assert.equal(parseWishBody({ message: "Chúc mừng", slug: "cty-dotb-x1" }).value.slug, "cty-dotb-x1");
  for (const slug of ["../x", "a", 5, {}]) assert.equal(parseWishBody({ message: "Chúc mừng", slug }).value.slug, "", String(slug));
  assert.equal(parseWishBody({ message: "a\nb" }).value.message, "a\nb");
  assert.equal(parseWishBody({ message: " a " }).error, "empty_wish");
  assert.equal(parseWishBody({}).error, "empty_wish");
  assert.equal(parseWishBody({ message: "ê".repeat(300) }).ok, true);
  assert.equal(parseWishBody({ message: "ê".repeat(301) }).error, "message_too_long");
  assert.equal(parseWishBody({ message: 5 }).error, "bad_message");
  assert.deepEqual(parseWishBody({ message: "hi there", website: "http://spam" }), { ok: true, spam: true });
  for (const b of [null, "x", [], 5]) assert.equal(parseWishBody(b).error, "bad_body");
});

test("parseWishBody: chữ ký không bắt buộc, gọn khoảng trắng, tối đa 60 ký tự", () => {
  assert.equal(parseWishBody({ message: "Chúc mừng", name: "  Minh \n Anh " }).value.name, "Minh Anh");
  assert.equal(parseWishBody({ message: "Chúc mừng", name: "" }).value.name, "");
  assert.equal(parseWishBody({ message: "Chúc mừng", name: "ê".repeat(60) }).ok, true);
  assert.equal(parseWishBody({ message: "Chúc mừng", name: "ê".repeat(61) }).error, "name_too_long");
  assert.equal(parseWishBody({ message: "Chúc mừng", name: 5 }).error, "bad_name");
});

test("deviceLabel: nhãn thiết bị dễ đọc", () => {
  assert.equal(deviceLabel(IPHONE_ZALO), "iPhone · Zalo");
  assert.equal(deviceLabel("Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"), "Android SM-S918B · Chrome");
  assert.equal(deviceLabel("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"), "Android · Chrome");
  assert.equal(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 [FBAN/FBIOS;FBAV/400.0]"), "iPhone · Facebook/Messenger");
  assert.equal(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0"), "Windows · Edge");
  assert.equal(deviceLabel(undefined), "không rõ");
});

test("POST /api/wish lưu lời chúc, chữ ký, thời gian, thiết bị và IP (đã báo trên form)", async () => {
  const res = await post({ message: "Chúc Hưng thành công!", name: "Minh Anh" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(saved.length, 1);
  assert.deepEqual(Object.keys(saved[0]).sort(), ["createdAt", "device", "ip", "message", "name", "source"]);
  assert.equal(saved[0].source, "", "link công khai: nguồn trống");
  assert.equal(saved[0].message, "Chúc Hưng thành công!");
  assert.equal(saved[0].name, "Minh Anh");
  assert.equal(saved[0].device, "iPhone · Zalo");
  assert.equal(saved[0].ip, "1.2.3.4", "lấy IP đầu tiên trong x-forwarded-for");
  assert.ok(!Number.isNaN(Date.parse(saved[0].createdAt)));
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal((await post({ message: "Không ký tên" })).statusCode, 200);
  assert.equal(saved[1].name, "");
});

test("POST /api/wish: bot điền ô bẫy thì trả thành công nhưng không ghi", async () => {
  const res = await post({ message: "mua thuốc giá rẻ", website: "x" });
  assert.equal(res.statusCode, 200);
  assert.equal(saved.length, 0);
});

test("POST /api/wish: sai dữ liệu, sai content-type, sai phương thức", async () => {
  assert.equal((await post({ message: "" })).statusCode, 400);
  assert.equal((await post("{oops")).statusCode, 400);
  assert.equal((await post(JSON.stringify({ message: "Chúc mừng" }))).statusCode, 200);
  assert.equal((await post({ message: "Chúc mừng" }, { headers: { "content-type": "text/plain" } })).statusCode, 415);
  assert.equal((await post({}, { method: "GET" })).statusCode, 405);
});

test("POST /api/wish: link chung ghi nguồn là slug; slug riêng hay không có thật thì để trống (không tự đặt nguồn được)", async () => {
  await post({ message: "Chúc mừng từ công ty", slug: "cty-dotb-x1" });
  await post({ message: "Gắn slug khách riêng", slug: "le-linh-1" });
  await post({ message: "Gắn slug bịa", slug: "khong-co-1" });
  assert.deepEqual(saved.map((w) => w.source), ["cty-dotb-x1", "", ""]);
});

test("POST /api/wish: tối đa 8 lời chúc mỗi máy trong 10 phút; đồng nghiệp chung IP văn phòng nhưng khác máy vẫn gửi được", async () => {
  for (let i = 0; i < 8; i++) assert.equal((await post({ message: `Chúc lần ${i}` })).statusCode, 200);
  const blocked = await post({ message: "Lần 9" });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.error, "too_many");
  const android = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
  assert.equal((await post({ message: "Đồng nghiệp cùng văn phòng" }, { headers: { "content-type": "application/json", "user-agent": android } })).statusCode, 200);
  assert.equal((await post({ message: "Người ở nơi khác" }, { ip: "5.6.7.8" })).statusCode, 200);
  assert.equal(saved.length, 10);
});

test("POST /api/wish: lỗi lưu trữ trả 500 không lộ chi tiết", async () => {
  __setStoreForTests({ addWish: async () => { throw new Error("secret"); } });
  const res = await post({ message: "Chúc mừng" });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "server_error" });
});
