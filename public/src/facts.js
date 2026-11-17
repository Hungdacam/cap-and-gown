import { EVENT } from "./config.js";
import { $, esc, canAnimate, capFirst, formatDateVi } from "./util.js";
import { googleCalendarUrl } from "./calendar.js";

const phoneText = (p) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");

async function copyNumber(btn, labelEl, label) {
  try {
    await navigator.clipboard.writeText(EVENT.phone);
    labelEl.textContent = "Đã sao chép ✓";
  } catch {
    labelEl.textContent = EVENT.phone; // không sao chép được thì hiện số trơn để khách tự chép
  }
  setTimeout(() => (labelEl.textContent = label), 1800);
}

/**
 * Ba thẻ "Thông tin chính" (giờ giấc, địa điểm, số liên lạc) ngay dưới lời chào, và nút gọi nổi ở góc màn hình.
 * Mọi chữ lấy từ config.js.
 */
export function initFacts() {
  const host = EVENT.graduateShort;
  $("factDate").textContent = formatDateVi(EVENT.date);
  $("factPills").innerHTML = EVENT.guestWindows.map((w) => `<span class="pill">${esc(w.from)}–${esc(w.to)}</span>`).join("");
  $("factNote").innerHTML = `Hai khung giờ gặp khách. <b>${esc(EVENT.ceremonyStart)}–${esc(EVENT.ceremonyEnd)}</b> ${esc(host)} nhận bằng (${esc(EVENT.ceremonySession)}) nên không ra gặp được.`;
  $("factCal").href = googleCalendarUrl();

  $("factPlace").textContent = capFirst(EVENT.meetingPoint);
  $("factAddr").innerHTML = `<b>${esc(EVENT.schoolShort)}</b><br>${esc(EVENT.address)}. Cổng chính trên đường Nguyễn Văn Bảo, cổng sau trên đường Lê Quang Định.`;
  $("toMap").addEventListener("click", () => {
    const target = $("map-h").closest("section");
    const smoother = window.ScrollSmoother?.get();
    if (smoother) smoother.scrollTo(target, true, "top 24px");
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Chưa điền số thì ẩn thẻ liên hệ và nút gọi nổi.
  if (EVENT.phone) {
    $("factPhone").textContent = phoneText(EVENT.phone);
    $("factCallLink").href = `tel:${EVENT.phone}`;
    $("factCallNote").textContent = `Gọi ${host} khi tới cổng, lạc đường hoặc cần đổi giờ.`;
    const copy2 = $("copyPhone2");
    copy2.addEventListener("click", () => copyNumber(copy2, copy2, "Sao chép số"));
    const fab = $("callfab"), fabT = $("callfabT");
    fabT.textContent = phoneText(EVENT.phone);
    fab.setAttribute("aria-label", `Sao chép số điện thoại của ${host}: ${phoneText(EVENT.phone)}`);
    fab.addEventListener("click", () => copyNumber(fab, fabT, phoneText(EVENT.phone)));
    fab.hidden = false;
  } else {
    $("factCallCard").hidden = true;
  }

  // Thẻ nghiêng 3D theo con trỏ chuột, chữ trên thẻ nổi lên theo chiều sâu (translateZ trong CSS).
  if (!canAnimate()) return;
  document.querySelectorAll(".fact").forEach((card) => {
    const qx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
    const qy = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      qy(((e.clientX - r.left) / r.width - 0.5) * 16);
      qx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    });
    card.addEventListener("pointerleave", () => { qx(0); qy(0); });
  });
}
