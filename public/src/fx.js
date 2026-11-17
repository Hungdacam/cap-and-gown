import { EVENT } from "./config.js";
import { $, canAnimate, formatDayMonth } from "./util.js";

// Hiệu ứng 2D trên canvas #confetti và thẻ cảm xúc #mood sau mỗi lựa chọn của khách.
// Chỉ để trang trí: thiếu GSAP, giảm chuyển động, hay chạy trong test (không có window) thì bỏ qua, không bao giờ ném lỗi.
const live = () => typeof window !== "undefined" && typeof matchMedia === "function" && canAnimate();
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const palette = () => ["--accent", "--pink", "--amber", "--ok", "--merge"].map(css);

let canvas = null, ctx = null, dpr = 1, raf = 0;
const parts = [];

function setup() {
  if (canvas) return;
  canvas = $("confetti");
  ctx = canvas.getContext("2d");
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };
  size();
  addEventListener("resize", size);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function burstAt(x, y, c) {
  const n = innerWidth < 600 ? 46 : 72;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sp = 2.2 + Math.random() * 3.6;
    parts.push({ k: "s", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: Math.random() < 0.25 ? "#ffffff" : c, life: 1, r: 1.4 + Math.random() * 1.6 });
  }
}

function step() {
  raf = 0;
  const W = innerWidth, H = innerHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    let dead = false;
    if (p.k === "c") { // pháo giấy
      p.vy += 0.3; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.009;
      dead = p.life <= 0 || p.y > H + 40;
      if (!dead) {
        ctx.globalAlpha = clamp01(p.life * 1.5); ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.r * 2), p.w, p.h * Math.cos(p.r * 2)); ctx.restore();
      }
    } else if (p.k === "r") { // pháo hoa đang bay lên
      p.y += p.vy; p.vy *= 0.985;
      ctx.globalAlpha = 1; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.3); ctx.fill();
      parts.push({ k: "t", x: p.x + (Math.random() - 0.5) * 2, y: p.y + 5, c: p.c, life: 0.8, r: 1.7 });
      if (p.y <= p.ty || p.vy > -1.6) { burstAt(p.x, p.y, p.c); dead = true; }
    } else if (p.k === "s") { // tia pháo hoa
      p.vx *= 0.965; p.vy = p.vy * 0.965 + 0.07; p.x += p.vx; p.y += p.vy; p.life -= 0.013;
      dead = p.life <= 0;
      if (!dead) { ctx.globalAlpha = clamp01(p.life * 1.2); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill(); }
    } else if (p.k === "t") { // vệt chấm
      p.life -= 0.045; dead = p.life <= 0;
      if (!dead) { ctx.globalAlpha = clamp01(p.life) * 0.7; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.3); ctx.fill(); }
    } else if (p.k === "g") { // ký tự bay lên: ? hoặc ♥
      if (p.delay > 0) { p.delay--; continue; }
      p.y += p.vy; p.ph += 0.05; p.x += Math.sin(p.ph) * 0.7; p.life -= 0.008; dead = p.life <= 0;
      if (!dead) { ctx.globalAlpha = clamp01(p.life * 1.3); ctx.fillStyle = p.c; ctx.font = `700 ${p.sz}px "Chakra Petch", system-ui, sans-serif`; ctx.fillText(p.ch, p.x, p.y); }
    } else if (p.k === "d") { // mưa
      p.y += p.vy; if (p.y > H) p.life -= 0.34; dead = p.life <= 0;
      if (!dead) { ctx.globalAlpha = 0.45; ctx.strokeStyle = p.c; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.5, p.y - p.len); ctx.stroke(); }
    }
    if (dead) parts.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(step);
}

/** Pháo giấy bắn từ (x, y); không truyền thì bắn từ giữa màn hình. */
export function confetti(x, y) {
  if (!live()) return;
  setup();
  x ??= innerWidth / 2; y ??= innerHeight * 0.6;
  const cols = palette(), n = innerWidth < 600 ? 70 : 120;
  for (let i = 0; i < n; i++) {
    parts.push({ k: "c", x, y, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 3, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.35, c: cols[i % cols.length], life: 1 });
  }
  kick();
}

function fireworks() {
  const cols = palette();
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      parts.push({ k: "r", x: innerWidth * (0.15 + 0.7 * Math.random()), y: innerHeight + 10, vy: -(innerHeight * 0.021 + Math.random() * 3), ty: innerHeight * (0.14 + Math.random() * 0.28), c: cols[i % cols.length], life: 1 });
      kick();
    }, i * 240);
  }
}
function glyphs(x, y, ch, c) {
  for (let i = 0; i < 16; i++) parts.push({ k: "g", ch, x: x + (Math.random() - 0.5) * 180, y: y + Math.random() * 20, vy: -(1 + Math.random() * 1.5), ph: Math.random() * 6, sz: 14 + Math.random() * 18, c, life: 1, delay: i * 4 });
  kick();
}
function rain() {
  const c = css("--accent"), n = innerWidth < 600 ? 90 : 160;
  for (let i = 0; i < n; i++) parts.push({ k: "d", x: Math.random() * innerWidth, y: -Math.random() * innerHeight * 0.9, vy: 9 + Math.random() * 6, len: 10 + Math.random() * 14, c, life: 1 });
  kick();
}

const ICONS = {
  yes: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle class="dr" cx="32" cy="32" r="28"/><path class="dr" d="M19 33l9 9 18-20"/></svg>',
  maybe: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h28M18 56h28M22 8c0 14 20 16 20 24S22 42 22 56M42 8c0 14-20 16-20 24s20 10 20 24"/></svg>',
  no: '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 55S8 41 8 23a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 18-24 32-24 32z"/></svg>',
  wish: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
};
const host = EVENT.graduateShort;
const MOOD = {
  yes: { c: "--ok", t: ({ pron }) => `Hẹn gặp ${pron}!`, s: ({ when }) => `${when ? `Lúc ${when} · ` : ""}${EVENT.meetingPoint}` },
  maybe: { c: "--amber", t: () => "Chưa chắc cũng không sao", s: () => `Báo lại cho ${host} trước ngày ${formatDayMonth(EVENT.rsvpDeadline)} nhé` },
  no: { c: "--pink", t: () => "Tiếc quá!", s: ({ pron }) => `${host} cảm ơn ${pron} đã báo. Hẹn dịp khác nhé.` },
  wish: { c: "--accent", t: () => "Đã gửi lời chúc!", s: () => `${host} cảm ơn bạn rất nhiều.` },
};
let moodTl = null;

/**
 * Hiệu ứng theo tâm trạng: yes = pháo hoa, maybe = dấu hỏi bay, no = mưa nhẹ, wish = tim bay.
 * Thẻ ở giữa màn hình chỉ để nhìn (aria-hidden); nội dung đã có trong #log cho trình đọc màn hình.
 */
export function mood(kind, { when = "", pron = "bạn", fromEl = null } = {}) {
  if (!live() || !MOOD[kind]) return;
  setup();
  const m = MOOD[kind], card = $("moodCard"), ic = $("moodIc");
  ic.innerHTML = ICONS[kind]; // SVG cố định trong file, không chứa dữ liệu khách
  ic.style.color = `var(${m.c})`;
  card.style.borderColor = `var(${m.c})`;
  $("moodT").textContent = m.t({ when, pron });
  $("moodS").textContent = m.s({ when, pron });

  const r = fromEl ? fromEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
  const cx = r.left + r.width / 2, cy = r.top;
  if (kind === "yes") { fireworks(); confetti(cx, cy); }
  else if (kind === "maybe") glyphs(cx, cy, "?", css("--amber"));
  else if (kind === "no") rain();
  else glyphs(cx, cy, "♥", css("--pink"));

  moodTl?.kill();
  const svg = ic.querySelector("svg");
  moodTl = gsap.timeline()
    .set("#mood", { autoAlpha: 1 })
    .fromTo(card, { scale: 0.6, rotateX: -55, y: 40, opacity: 0 }, { scale: 1, rotateX: 0, y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.8)" });
  if (kind === "yes") {
    ic.querySelectorAll(".dr").forEach((p, i) => {
      const L = p.getTotalLength();
      moodTl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 0.35 + i * 0.3);
    });
  } else if (kind === "maybe") moodTl.fromTo(svg, { rotation: 0 }, { rotation: 180, duration: 0.9, ease: "back.inOut(2)", transformOrigin: "50% 50%" }, 0.4);
  else if (kind === "no") moodTl.fromTo(svg, { scale: 1 }, { scale: 1.18, duration: 0.22, yoyo: true, repeat: 3, ease: "power1.inOut", transformOrigin: "50% 50%" }, 0.4);
  else moodTl.fromTo(svg, { x: -16, y: 12, rotation: -12 }, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: "power3.out" }, 0.3);
  moodTl.to(card, { opacity: 0, y: -24, scale: 0.96, duration: 0.45, ease: "power2.in" }, "+=2").set("#mood", { autoAlpha: 0 });
}

/** Máy bay giấy bay từ nút gửi lên trời, để lại vệt chấm. */
export function planeFly(fromEl) {
  if (!live() || !fromEl) return;
  setup();
  const r = fromEl.getBoundingClientRect(), x0 = r.left + r.width / 2 - 17, y0 = r.top - 17, c = css("--accent");
  const p = document.createElement("div");
  p.className = "plane";
  p.setAttribute("aria-hidden", "true");
  p.innerHTML = ICONS.wish;
  document.body.append(p);
  gsap.set(p, { x: x0, y: y0, rotation: -20, scale: 0.4, opacity: 0 });
  gsap.timeline({
    onComplete: () => p.remove(),
    onUpdate: () => { parts.push({ k: "t", x: gsap.getProperty(p, "x") + 6, y: gsap.getProperty(p, "y") + 26, c, life: 1, r: 2.6 }); kick(); },
  })
    .to(p, { opacity: 1, scale: 1, duration: 0.25 })
    .to(p, { keyframes: [
      { x: x0 + 70, y: y0 - 90, rotation: -35, duration: 0.5, ease: "sine.out" },
      { x: x0 - 70, y: y0 - 200, rotation: -160, duration: 0.6, ease: "sine.inOut" },
      { x: innerWidth + 80, y: -90, rotation: -25, duration: 0.95, ease: "power2.in" },
    ] });
}
