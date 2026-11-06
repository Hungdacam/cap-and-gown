import { $, canAnimate } from "./util.js";

// Dùng opacity, không dùng autoAlpha: visibility:hidden làm phím Tab và trình đọc màn hình bỏ qua phần chưa cuộn tới.
// Khởi tạo lúc splash còn che, nên phần đã ở trong màn hình phải đợi `opening` mới chạy.
const revealer = (opening) => (trigger, targets, from, stagger = 0) => {
  const tween = gsap.from(targets, { opacity: 0, duration: 0.8, ease: "power3.out", stagger, clearProps: "all", ...from, paused: true });
  ScrollTrigger.create({ trigger, start: "top 88%", once: true, onEnter: () => opening.then(() => tween.play()) });
};

export function initScrollEffects(opening) {
  if (!canAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);
  const reveal = revealer(opening);

  gsap.to(".term", { scale: 0.93, opacity: 0.35, ease: "none", scrollTrigger: { trigger: ".term", start: 0, end: "bottom top", scrub: true } });

  gsap.utils.toArray(".sec-head").forEach((head) => reveal(head, head, { y: 28 }));

  reveal(".pr", ".pr", { y: 56, scale: 0.97 });
  reveal(".pr-grid", "#yaml > div", { x: -18, duration: 0.5 }, 0.05);
  reveal(".pr-grid", ".checks > *", { x: 18, duration: 0.5 }, 0.07);
  reveal(".eta", ".eta-v > span", { y: 18, scale: 0.8, duration: 0.5, ease: "back.out(2)" }, 0.08);
  reveal(".rsvp", ".rsvp > :not([hidden])", { y: 26 }, 0.1);

  reveal("#pipe", ".stage", { y: 34 }, 0.12);
  reveal("#pipe", ".bar", { scaleX: 0, opacity: 1, transformOrigin: "left center", duration: 1.1 });

  reveal("#tabs", "#tabs .tab", { y: 14, duration: 0.5 }, 0.07);
  reveal(".map", ".map", { clipPath: "inset(0% 0% 100% 0% round 10px)", opacity: 1, duration: 1.1, ease: "power3.inOut" });
  reveal("#trace", ".hop", { x: -18, duration: 0.5 }, 0.1);
  reveal(".gmap", ".gmap", { y: 40, scale: 0.98 });

  reveal("#lint", ".lint-head", { y: 14 });
  reveal("#lint", ".issue", { x: -26, duration: 0.6 }, 0.08);
  reveal("#contact", "#contact", { y: 26, scale: 0.97 });
  reveal("footer", "footer > span", { y: 16 }, 0.1);

  // Form RSVP mở ra hay đổi tab bản đồ làm trang đổi chiều cao, các mốc phía dưới phải đo lại.
  const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  new ResizeObserver(() => refresh.restart(true)).observe($("smooth-content"));
}
