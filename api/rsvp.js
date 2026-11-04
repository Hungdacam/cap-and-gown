import { getStore } from "./_lib/store.js";
import { parseRsvpBody } from "./_lib/validate.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  // Form chéo trang không gửi được application/json nếu không qua CORS, nên đây cũng là lớp chặn CSRF.
  if (!String(req.headers?.["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "unsupported_media_type" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "bad_json" }); }
  }
  const parsed = parseRsvpBody(body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  try {
    const store = await getStore();
    const guest = await store.getGuest(parsed.value.slug);
    if (!guest) return res.status(400).json({ error: "unknown_guest" });

    await store.upsertRsvp({ ...parsed.value, updatedAt: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("rsvp", e.message);
    return res.status(e.code === "not_configured" ? 503 : 500).json({ error: e.code === "not_configured" ? "not_configured" : "server_error" });
  }
}
