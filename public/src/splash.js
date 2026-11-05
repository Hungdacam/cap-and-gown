import { $, canAnimate } from "./util.js";
import { createLines } from "./splash-lines.js";

const BITS = 18;
const SKIP_SPEED = 5;
const STRIPS = 9;
const MERGE_AT = 0.85; // giây, lúc các đường bên trái gặp nhau
const NODE_Y = 0.8167; // điểm hội tụ theo chiều cao .sp-scene
const RISE = 0.45;
const FLIGHT = 0.74; // bay lên + rơi tới lần chạm đất đầu tiên của bounce.out

const revealPage = () => document.documentElement.classList.remove("splash-on");

function buildBits(scene) {
  return Array.from({ length: BITS }, () => {
    const bit = document.createElement("i");
    bit.className = "sp-bit";
    scene.append(bit);
    return bit;
  });
}

function buildStrips(splash) {
  const box = document.createElement("div");
  box.className = "sp-strips";
  const strips = Array.from({ length: STRIPS }, () => document.createElement("i"));
  box.append(...strips);
  splash.prepend(box);
  return strips;
}

function buildIntro(bits) {
  const { random } = gsap.utils;
  const scene = $("spScene").getBoundingClientRect();
  const node = { x: scene.left + scene.width / 2, y: scene.top + scene.height * NODE_Y };
  const lines = createLines($("spLines"), node, MERGE_AT);
  const clock = { time: 0 };

  gsap.set("#spCap", { transformOrigin: "48.08% 38.89%", yPercent: 105, scale: 0.3, rotation: -40 });
  gsap.set("#spTassel", { svgOrigin: "286 78" });

  return gsap.timeline({ defaults: { ease: "power2.out" } })
    .to(clock, { time: lines.duration, duration: lines.duration, ease: "none", onUpdate: () => lines.draw(clock.time) }, 0)
    .addLabel("merged", MERGE_AT)
    .fromTo("#spRing", { autoAlpha: 0.5, scale: 0.3 }, { autoAlpha: 0, scale: 3, duration: 0.8, ease: "sine.out", immediateRender: false }, "merged")
    .to("#spCap", { autoAlpha: 1, duration: 0.1, ease: "none" }, "merged")
    // Xoay và phóng to chạy liền một mạch suốt đường bay, nếu chia hai đoạn thì mũ khựng lại ở đỉnh.
    .to("#spCap", { rotation: 360, scale: 1, duration: FLIGHT, ease: "sine.out" }, "merged")
    .to("#spCap", { yPercent: -45, duration: RISE, ease: "power1.out" }, "merged")
    .to("#spCap", { yPercent: 0, duration: 0.8, ease: "bounce.out" }, `merged+=${RISE}`)
    .addLabel("landed", `merged+=${FLIGHT}`)
    .fromTo("#spTassel", { rotation: 22 }, { rotation: 0, duration: 0.8, ease: "sine.out" }, "landed")
    .set(bits, { autoAlpha: 1 }, "landed")
    .fromTo(bits,
      { x: 0, y: 0, scale: 0.5 },
      { x: () => random(-160, 160), y: () => random(-170, -30), rotation: () => random(-160, 160), scale: 1, duration: 0.9, ease: "power3.out", immediateRender: false }, "landed")
    .to(bits, { autoAlpha: 0, duration: 0.3, ease: "sine.in" }, "landed+=0.5")
    .to({}, { duration: 0.1 });
}

/**
 * ready: intro xong, mũ đứng yên, lúc này làm việc nặng không ai thấy.
 * open(): tung mũ khỏi màn hình rồi các dải nền trượt đi để lộ thiệp. opening resolve đúng lúc thiệp bắt đầu lộ ra.
 */
export function startSplash() {
  const el = $("splash");
  if (!canAnimate()) {
    el.remove();
    revealPage();
    return { ready: Promise.resolve(), opening: Promise.resolve(), open: async () => {} };
  }

  gsap.to(".sp-glow", { autoAlpha: 1, duration: 0.4, ease: "sine.out" });
  const strips = buildStrips(el);
  const intro = buildIntro(buildBits($("spScene"))).pause();
  requestAnimationFrame(() => intro.play()); // không đợi tải trang: khách phải thấy chuyển động ngay
  el.addEventListener("pointerdown", () => intro.timeScale(SKIP_SPEED), { once: true });

  let idle;
  const ready = intro.then(() => {
    // Chỉ thấy khi API chậm: dữ liệu về sớm thì open() hủy tween này trước khi nó kịp chạy.
    idle = gsap.to("#spCap", { y: -8, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.4 });
  });

  let markOpening;
  const opening = new Promise((resolve) => (markOpening = resolve));

  return {
    ready,
    opening,
    async open() {
      idle.kill();
      const { bottom } = $("spCap").getBoundingClientRect();
      await gsap.timeline()
        .to("#spCap", { y: 10, scale: 0.94, duration: 0.18, ease: "sine.out" }, 0)
        .to("#spCap", { y: -(bottom + 60), scale: 0.8, rotation: "+=320", duration: 0.6, ease: "power2.in" }, 0.18)
        .to(["#spLines", ".sp-glow"], { autoAlpha: 0, duration: 0.4, ease: "sine.inOut" }, 0.2)
        .addLabel("open", 0.5)
        .call(() => { revealPage(); markOpening(); }, null, "open")
        .set(el, { backgroundColor: "transparent" }, "open")
        .to(strips, { xPercent: (i) => (i % 2 ? 102 : -102), duration: 0.85, ease: "expo.inOut", stagger: { each: 0.05, from: "center" } }, "open")
        .from(".term-bar, .term-body", { opacity: 0, y: 36, duration: 0.8, stagger: 0.08, ease: "power3.out", clearProps: "all" }, "open+=0.3")
        .from(".term .ln", { opacity: 0, x: -14, duration: 0.45, stagger: 0.1, ease: "power2.out", clearProps: "all" }, "open+=0.45");
      el.remove();
    },
  };
}
