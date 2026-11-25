import { $, canAnimate } from "./util.js";

// Dùng opacity, không dùng autoAlpha: visibility:hidden làm phím Tab và trình đọc màn hình bỏ qua phần chưa cuộn tới.
// Khởi tạo lúc splash còn che, nên phần đã ở trong màn hình phải đợi `opening` mới chạy.
const onReveal = (opening) => (trigger, play, start = "top 88%") =>
  ScrollTrigger.create({ trigger, start, once: true, onEnter: () => opening.then(play) });

const revealer = (when) => (trigger, targets, from, stagger = 0) => {
  const tween = gsap.from(targets, { opacity: 0, duration: 0.8, ease: "power3.out", stagger, clearProps: "all", ...from, paused: true });
  when(trigger, () => tween.play());
};

export function initScrollEffects(opening, { map, gallery } = {}) {
  if (!canAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);
  // Thanh địa chỉ Safari/Chrome trên điện thoại co giãn khi cuộn làm chiều cao màn hình đổi liên tục;
  // đo lại mọi mốc mỗi lần như vậy khiến trang giật. Chỉ đo lại khi đổi chiều rộng (xoay máy).
  ScrollTrigger.config({ ignoreMobileResize: true });
  const touch = ScrollTrigger.isTouch === 1;
  const when = onReveal(opening);
  const reveal = revealer(when);

  // Khung terminal lùi ra sau khi cuộn qua. Máy cảm ứng bỏ qua (cuộn gốc làm khung lớn này chớp trên iOS).
  if (!touch) gsap.to(".term", { scale: 0.93, opacity: 0.35, ease: "none", scrollTrigger: { trigger: ".term", start: 0, end: "bottom top", scrub: true } });

  // Đầu mỗi mục: đường dẫn tự gõ ra như terminal, tiêu đề và dòng mô tả trồi lên.
  gsap.utils.toArray(".sec-head").forEach((head) => {
    const tl = gsap.timeline({ paused: true })
      .fromTo(head.querySelector(".path"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(30)", clearProps: "clipPath" });
    const h2 = head.querySelector("h2:not(.sr)");
    if (h2) tl.from(h2, { opacity: 0, y: 14, duration: 0.45, ease: "power3.out", clearProps: "all" }, "-=0.2");
    const sub = head.nextElementSibling;
    if (sub?.classList.contains("sec-sub")) tl.from(sub, { opacity: 0, y: 10, duration: 0.45, ease: "power3.out", clearProps: "all" }, "-=0.25");
    when(head, () => tl.play());
  });

  // Ảnh riêng: tấm ảnh rơi xuống, xoay nhẹ rồi được dán băng keo.
  // Ảnh tập thể khổ rộng: rơi nhẹ hơn, xoay nhiều thì tấm ảnh lớn đè lên tiêu đề phía trên.
  if (!$("me").hidden) {
    const wide = $("me").classList.contains("wide");
    const tl = gsap.timeline({ paused: true })
      .from("#me", { opacity: 0, y: 40, duration: 0.7, ease: "power3.out", clearProps: "opacity,transform" })
      // transition của CSS (cho hover) làm tween chạy trễ: tắt trong lúc rơi, clearProps trả lại sau đó.
      .set("#mePhoto", { transition: "none" }, 0)
      .from("#mePhoto", { y: wide ? -40 : -70, rotation: wide ? -5 : -14, opacity: 0, duration: wide ? 1 : 1.3, ease: wide ? "back.out(1.4)" : "elastic.out(1,.45)", clearProps: "all" }, 0.1)
      .from(".me-tape", { scaleX: 0, opacity: 0, duration: 0.3, ease: "power2.out", clearProps: "all" }, "-=0.55")
      .from(".me-text > *", { opacity: 0, x: 18, duration: 0.5, stagger: 0.1, ease: "power3.out", clearProps: "all" }, 0.45);
    when("#me", () => tl.play(), "top 85%");
  }

  // Vòng ảnh: từ nằm nghiêng như đặt trên mặt bàn, dựng đứng dần theo cuộn; cuộn nhanh thì vòng quay theo.
  if (gallery) {
    gsap.fromTo(gallery.S, { tilt: 62, lift: 1 }, {
      tilt: -6, lift: 0, ease: "none", onUpdate: () => gallery.render(),
      scrollTrigger: { trigger: "#ring", start: "top bottom", end: "center 55%", scrub: 0.8 },
    });
    gallery.bindScroll("#ring");
  }
  reveal("#ring", "#ringHint", { y: 10, delay: 0.4 });

  // Các khung lớn: lật nhẹ từ trên xuống kèm vạch quét. Chỉ opacity và transform, không clip-path.
  gsap.utils.toArray("#drive, .map, #wishForm").forEach((p) => {
    const tl = gsap.timeline({ paused: true })
      .fromTo(p, { opacity: 0, rotateX: 10, y: 48, transformPerspective: 1100, transformOrigin: "50% 0%" },
        { opacity: 1, rotateX: 0, y: 0, duration: 0.9, ease: "power3.out", clearProps: "opacity,transform" })
      .fromTo(p, { "--scanY": "0px", "--scanO": 1 }, { "--scanY": () => `${p.offsetHeight}px`, "--scanO": 0, duration: 0.9, ease: "power3.out" }, 0);
    when(p, () => tl.play());
  });

  // Nơi gặp nhau: camera hạ từ trên xuống, nhà mọc lên theo cuộn; tới giữa màn hình thì tự chạy lộ trình.
  reveal("#tabs", "#tabs .tab", { y: 14, duration: 0.5 }, 0.07);
  if (map?.map3d) {
    gsap.to(map.map3d.S, { intro: 1, ease: "none", onUpdate: map.map3d.kick, scrollTrigger: { trigger: "#map3d", start: "top bottom", end: "center 60%", scrub: 0.8 } });
    when("#map3d", () => map.startTour(), "center 62%");
  } else {
    reveal("#trace", ".hop", { x: -18, duration: 0.5 }, 0.1);
  }
  reveal("#msgBox", "#log", { y: 16, delay: 0.3 });

  // Chân trang: nhánh sinh-viên tự vẽ rồi merge vào cựu-sinh-viên.
  ["#pMain", "#pBr"].forEach((sel) => {
    const p = document.querySelector(sel), L = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: "footer", start: "top 95%", end: "top 55%", scrub: 0.5 } });
  });
  gsap.fromTo("#mDot", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, ease: "back.out(3)", scrollTrigger: { trigger: "footer", start: "top 60%", toggleActions: "play none none reverse" } });
  reveal("footer", "footer > span", { y: 16 }, 0.1);

  // Đổi tab bản đồ hay ảnh tải xong làm trang đổi chiều cao, các mốc phía dưới phải đo lại.
  const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  new ResizeObserver(() => refresh.restart(true)).observe($("smooth-content"));
}
