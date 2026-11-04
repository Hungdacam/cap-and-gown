export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  const W = (c.width = innerWidth), H = (c.height = innerHeight);
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--accent", "--pink", "--amber", "--ok"].map((v) => cs.getPropertyValue(v).trim());
  const chars = ["{ }", "</>", ";", "=>", "[ ]", "++", "&&", "#"];
  const P = Array.from({ length: 70 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.6,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 13 - 5,
    t: chars[(Math.random() * chars.length) | 0], c: colors[(Math.random() * colors.length) | 0],
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2,
  }));
  let f = 0;
  (function step() {
    ctx.clearRect(0, 0, W, H);
    P.forEach((p) => {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.font = "700 15px JetBrains Mono, monospace"; ctx.fillText(p.t, 0, 0); ctx.restore();
    });
    if (++f < 110) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
  })();
}
