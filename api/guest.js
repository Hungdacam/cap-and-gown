import { getStore } from "./_lib/store.js";
import { isValidSlug } from "./_lib/validate.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const slug = String(req.query?.slug ?? "");
  if (!isValidSlug(slug)) return res.status(404).json({ error: "not_found" });

  try {
    const store = await getStore();
    const guest = await store.getGuest(slug);
    if (!guest) return res.status(404).json({ error: "not_found" });

    // Link chung (cả nhóm mở chung): không có xác nhận riêng, khách để lại lời chúc thay vào đó.
    const found = guest.shared ? null : await store.getRsvp(slug);

    if (!guest.openedAt) {
      // Ghi lần mở đầu tiên. Lỗi ghi không được làm hỏng thiệp.
      try { await store.markOpened(slug, guest.row, new Date().toISOString()); } catch (e) { console.error("markOpened", e.message); }
    }

    return res.status(200).json({
      name: guest.name,
      short: guest.short,
      call: guest.call,
      ...(guest.shared ? { shared: true } : {}),
      // Ảnh riêng (cột anh_rieng): chỉ trả cho đúng khách đó, không nằm trong file công khai nào.
      ...(guest.photo ? { photo: guest.photo } : {}),
      rsvp: found
        ? { status: found.status, plusOnes: found.plusOnes, arrival: found.arrival || "", message: found.message, updatedAt: found.updatedAt }
        : null,
    });
  } catch (e) {
    console.error("guest", e.message);
    return res.status(e.code === "not_configured" ? 503 : 500).json({ error: e.code === "not_configured" ? "not_configured" : "server_error" });
  }
}
