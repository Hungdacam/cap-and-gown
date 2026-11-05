import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import handler, { embedUrl } from "../api/map.js";
import { MUSIC } from "../public/src/config.js";
import { fakeRes } from "./helpers.js";

const inPublic = (p) => new URL(`../public${p}`, import.meta.url);

test("có key thì dùng Maps Embed API, không có thì dùng link nhúng không cần key", () => {
  const withKey = embedUrl("abc 123", "IUH Gò Vấp");
  assert.ok(withKey.startsWith("https://www.google.com/maps/embed/v1/place?key=abc%20123&q=IUH%20G%C3%B2%20V%E1%BA%A5p"));
  const noKey = embedUrl("", "IUH");
  assert.ok(noKey.startsWith("https://www.google.com/maps?q=IUH"));
  assert.ok(noKey.includes("output=embed"));
  assert.ok(!noKey.includes("key="));
});

test("GET /api/map trả link, phương thức khác bị từ chối", () => {
  const ok = fakeRes();
  handler({ method: "GET" }, ok);
  assert.equal(ok.statusCode, 200);
  assert.match(ok.body.url, /^https:\/\/www\.google\.com\/maps/);
  const bad = fakeRes();
  handler({ method: "POST" }, bad);
  assert.equal(bad.statusCode, 405);
});

test("CSP cho phép iframe của Google Map", () => {
  const { headers } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const csp = headers.flatMap((r) => r.headers).find((h) => h.key === "Content-Security-Policy").value;
  assert.match(csp, /frame-src https:\/\/www\.google\.com/);
});

test("ảnh thẻ có thật trong public/", () => {
  const html = readFileSync(inPublic("/index.html"), "utf8");
  assert.ok(html.includes('src="/media/anh-the.jpg"'));
  assert.ok(existsSync(inPublic("/media/anh-the.jpg")));
});

test("file nhạc và icon có thật trong public/", () => {
  assert.ok(existsSync(inPublic(MUSIC.src)), MUSIC.src);
  assert.ok(MUSIC.volume > 0 && MUSIC.volume <= 1);
  const html = readFileSync(inPublic("/index.html"), "utf8");
  for (const p of ["/favicon.svg", "/favicon-32.png", "/apple-touch-icon.png"]) {
    assert.ok(html.includes(`href="${p}"`), p);
    assert.ok(existsSync(inPublic(p)), p);
  }
});
