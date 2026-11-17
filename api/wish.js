import { getStore } from "./_lib/store.js";
import { parseWishBody } from "./_lib/validate.js";

// Link công khai đăng lên mạng xã hội nên giới hạn số lời chúc mỗi IP.
// Bộ đếm nằm trong bộ nhớ của từng instance: đủ chặn bấm gửi liên tục, không phải chống spam tuyệt đối.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

export function __resetWishLimitForTests() { hits.clear(); }

/** Nhãn thiết bị dễ đọc từ User-Agent, ví dụ "iPhone · Zalo", "Android SM-S918B · Chrome". Khách đã được báo trên form. */
export function deviceLabel(ua = "") {
  const s = String(ua);
  const model = (s.match(/Android [\d.]+; ([^;)]+)/) || [])[1]?.trim();
  const os = /iPhone/.test(s) ? "iPhone" : /iPad/.test(s) ? "iPad"
    : /Android/.test(s) ? `Android${model && model !== "K" ? ` ${model}` : ""}`
    : /Windows/.test(s) ? "Windows" : /Macintosh|Mac OS X/.test(s) ? "Mac" : /Linux/.test(s) ? "Linux" : "";
  const app = /Zalo/i.test(s) ? "Zalo" : /FBAN|FBAV|FB_IAB|Messenger/.test(s) ? "Facebook/Messenger"
    : /Instagram/.test(s) ? "Instagram" : /TikTok|musical_ly|BytedanceWebview/i.test(s) ? "TikTok"
    : /Edg\//.test(s) ? "Edge" : /CriOS|Chrome\//.test(s) ? "Chrome" : /FxiOS|Firefox\//.test(s) ? "Firefox"
    : /Safari\//.test(s) ? "Safari" : "";
  return [os, app].filter(Boolean).join(" · ") || "không rõ";
}

function limited(ip, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // không để Map phình mãi
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  // Giống /api/rsvp: bắt buộc JSON, đồng thời là lớp chặn CSRF.
  if (!String(req.headers?.["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "unsupported_media_type" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "bad_json" }); }
  }
  const parsed = parseWishBody(body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  if (parsed.spam) return res.status(200).json({ ok: true }); // bot điền ô bẫy: trả như thành công, không ghi

  const ip = String(req.headers?.["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "too_many" });

  try {
    const store = await getStore();
    // Form đã báo khách: Hưng ghi lại thời gian, loại thiết bị và IP để chống spam.
    await store.addWish({
      ...parsed.value,
      createdAt: new Date().toISOString(),
      device: deviceLabel(req.headers?.["user-agent"]),
      ip,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("wish", e.message);
    return res.status(e.code === "not_configured" ? 503 : 500).json({ error: e.code === "not_configured" ? "not_configured" : "server_error" });
  }
}
