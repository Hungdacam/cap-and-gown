import { $, canAnimate } from "./util.js";

const GLYPHS = "ABCDEFGHKMNPRSTUVXYZ0123456789#$%&@<>/=+";

/** Tên khách hiện ra như đang được giải mã: ký tự ngẫu nhiên chạy rồi chốt dần từ trái sang phải. */
function scramble(el, final, duration) {
  const chars = Array.from(final), o = { p: 0 };
  return gsap.to(o, {
    p: 1, duration, ease: "none",
    onUpdate() {
      const n = chars.length;
      let out = "";
      for (let i = 0; i < n; i++) {
        const on = 0.25 + (0.65 * i) / n;
        if (chars[i] === " ") out += " ";
        else if (o.p >= on) out += chars[i];
        else if (o.p >= (i / n) * 0.3) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out; // textContent: tên khách là dữ liệu không tin cậy
    },
    onComplete: () => { el.textContent = final; },
  });
}

/** Chạy lúc thiệp vừa lộ ra sau splash: terminal gõ lệnh, tên giải mã, thẻ tốt nghiệp đung đưa rồi đóng dấu. */
export function playHeroIntro() {
  if (!canAnimate()) return;
  const name = $("guestName"), final = name.textContent;
  const narrow = matchMedia("(max-width:640px)").matches;
  name.setAttribute("aria-label", final);
  name.textContent = "";
  gsap.timeline()
    .from(".term-bar, .term-body", { opacity: 0, y: 36, duration: 0.8, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform" })
    .fromTo(".term-body .ln", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "steps(22)", stagger: 0.28, clearProps: "clipPath" }, "-=0.45")
    .fromTo(".hello .greet", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.35, clearProps: "opacity,transform" }, "-=0.15")
    .add(scramble(name, final, 1.1), "-=0.1")
    .call(() => name.removeAttribute("aria-label"))
    .fromTo(".lede", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, clearProps: "opacity,transform" }, "-=0.5")
    .fromTo("#idcard", { rotation: -22, y: -80, opacity: 0 }, { rotation: narrow ? 0 : 1.6, y: 0, opacity: 1, duration: 1.8, ease: "elastic.out(1,.32)" }, 0.35)
    .fromTo("#cardScan", { top: "-22%", opacity: 1 }, { top: "100%", duration: 1, ease: "power1.inOut" }, "-=0.9")
    .set("#cardScan", { opacity: 0 })
    .fromTo("#cardStamp", { scale: 2.6, rotation: -30, opacity: 0 }, { scale: 1, rotation: -9, opacity: 1, duration: 0.45, ease: "back.out(3)" });
}

/** Thẻ tốt nghiệp nghiêng 3D theo con trỏ chuột (màn hình cảm ứng thì đứng yên). */
export function initCardTilt() {
  if (!canAnimate()) return;
  const card = $("idcard"), hero = card.closest(".term");
  gsap.set(card, { transformPerspective: 700 });
  const rx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" });
  const ry = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = card.getBoundingClientRect();
    ry(((e.clientX - (r.left + r.width / 2)) / innerWidth) * 22);
    rx((-(e.clientY - (r.top + r.height / 2)) / innerHeight) * 16);
  });
  hero.addEventListener("pointerleave", () => { rx(0); ry(0); });
}
