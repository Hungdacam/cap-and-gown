// Album ngày lễ: vòng ảnh 3D (CSS 3D, GPU lo phần xoay), ảnh riêng của khách, và khung xem ảnh lớn.
// Mỗi khung hình chỉ đổi transform/opacity của vài tấm ảnh, và chỉ chạy khi vòng ảnh đang trong màn hình.
import { PHOTOS, COPY } from "./config.js";
import { $, esc, canAnimate } from "./util.js";
import { guestText } from "./address.js";

const TAU = Math.PI * 2;

/** Ảnh mẫu vẽ bằng canvas, dùng khi chưa có ảnh thật (PHOTOS[].src để trống). */
function placeholder(i, { at, caption }, w = 600, h = 760) {
  const HUES = [[214, 262], [330, 18], [152, 204], [38, 8], [262, 312], [196, 150], [12, 340], [48, 92]];
  const [h1, h2] = HUES[i % HUES.length];
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${h1} 55% 26%)`);
  g.addColorStop(1, `hsl(${h2} 60% 14%)`);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  // đốm sáng như ảnh chụp ngoài trời bị xoá phông
  let seed = i * 9301 + 49297;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < 26; k++) {
    const r = 18 + rnd() * 70, cx = rnd() * w, cy = rnd() * h * 0.75;
    const b = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    b.addColorStop(0, `hsla(${h1 + rnd() * 60} 90% 75% / ${0.1 + rnd() * 0.22})`);
    b.addColorStop(1, "hsla(0 0% 100% / 0)");
    x.fillStyle = b;
    x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  // mũ tốt nghiệp nét mảnh ở giữa
  x.save();
  x.translate(w / 2, h * 0.42);
  x.strokeStyle = "rgba(255,255,255,.55)";
  x.lineWidth = 5; x.lineJoin = "round";
  x.beginPath(); x.moveTo(0, -60); x.lineTo(110, -14); x.lineTo(0, 32); x.lineTo(-110, -14); x.closePath(); x.stroke();
  x.beginPath(); x.moveTo(-62, 6); x.lineTo(-62, 52); x.quadraticCurveTo(0, 86, 62, 52); x.lineTo(62, 6); x.stroke();
  x.beginPath(); x.moveTo(0, -14); x.lineTo(84, 0); x.lineTo(84, 58); x.stroke();
  x.restore();
  x.fillStyle = "rgba(255,255,255,.92)";
  x.font = "700 64px 'JetBrains Mono', monospace";
  x.textAlign = "center";
  x.fillText(at, w / 2, h * 0.73);
  x.font = "500 30px 'Be Vietnam Pro', sans-serif";
  x.fillStyle = "rgba(255,255,255,.8)";
  x.fillText(caption, w / 2, h * 0.73 + 50, w - 60);
  x.font = "500 22px 'JetBrains Mono', monospace";
  x.fillStyle = "rgba(255,255,255,.45)";
  x.fillText("ảnh mẫu · thay bằng ảnh thật", w / 2, h - 34);
  return c.toDataURL("image/jpeg", 0.86);
}

/** Khung xem ảnh lớn: trước/sau, phím mũi tên, Esc và chạm nền để đóng. */
function createLightbox() {
  const lb = $("lb"), img = $("lbImg"), cap = $("lbCap"), fig = $("lbFig");
  let list = [], idx = 0, lastFocus = null;
  const anim = canAnimate();
  const paint = () => {
    const p = list[idx];
    img.src = p.src;
    img.alt = p.caption;
    cap.textContent = [p.at ? `25/11/2026 · ${p.at}` : "25/11/2026", p.caption].filter(Boolean).join(" · ");
    $("lbPrev").hidden = $("lbNext").hidden = list.length < 2;
  };
  const go = (d) => {
    idx = (idx + d + list.length) % list.length;
    if (anim) gsap.fromTo(fig, { x: d * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
    paint();
  };
  const close = () => {
    const done = () => { lb.hidden = true; window.ScrollSmoother?.get()?.paused(false); lastFocus?.focus?.({ preventScroll: true }); };
    if (anim) gsap.to(lb, { opacity: 0, duration: 0.25, onComplete: done });
    else done();
  };
  $("lbClose").addEventListener("click", close);
  $("lbPrev").addEventListener("click", () => go(-1));
  $("lbNext").addEventListener("click", () => go(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });
  return (photos, i) => {
    list = photos; idx = i; lastFocus = document.activeElement;
    paint();
    lb.hidden = false;
    window.ScrollSmoother?.get()?.paused(true);
    if (anim) {
      gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(fig, { scale: 0.82, rotateX: 14, y: 30, transformPerspective: 900 }, { scale: 1, rotateX: 0, y: 0, duration: 0.6, ease: "back.out(1.5)", clearProps: "transform" });
    }
    $("lbClose").focus({ preventScroll: true });
  };
}

const isDev = () => ["localhost", "127.0.0.1"].includes(location.hostname);

/**
 * Ảnh riêng (cột anh_rieng): khách riêng thì ảnh dọc kiểu polaroid; link chung của nhóm thì ảnh tập thể,
 * thường là ảnh ngang đông người, nên khung rộng hết chiều ngang để nhìn rõ từng gương mặt.
 * Ảnh thật nằm ngang thì cũng chuyển sang khung rộng, bất kể loại link.
 */
function initFeatured(guest, open) {
  if (!guest.photo) return;
  const group = guest.shared === true;
  const cap = guestText(group ? COPY.groupCap : COPY.meCap, guest);
  const me = { src: guest.photo, caption: cap, at: "" };
  const box = $("me"), img = $("meImg");
  box.classList.toggle("wide", group);
  img.alt = cap;
  img.addEventListener("load", () => box.classList.toggle("wide", group || img.naturalWidth > img.naturalHeight * 1.1));
  // Thiếu file ảnh: chạy ở máy thì vẽ ảnh mẫu để xem bố cục, trên site thật thì ẩn khung đi.
  img.addEventListener("error", () => {
    if (!isDev() || me.src.startsWith("data:")) { box.hidden = true; return; }
    me.src = img.src = group ? placeholder(2, { at: "25/11", caption: cap }, 960, 600) : placeholder(5, { at: "25/11", caption: cap });
  });
  img.src = me.src;
  $("meLabel").textContent = guestText(group ? COPY.groupLabel : COPY.meLabel, guest);
  $("meCap").textContent = cap;
  $("meSub").textContent = guestText(group ? COPY.groupSub : COPY.meSub, guest);
  $("mePhoto").addEventListener("click", () => open([me], 0));
  box.hidden = false;
}

/** Trả về { S, render, bindScroll } để scroll-effects nghiêng vòng ảnh theo cuộn, hoặc null khi không có hiệu ứng. */
export function initGallery(guest = {}) {
  const open = createLightbox();
  const photos = PHOTOS.map((p, i) => {
    const src = p.src || placeholder(i, { at: p.at || "25/11", caption: p.caption || "" });
    return { ...p, src, thumb: p.thumb || src };
  });
  initFeatured(guest, open);

  // --- vòng ảnh
  const ring = $("ring"), spin = $("ringSpin");
  spin.innerHTML = photos.map((p, i) =>
    `<button class="ph" type="button" data-i="${i}" aria-label="Xem ảnh ${i + 1} trên ${photos.length}${p.at ? `, chụp lúc ${esc(p.at)}` : ""}">` +
    `<img src="${esc(p.thumb)}" alt="" draggable="false" decoding="async"><span class="ph-cap"><time>${esc(p.at || "25/11")}</time>${esc(p.caption || "")}</span></button>`).join("");
  const cards = [...spin.children];
  const n = cards.length, step = 360 / n;
  const S = { angle: 0, vel: 0, tilt: -6, lift: 0 };

  if (!canAnimate() || n < 3) {
    // Không có hiệu ứng (giảm chuyển động hoặc thiếu GSAP): dải ảnh cuộn ngang bình thường.
    ring.classList.add("flat");
    cards.forEach((c, i) => c.addEventListener("click", () => open(photos, i)));
    return null;
  }

  let R = 300;
  const layout = () => {
    const w = cards[0].offsetWidth || 200;
    R = Math.round((w / 2) / Math.tan(Math.PI / n) + w * 0.22);
    cards.forEach((c, i) => { c.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    render(true);
  };
  const lastOp = new Array(n).fill(-1);
  function render(force = false) {
    spin.style.transform = `translate3d(0,${(S.lift * 60).toFixed(1)}px,${-R}px) rotateX(${S.tilt.toFixed(2)}deg) rotateY(${S.angle.toFixed(2)}deg)`;
    // Ảnh quay ra phía sau thì mờ đi; chỉ đụng DOM khi giá trị đổi.
    for (let i = 0; i < n; i++) {
      const f = Math.cos(((i * step + S.angle) * Math.PI) / 180);
      const op = Math.round((0.18 + 0.82 * Math.max(0, f) ** 1.4) * 50) / 50;
      if (force || op !== lastOp[i]) { lastOp[i] = op; cards[i].style.opacity = op; cards[i].classList.toggle("front", f > 0.92); }
    }
  }

  // Tự xoay chậm; kéo thì xoay theo tay, thả ra còn trôi theo đà.
  const AUTO = -7; // độ mỗi giây
  let visible = false, dragging = false, last = 0;
  const tick = (_t, dt) => {
    if (!dragging) {
      S.vel += (AUTO - S.vel) * Math.min(1, dt / 900);
      S.angle += (S.vel * dt) / 1000;
    }
    render();
  };
  const run = (on) => { if (on === visible) return; visible = on; on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick); };
  new IntersectionObserver(([e]) => run(e.isIntersecting), { rootMargin: "80px" }).observe(ring);

  let x0 = 0, moved = 0, downOn = null;
  ring.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; x0 = e.clientX; last = performance.now();
    downOn = e.target.closest(".ph");
    ring.setPointerCapture(e.pointerId);
    ring.classList.add("drag");
  });
  ring.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - x0, now = performance.now();
    x0 = e.clientX; moved += Math.abs(dx);
    const d = dx * 0.32;
    S.angle += d;
    S.vel = (d / Math.max(8, now - last)) * 1000;
    last = now;
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    ring.classList.remove("drag");
    S.vel = Math.max(-240, Math.min(240, S.vel));
    if (moved < 6 && downOn) open(photos, Number(downOn.dataset.i));
  };
  ring.addEventListener("pointerup", up);
  // Trình duyệt giành lấy cú vuốt để cuộn dọc trang: chỉ thả tay, không mở ảnh.
  ring.addEventListener("pointercancel", () => { downOn = null; up(); });
  // Bàn phím: Enter/Space trên một tấm thì mở; phím mũi tên xoay vòng.
  cards.forEach((c, i) => c.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(photos, i); }
  }));
  ring.addEventListener("keydown", (e) => {
    const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (d) { e.preventDefault(); gsap.to(S, { angle: Math.round(S.angle / step + d) * step, duration: 0.6, ease: "power3.out" }); }
  });

  new ResizeObserver(layout).observe(ring);
  layout();

  return {
    S, render,
    /** Cuộn trang cũng đẩy vòng ảnh quay theo một chút. */
    bindScroll(trigger) {
      ScrollTrigger.create({
        trigger, start: "top bottom", end: "bottom top",
        onUpdate: (self) => { if (!dragging) S.vel += Math.max(-60, Math.min(60, self.getVelocity() * -0.02)); },
      });
    },
  };
}

