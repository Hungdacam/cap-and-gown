// GET /api/map → { url } để nhúng Google Map vào iframe.
// Có GOOGLE_MAPS_EMBED_KEY thì dùng Maps Embed API chính thức, chưa có thì dùng link nhúng không cần key.
import { MAP } from "../public/src/config.js";

export function embedUrl(key, query = MAP.schoolQuery) {
  const q = encodeURIComponent(query);
  if (key) return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${q}&zoom=16&language=vi`;
  return `https://www.google.com/maps?q=${q}&z=16&hl=vi&output=embed`;
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  return res.status(200).json({ url: embedUrl(process.env.GOOGLE_MAPS_EMBED_KEY) });
}
