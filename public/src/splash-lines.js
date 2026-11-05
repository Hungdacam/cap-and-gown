// Các đường line của splash, vẽ bằng canvas: mỗi khung chỉ tốn vài lệnh vẽ và không làm trình duyệt vẽ lại phần còn lại của trang.
const STEPS = 64;
const PER_SIDE = 7;
const MAX_DPR = 2;
const COLORS = ["--accent", "--pink", "--amber", "--accent", "--ok", "--pink", "--accent"];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const rgba = (hex, alpha) => {
  const n = Number.parseInt(hex.trim().slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
};

function sampleCurve(p0, p1, p2, p3) {
  const at = (a, b, c, d, t) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };
  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    return [at(p0[0], p1[0], p2[0], p3[0], t), at(p0[1], p1[1], p2[1], p3[1], t)];
  });
}

function buildStrands(width, height, node, mergeAt, palette, ctx) {
  const spread = Math.min(height * 0.24, 170);
  const { x: cx, y: cy } = node;
  const fade = (x0, x1, color, flip) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(flip ? 1 : 0, rgba(color, 0));
    g.addColorStop(0.3, flip ? rgba(color, 1) : rgba(color, 0.9));
    g.addColorStop(flip ? 0 : 1, rgba(palette.text, 1));
    return g;
  };
  const strands = [];
  for (let i = 0; i < PER_SIDE; i += 1) {
    const offset = (i - 3) / 3;
    const fromCenter = Math.abs(i - 3);
    const color = palette.colors[i];
    const y = cy + offset * spread;
    strands.push({
      pts: sampleCurve([-20, y], [cx * 0.42, y], [cx * 0.62, cy], [cx, cy]),
      stroke: fade(0, cx, color, false), color, delay: (3 - fromCenter) * 0.05, duration: 0.7, ease: "sine.out", dotAt: 0.55,
    });
    const reach = width - cx;
    const endY = cy + offset * spread * 1.15;
    strands.push({
      pts: sampleCurve([cx, cy], [cx + reach * 0.38, cy], [cx + reach * 0.58, endY], [width + 20, endY]),
      stroke: fade(cx, width, color, true), color, delay: mergeAt + fromCenter * 0.06, duration: 0.85, ease: "sine.out", dotAt: 0.5,
    });
  }
  return strands;
}

/** node: điểm hội tụ, tính theo màn hình. Trả về draw(giây) và lúc các đường bên phải hoàn tất. */
export function createLines(canvas, node, mergeAt) {
  const width = innerWidth, height = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name).trim();
  const palette = { text: token("--text"), bg: token("--bg"), colors: COLORS.map(token) };
  const strands = buildStrands(width, height, node, mergeAt, palette, ctx)
    .map((s) => ({ ...s, ease: gsap.parseEase(s.ease) }));

  const drawStrand = (s, time) => {
    const progress = clamp01((time - s.delay) / s.duration);
    if (!progress) return;
    const reached = s.ease(progress) * STEPS;
    const last = Math.floor(reached);
    const frac = reached - last;
    const [ax, ay] = s.pts[last];
    const [bx, by] = s.pts[Math.min(last + 1, STEPS)];
    const tipX = ax + (bx - ax) * frac, tipY = ay + (by - ay) * frac;

    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i <= last; i += 1) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = s.stroke;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const dot = Math.round(s.dotAt * STEPS);
    if (last >= dot) {
      const [x, y] = s.pts[dot];
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = palette.bg;
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    if (progress < 1) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.text;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);
    strands.forEach((s) => drawStrand(s, time));
    const grown = clamp01((time - mergeAt) / 0.3);
    if (grown) {
      ctx.fillStyle = palette.colors[0];
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 11 * grown, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.text;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3.6 * grown, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  return { draw, duration: Math.max(...strands.map((s) => s.delay + s.duration)) };
}
