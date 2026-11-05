import { $, canAnimate } from "./util.js";
import { createLines } from "./splash-lines.js";

const BITS = 18;
const SKIP_SPEED = 5;
const CAP_SQUASH = 0.88;
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

function buildIntro(bits) {
  const { random } = gsap.utils;
  const scene = $("spScene").getBoundingClientRect();
  const node = { x: scene.left + scene.width / 2, y: scene.top + scene.height * NODE_Y };
  const lines = createLines($("spLines"), node, MERGE_AT);
  const clock = { time: 0 };

  gsap.set("#spCap", { transformOrigin: "48.08% 38.89%", yPercent: 105, scale: 0.3, rotation: -40 }); // tâm mặt mũ, trùng tâm .sp-warp khi phóng to
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

/** Số lần phóng để hình thoi tâm (cx, cy) phủ kín màn hình: |dx|/(w/2) + |dy|/(h/2) <= scale. */
function coverScale({ left, top, width, height }) {
  const dx = Math.max(left + width / 2, innerWidth - left - width / 2);
  const dy = Math.max(top + height / 2, innerHeight - top - height / 2);
  return dx / (width / 2) + dy / (height / 2);
}

/**
 * ready: intro xong, mũ đứng yên, lúc này làm việc nặng không ai thấy.
 * open(): mũ lao vào màn hình rồi mở ra thiệp. opening resolve đúng lúc thiệp bắt đầu lộ ra.
 */
export function startSplash() {
  const el = $("splash");
  if (!canAnimate()) {
    el.remove();
    revealPage();
    return { ready: Promise.resolve(), opening: Promise.resolve(), open: async () => {} };
  }

  gsap.to(".sp-glow", { autoAlpha: 1, duration: 0.4, ease: "sine.out" });
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
      await gsap.timeline({ defaults: { duration: 0.25 } })
        .to("#spCap", { y: 0, scale: CAP_SQUASH, ease: "power2.out" }, 0)
        .to(["#spLines", ".sp-glow"], { autoAlpha: 0, ease: "sine.out" }, 0);

      const rect = document.querySelector(".sp-cap-top").getBoundingClientRect();
      const scale = coverScale(rect);
      gsap.set("#spWarp", { autoAlpha: 1, left: rect.left, top: rect.top, width: rect.width, height: rect.height });

      await gsap.timeline({ defaults: { duration: 0.7, ease: "power3.in" } })
        .to("#spCap", { scale: CAP_SQUASH * scale }, 0)
        .to("#spWarp", { scale }, 0)
        .to("#spCap", { autoAlpha: 0, duration: 0.22, ease: "sine.in" }, 0.15) // mũ phóng to mà còn sáng thì rất chói
        .addLabel("open", 0.7)
        .call(() => { revealPage(); markOpening(); }, null, "open")
        .set("#spBg", { autoAlpha: 0 }, "open")
        .to("#spWarp", { autoAlpha: 0, duration: 0.55, ease: "sine.out" }, "open")
        .from(".term-bar, .term-body", { opacity: 0, y: 36, duration: 0.8, stagger: 0.08, ease: "power3.out", clearProps: "all" }, "open")
        .from(".term .ln", { opacity: 0, x: -14, duration: 0.45, stagger: 0.1, ease: "power2.out", clearProps: "all" }, "open+=0.15");
      el.remove();
    },
  };
}
