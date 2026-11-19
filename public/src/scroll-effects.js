import { $, canAnimate } from "./util.js";
import { armOdometer } from "./countdown.js";
import { minutes, RULER_FROM, RULER_TO } from "./render.js";

// Dùng opacity, không dùng autoAlpha: visibility:hidden làm phím Tab và trình đọc màn hình bỏ qua phần chưa cuộn tới.
// Khởi tạo lúc splash còn che, nên phần đã ở trong màn hình phải đợi `opening` mới chạy.
const onReveal = (opening) => (trigger, play, start = "top 88%") =>
  ScrollTrigger.create({ trigger, start, once: true, onEnter: () => opening.then(play) });

const revealer = (when) => (trigger, targets, from, stagger = 0) => {
  const tween = gsap.from(targets, { opacity: 0, duration: 0.8, ease: "power3.out", stagger, clearProps: "all", ...from, paused: true });
  when(trigger, () => tween.play());
};

const pad = (n) => String(n).padStart(2, "0");
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m) % 60)}`;

/**
 * Đầu đọc trên thước giờ: chặng và khối giờ tương ứng sáng lên. p từ 0 (08:30) tới 1 (14:00).
 * Chạy mỗi khung hình khi cuộn, nên chỉ dùng transform (không tính lại bố cục) và chỉ đụng DOM khi phút đổi.
 */
function createRuler() {
  const head = $("rHead"), bub = $("rBub"), box = head.parentElement;
  const blocks = [...document.querySelectorAll(".r-blk")].map((el) => ({ el, a: minutes(el.dataset.a), b: minutes(el.dataset.b), on: false }));
  const stages = [...document.querySelectorAll(".stage")].map((el) => ({ el, a: minutes(el.dataset.at), b: minutes(el.dataset.end), cer: el.classList.contains("cer"), on: false }));
  let width = box.clientWidth, lastMin = -1;
  new ResizeObserver(() => { width = box.clientWidth; }).observe(box);
  return (p) => {
    head.style.transform = `translate3d(${(p * width).toFixed(1)}px,0,0)`;
    const m = Math.round(RULER_FROM + p * (RULER_TO - RULER_FROM));
    if (m === lastMin) return;
    lastMin = m;
    let tag = "";
    for (const x of blocks) { const on = m >= x.a && m < x.b; if (on !== x.on) { x.on = on; x.el.classList.toggle("hot", on); } }
    for (const x of stages) {
      const on = m >= x.a && m < x.b;
      if (on !== x.on) { x.on = on; x.el.classList.toggle("hot", on); }
      if (on) tag = x.cer ? " · nhận bằng" : " · gặp khách";
    }
    bub.textContent = hm(m) + tag;
  };
}

export function initScrollEffects(opening, { map } = {}) {
  if (!canAnimate()) return;
  gsap.registerPlugin(ScrollTrigger);
  // Thanh địa chỉ Safari/Chrome trên điện thoại co giãn khi cuộn làm chiều cao màn hình đổi liên tục;
  // đo lại mọi mốc mỗi lần như vậy khiến trang giật. Chỉ đo lại khi đổi chiều rộng (xoay máy).
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Máy chỉ có cảm ứng: ScrollSmoother không làm mượt, trang cuộn gốc của trình duyệt.
  const nativeScroll = ScrollTrigger.isTouch === 1 || getComputedStyle($("smooth-wrapper")).position !== "fixed";
  const when = onReveal(opening);
  const reveal = revealer(when);

  gsap.to(".term", { scale: 0.93, opacity: 0.35, ease: "none", scrollTrigger: { trigger: ".term", start: 0, end: "bottom top", scrub: true } });

  // Đầu mỗi mục: đường dẫn tự gõ ra như terminal, tiêu đề trồi lên.
  gsap.utils.toArray(".sec-head").forEach((head) => {
    const tl = gsap.timeline({ paused: true })
      .fromTo(head.querySelector(".path"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(30)", clearProps: "clipPath" });
    const h2 = head.querySelector("h2:not(.sr)");
    if (h2) tl.from(h2, { opacity: 0, y: 14, duration: 0.45, ease: "power3.out", clearProps: "all" }, "-=0.2");
    when(head, () => tl.play());
  });

  // Thông tin chính: ba thẻ lật đứng dậy từ mặt bàn; nút gọi nổi hiện khi đã cuộn qua.
  reveal("#facts", ".fact", { rotateX: -78, y: 60, transformOrigin: "50% 100%", duration: 1.05, ease: "back.out(1.3)" }, 0.15);
  reveal("#facts", ".fact .pill", { scale: 0.4, duration: 0.5, delay: 0.6, ease: "back.out(3)" }, 0.12);
  if (!$("callfab").hidden) {
    gsap.set("#callfab", { autoAlpha: 0, y: 24 });
    ScrollTrigger.create({
      trigger: "#facts", start: "bottom 30%",
      onEnter: () => gsap.to("#callfab", { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(2)" }),
      onLeaveBack: () => gsap.to("#callfab", { autoAlpha: 0, y: 24, duration: 0.3 }),
    });
  }

  // Các khung lớn: một kiểu chuyển cảnh chung, lật nhẹ từ trên xuống kèm vạch quét.
  // Chỉ opacity và transform (GPU lo), không dùng clip-path: clip-path vẽ lại cả khung mỗi khung hình, giật trên điện thoại.
  gsap.utils.toArray(".pr, .map, .gmap, #lint, #contact").forEach((p) => {
    const tl = gsap.timeline({ paused: true })
      .fromTo(p, { opacity: 0, rotateX: 10, y: 48, transformPerspective: 1100, transformOrigin: "50% 0%" },
        { opacity: 1, rotateX: 0, y: 0, duration: 0.9, ease: "power3.out", clearProps: "opacity,transform" })
      .fromTo(p, { "--scanY": "0px", "--scanO": 1 }, { "--scanY": () => `${p.offsetHeight}px`, "--scanO": 0, duration: 0.9, ease: "power3.out" }, 0);
    when(p, () => tl.play());
  });

  // Thiệp PR: huy hiệu loé sáng, thông tin áp vào như một bản diff, CI chạy lại từng điều kiện, đếm tín chỉ.
  when(".pr", () => {
    $("merged")?.classList.add("shine");
    document.querySelectorAll("#yaml .yl").forEach((l, i) => { l.style.animationDelay = `${i * 0.09}s`; l.classList.add("flash"); });
    const cred = $("credN");
    if (cred) { const to = Number(cred.textContent), o = { v: 0 }; gsap.to(o, { v: to, duration: 1.4, ease: "power2.out", onUpdate: () => (cred.textContent = Math.round(o.v)) }); }
    document.querySelectorAll("#checks .check:not(.pending) svg").forEach((svg, i) => {
      const spin = document.createElement("i");
      spin.className = "spin";
      svg.replaceWith(spin);
      gsap.delayedCall(0.5 + i * 0.45, () => { spin.replaceWith(svg); gsap.fromTo(svg, { scale: 0.3 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }); });
    });
  }, "top 78%");
  reveal(".eta", ".eta-v > span", { rotateX: -88, y: 18, duration: 0.7, ease: "back.out(1.6)" }, 0.09);
  when(".eta", armOdometer, "top 92%");
  reveal(".rsvp", ".rsvp > :not([hidden])", { y: 26 }, 0.1);

  // Lịch trình: khung đứng yên, mỗi đoạn cuộn ứng với một khoảng giờ 08:30 → 14:00.
  // scrub phải gắn vào một tween thì mới được làm mượt.
  const scrubRuler = createRuler(), head = { p: 0 };
  scrubRuler(0);
  const panel = $("pipePanel"), stage = $("pipeStage");
  if (nativeScroll) {
    // Điện thoại: trang cuộn gốc (ScrollSmoother tắt trên máy cảm ứng). Ghim bằng JS luôn trễ một nhịp so với cuộn gốc
    // nên khung rung trên iOS Safari và Chrome; position:sticky do trình duyệt tự giữ nên đứng yên tuyệt đối.
    stage.classList.add("sticky");
    const measure = () => stage.style.setProperty("--ph", `${panel.offsetHeight}px`);
    measure();
    new ResizeObserver(measure).observe(panel);
    const top = () => parseFloat(getComputedStyle(panel).top) || 0;
    gsap.to(head, {
      p: 1, ease: "none", onUpdate: () => scrubRuler(head.p),
      scrollTrigger: { trigger: stage, start: () => `top ${top()}px`, end: () => `bottom ${top() + panel.offsetHeight}px`, scrub: 0.5, invalidateOnRefresh: true },
    });
  } else {
    // Máy tính: ScrollSmoother dịch nội dung bằng transform, pin của ScrollTrigger đồng bộ với nó.
    // .sec là flex nên phải bật pinSpacing tường minh.
    gsap.to(head, {
      p: 1, ease: "none", onUpdate: () => scrubRuler(head.p),
      scrollTrigger: {
        trigger: panel, pin: true, pinSpacing: true, anticipatePin: 1, scrub: 0.9, invalidateOnRefresh: true,
        start: () => (panel.offsetHeight < innerHeight * 0.8 ? "center center" : "top 12%"),
        end: () => `+=${Math.round(innerHeight * 1.5)}`,
      },
    });
  }
  // clearProps chỉ xoá transform: left/width của khối giờ nằm trong style inline, xoá "all" là mất vị trí.
  reveal("#pipePanel", ".r-blk", { scaleX: 0, opacity: 1, transformOrigin: "0 50%", duration: 0.8, clearProps: "transform" }, 0.18);
  reveal("#pipe", ".stage", { y: 34 }, 0.12);
  reveal("#pipe", ".bar", { scaleX: 0, opacity: 1, transformOrigin: "left center", duration: 1.1 });

  // Đường đi: camera hạ từ trên xuống, nhà mọc lên theo cuộn; tới giữa màn hình thì tự chạy lộ trình.
  reveal("#tabs", "#tabs .tab", { y: 14, duration: 0.5 }, 0.07);
  if (map?.map3d) {
    gsap.to(map.map3d.S, { intro: 1, ease: "none", onUpdate: map.map3d.kick, scrollTrigger: { trigger: "#map3d", start: "top bottom", end: "center 60%", scrub: 0.8 } });
    when("#map3d", () => map.startTour(), "center 62%");
  } else {
    reveal("#trace", ".hop", { x: -18, duration: 0.5 }, 0.1);
  }

  reveal("#lint", ".lint-head", { y: 14 });
  reveal("#lint", ".issue", { x: -26, duration: 0.6 }, 0.08);

  // Chân trang: nhánh sinh-viên tự vẽ rồi merge vào cựu-sinh-viên.
  ["#pMain", "#pBr"].forEach((sel) => {
    const p = document.querySelector(sel), L = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: "footer", start: "top 95%", end: "top 55%", scrub: 0.5 } });
  });
  gsap.fromTo("#mDot", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, ease: "back.out(3)", scrollTrigger: { trigger: "footer", start: "top 60%", toggleActions: "play none none reverse" } });
  reveal("footer", "footer > span", { y: 16 }, 0.1);

  // Form RSVP mở ra hay đổi tab bản đồ làm trang đổi chiều cao, các mốc phía dưới phải đo lại.
  const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  new ResizeObserver(() => refresh.restart(true)).observe($("smooth-content"));
}
