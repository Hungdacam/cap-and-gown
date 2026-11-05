// Máy chủ chạy thử ở máy: phục vụ public/, rewrite /t/:slug về index.html và chạy các hàm trong api/ như Vercel.
// Dùng: npm run dev   (mặc định cổng 3000, đổi bằng PORT=4000)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pub = join(root, "public");
const port = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".mp3": "audio/mpeg" };
// Dùng đúng header của vercel.json (có CSP) để lỗi bị chặn hiện ra ngay khi chạy ở máy.
const vercelHeaders = JSON.parse(await readFile(join(root, "vercel.json"), "utf8")).headers;

async function runApi(name, req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  req.body = raw && (req.headers["content-type"] || "").includes("application/json") ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : raw || undefined;
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
  let mod;
  try { mod = await import(pathToFileURL(join(root, "api", `${name}.js`)).href); } catch { return res.status(404).json({ error: "not_found" }); }
  await mod.default(req, res);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    for (const rule of vercelHeaders) {
      if (new RegExp(`^${rule.source}$`).test(url.pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value);
    }
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/\/$/, "");
      if (!/^[a-z0-9-]+$/.test(name)) { res.statusCode = 404; return res.end(); }
      return await runApi(name, req, res, url);
    }
    let p = url.pathname;
    if (/^\/t\/[^/]+\/?$/.test(p) || p === "/") p = "/index.html";
    const file = normalize(join(pub, p));
    if (!file.startsWith(pub)) { res.statusCode = 403; return res.end(); }
    const body = await readFile(file);
    res.setHeader("content-type", TYPES[extname(file)] || "application/octet-stream");
    res.setHeader("cache-control", "no-store");
    res.end(body);
  } catch (e) {
    res.statusCode = e.code === "ENOENT" ? 404 : 500;
    res.end(e.code === "ENOENT" ? "Not found" : "Server error");
    if (e.code !== "ENOENT") console.error(e);
  }
}).listen(port, () => {
  console.log(`Thiệp chạy tại http://localhost:${port}`);
  console.log("Thử link khách mẫu: /t/my-linh-c3d4   (xem data/guests.sample.json)");
});
