import { canAnimate } from "./util.js";

// Chỉ làm mượt chuột và trackpad. Màn hình cảm ứng giữ scroll gốc của máy.
export function initSmoothScroll(onUpdate) {
  if (!canAnimate()) return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 0.9, onUpdate });
}
