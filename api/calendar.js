// GET /api/calendar → file .ics thật. iPhone chỉ hiện hộp "Thêm vào Lịch" khi mở một URL trả về
// text/calendar; file tạo bằng blob + thuộc tính download thì không làm được việc này.
import { buildIcs } from "../public/src/calendar.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="chuc-mung-tot-nghiep.ics"');
  return res.end(req.method === "HEAD" ? undefined : buildIcs());
}
