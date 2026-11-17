import { EVENT } from "./config.js";
import { $, canAnimate } from "./util.js";

// Sơ đồ 3D khuôn viên IUH, dựng theo bản vẽ khuôn viên (toạ độ mx, my: bắc ở trên, đường Nguyễn Văn Bảo ở dưới).
// Sơ đồ minh họa, chưa đúng tỉ lệ. Lộ trình chạy như gói tin trên mạng, camera bám theo, các bước đi sáng dần (traceroute).
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ez = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, k) => a + (b - a) * k;

// [tên, mx0, mx1, my0, my1, chiều cao]; E và H là khu điểm hẹn
const BUILDINGS = [["E", 262, 378, 140, 222, 1.5], ["H", 100, 190, 130, 270, 2.6], ["B", 205, 255, 100, 190, 1.8], ["V", 275, 335, 20, 125, 3.3], ["X", 350, 405, 45, 125, 2.5], ["D", 420, 480, 60, 200, 2.7], ["T", 495, 530, 90, 130, 1.2], ["F", 460, 520, 160, 240, 1.9], ["I", 545, 640, 95, 205, 2.2], ["G", 540, 650, 210, 330, 2.4], ["C", 492, 538, 215, 330, 1.6], ["A", 40, 190, 285, 390, 1.9], ["", 235, 465, 366, 384, 0.4]];
const MEET = new Set(["E", "H"]);

/**
 * Trả về null khi không chạy được 3D (thiếu THREE, không có WebGL, giảm chuyển động): khi đó dùng sơ đồ 2D.
 * onHop(i, total): gói tin vừa qua bước i; i = -1 khi bắt đầu chạy lại.
 */
export function initMap3d({ onHop = () => {} } = {}) {
  const T = window.THREE;
  if (!canAnimate() || !T) return null;
  const wrap = $("map3d"), cv = $("campus");
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  let raf = 0, visible = false; // khai báo trước paint(): paint gọi kick()
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(38, 1, 0.1, 300);
  scene.add(new T.AmbientLight(0xffffff, 0.72));
  const dl = new T.DirectionalLight(0xffffff, 0.8); dl.position.set(-8, 16, 10); scene.add(dl);
  const X = (mx) => (mx - 330) / 40, Z = (my) => (my - 200) / 40;

  const paints = []; // [material, token, pha với màu nền]
  const M = (kind, token, opts = {}, mix = 0) => {
    const m = kind === "line" ? new T.LineBasicMaterial(opts) : kind === "dash" ? new T.LineDashedMaterial(opts) : kind === "basic" ? new T.MeshBasicMaterial(opts) : new T.MeshLambertMaterial(opts);
    paints.push([m, token, mix]);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const rect = (x0, x1, y0, y1, h, mat, base = 0) => box(X(x1) - X(x0), h, Z(y1) - Z(y0), mat, (X(x0) + X(x1)) / 2, base + h / 2, (Z(y0) + Z(y1)) / 2);
  const edges = (mesh, mat, parent = scene) => { const e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry), mat); e.position.copy(mesh.position); parent.add(e); return e; };

  // nền bản vẽ và lưới
  const ground = new T.Mesh(new T.PlaneGeometry(70, 50), M("basic", "--surface"));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  {
    const a = [], b = [];
    for (let i = -30; i <= 30; i++) (i % 5 ? a : b).push(i, 0, -22, i, 0, 22);
    for (let j = -22; j <= 22; j++) (j % 5 ? a : b).push(-30, 0, j, 30, 0, j);
    [[a, 0.35], [b, 0.8]].forEach(([pts, op]) => {
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
      const l = new T.LineSegments(g, M("line", "--line", { transparent: true, opacity: op })); l.position.y = -0.01; scene.add(l);
    });
  }
  // đường Nguyễn Văn Bảo (dưới) và Lê Quang Định (trên), có vạch giữa đường
  const road = M("lambert", "--surface-2");
  rect(-300, 960, 392, 424, 0.04, road); rect(-300, 960, -62, -32, 0.04, road);
  [408, -47].forEach((my) => {
    const g = new T.BufferGeometry().setFromPoints([new T.Vector3(X(-300), 0.07, Z(my)), new T.Vector3(X(960), 0.07, Z(my))]);
    const l = new T.Line(g, M("dash", "--muted", { dashSize: 0.35, gapSize: 0.3, transparent: true, opacity: 0.7 })); l.computeLineDistances(); scene.add(l);
  });
  // ranh khuôn viên, sân xe đạp, sân trước nhà E và nhà H
  scene.add(new T.LineLoop(new T.BufferGeometry().setFromPoints([[30, 0], [660, 0], [660, 390], [30, 390]].map(([x, y]) => new T.Vector3(X(x), 0.04, Z(y)))), M("line", "--accent", { transparent: true, opacity: 0.45 })));
  edges(rect(255, 455, 250, 360, 0.03, M("basic", "--accent", { transparent: true, opacity: 0.09 })), M("line", "--accent", { transparent: true, opacity: 0.45 }));
  edges(rect(262, 378, 222, 250, 0.05, M("basic", "--pink", { transparent: true, opacity: 0.22 })), M("line", "--pink"));
  edges(rect(192, 252, 200, 272, 0.05, M("basic", "--pink", { transparent: true, opacity: 0.22 })), M("line", "--pink"));
  // tòa nhà: khối kính, viền sáng, vạch sàn từng tầng; mọc lên theo cuộn, gần cổng chính mọc trước
  const glass = M("lambert", "--surface-2", { transparent: true, opacity: 0.9 });
  const glassMeet = M("lambert", "--pink", { transparent: true, opacity: 0.9 }, 0.6);
  const edgeM = M("line", "--accent", { transparent: true, opacity: 0.75 }), edgeMeet = M("line", "--pink");
  const floorM = M("line", "--accent", { transparent: true, opacity: 0.25 }), floorMeet = M("line", "--pink", { transparent: true, opacity: 0.45 });
  const blocks = [], gateP = new T.Vector3(X(215), 0, Z(378));
  let dmax = 1;
  for (const [name, x0, x1, y0, y1, h] of BUILDINGS) {
    const meet = MEET.has(name), w = X(x1) - X(x0), d = Z(y1) - Z(y0);
    const g = new T.Group(); g.position.set((X(x0) + X(x1)) / 2, 0, (Z(y0) + Z(y1)) / 2); scene.add(g);
    edges(box(w, h, d, meet ? glassMeet : glass, 0, h / 2, 0, g), meet ? edgeMeet : edgeM, g);
    const floors = Math.max(1, Math.round(h / 0.32));
    for (let f = 1; f < floors; f++) {
      const y = (h * f) / floors;
      g.add(new T.LineLoop(new T.BufferGeometry().setFromPoints([new T.Vector3(-w / 2, y, -d / 2), new T.Vector3(w / 2, y, -d / 2), new T.Vector3(w / 2, y, d / 2), new T.Vector3(-w / 2, y, d / 2)]), meet ? floorMeet : floorM));
    }
    const dist = g.position.distanceTo(gateP); dmax = Math.max(dmax, dist);
    blocks.push({ g, d: dist, h, name });
  }
  // cổng chính (Nguyễn Văn Bảo) và cổng sau (Lê Quang Định)
  const gateM = M("lambert", "--amber");
  const gate = (x0, x1, my) => { const a = X(x0), b = X(x1), z = Z(my); box(0.14, 0.9, 0.14, gateM, a, 0.45, z); box(0.14, 0.9, 0.14, gateM, b, 0.45, z); box(b - a + 0.14, 0.12, 0.16, gateM, (a + b) / 2, 0.92, z); };
  gate(201, 229, 378); gate(330, 354, 0);
  // bãi xe chợ Gò Vấp (bên trái nhà H, ngoài khuôn viên), bãi ô tô, hai điểm xuống Grab
  const lots = {};
  const lot = (key, x0, x1, y0, y1, token) => {
    const s = rect(x0, x1, y0, y1, 0.05, M("basic", token, { transparent: true, opacity: 0.2 }));
    lots[key] = [s.material, edges(s, M("line", token, { transparent: true, opacity: 1 })).material];
  };
  lot("moto", -100, 20, 120, 230, "--ok"); lot("car", -130, -10, 300, 375, "--amber");
  const vM = M("lambert", "--muted");
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) box(0.1, 0.12, 0.32, vM, X(-88 + i * 16), 0.11, Z(138 + j * 20));
  for (let i = 0; i < 3; i++) { box(0.62, 0.2, 0.34, vM, X(-110 + i * 40), 0.15, Z(337)); box(0.34, 0.14, 0.3, vM, X(-110 + i * 40), 0.32, Z(337)); }
  lots.grab = [rect(150, 186, 400, 416, 0.26, M("lambert", "--accent"), 0.04).material];
  lots.grab2 = [rect(358, 394, -55, -39, 0.26, M("lambert", "--accent"), 0.04).material];
  // đèn hiệu ở hai điểm hẹn: trước nhà E và trước nhà H
  const beamM = M("basic", "--pink", { transparent: true, opacity: 0.28, depthWrite: false });
  const gemM = M("basic", "--pink");
  const beacons = [[322, 241], [222, 236]].map(([mx, my], bi) => {
    const beam = new T.Mesh(new T.CylinderGeometry(0.07, 0.2, 4.2, 16, 1, true), beamM); beam.position.set(X(mx), 2.1, Z(my)); scene.add(beam);
    const gem = new T.Mesh(new T.OctahedronGeometry(0.22), gemM); gem.position.set(X(mx), 0.55, Z(my)); scene.add(gem);
    const rings = [0, 1, 2].map(() => { const r = new T.Mesh(new T.RingGeometry(0.3, 0.37, 40), M("basic", "--pink", { transparent: true, side: T.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(X(mx), 0.08, Z(my)); scene.add(r); return r; });
    return { gem, rings, sign: bi ? -1 : 1 };
  });

  // nhãn chữ vẽ trên canvas, luôn quay về phía camera
  const labels = [];
  const drawLabel = (sp) => {
    const o = sp.userData, c = document.createElement("canvas"), g = c.getContext("2d"), fs = 40;
    const font = `${o.bold ? 700 : 500} ${fs}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
    g.font = font;
    const w = Math.ceil(g.measureText(o.text).width) + 34;
    c.width = w; c.height = 66; g.font = font;
    const shape = () => { g.beginPath(); if (g.roundRect) g.roundRect(2, 2, w - 4, 62, 10); else g.rect(2, 2, w - 4, 62); };
    if (o.bg) { g.fillStyle = css(o.bg); g.globalAlpha = 0.94; shape(); g.fill(); g.globalAlpha = 1; }
    if (o.border) { g.strokeStyle = css(o.border); g.lineWidth = 3; shape(); g.stroke(); }
    g.fillStyle = css(o.fg); g.textBaseline = "middle"; g.fillText(o.text, 17, 35);
    sp.material.map?.dispose();
    sp.material.map = new T.CanvasTexture(c); sp.material.needsUpdate = true; o.r = w / 66;
  };
  const label = (text, x, y, z, o) => {
    const sp = new T.Sprite(new T.SpriteMaterial({ transparent: true, depthTest: false }));
    sp.userData = { ...o, text, h: o.h || 0.4 }; sp.renderOrder = 10; sp.position.set(x, y, z);
    drawLabel(sp); scene.add(sp); labels.push(sp); return sp;
  };
  const meetTag = { fg: "--bg", bg: "--pink", bold: true, h: 0.5 }, small = { fg: "--muted", bg: "--surface", border: "--line", h: 0.3 };
  for (const b of blocks) {
    if (!b.name) continue;
    label(MEET.has(b.name) ? `NHÀ ${b.name}` : `nhà ${b.name}`, b.g.position.x, b.h + (MEET.has(b.name) ? 0.7 : 0.35), b.g.position.z, MEET.has(b.name) ? meetTag : small);
  }
  label(`điểm hẹn · ${EVENT.meetingPoint}`, X(272), 2.3, Z(245), { fg: "--bg", bg: "--pink", bold: true, h: 0.42 });
  label("trước nhà E", X(322), 1.05, Z(241), { fg: "--pink", bg: "--surface", border: "--pink", h: 0.3 });
  label("trước nhà H", X(222), 1.05, Z(236), { fg: "--pink", bg: "--surface", border: "--pink", h: 0.3 });
  label("sân xe đạp", X(360), 0.35, Z(312), { fg: "--accent", h: 0.34 });
  const gateTag = { fg: "--amber", bg: "--surface", border: "--amber", h: 0.36 };
  label("cổng chính", X(215), 1.45, Z(378), gateTag);
  label("cổng sau", X(342), 1.45, Z(0), gateTag);
  label("bãi xe chợ Gò Vấp", X(-40), 0.8, Z(175), { fg: "--ok", bg: "--surface", border: "--ok", h: 0.36 });
  label("bãi ô tô · sẽ cập nhật", X(-70), 0.8, Z(337), gateTag);
  label("GRAB", X(168), 0.75, Z(408), { fg: "--bg", bg: "--accent", bold: true, h: 0.34 });
  label("GRAB", X(376), 0.75, Z(-47), { fg: "--bg", bg: "--accent", bold: true, h: 0.34 });
  label("đường Nguyễn Văn Bảo · một chiều", X(520), 0.25, Z(440), { fg: "--muted", h: 0.34 });
  label("đường Lê Quang Định", X(520), 0.25, Z(-78), { fg: "--muted", h: 0.34 });

  // lộ trình: đường nét đứt, gói tin chạy, trạm ở từng bước
  const routeM = M("dash", "--pink", { dashSize: 0.22, gapSize: 0.14 }), pktM = M("basic", "--pink"), headM = M("basic", "--text"), hopM = M("basic", "--amber");
  const paint = () => {
    const surf = new T.Color(css("--surface"));
    for (const [m, token, mix] of paints) { m.color.set(css(token)); if (mix) m.color.lerp(surf, mix); }
    labels.forEach(drawLabel);
    kick();
  };
  paint();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", paint);
  document.fonts?.ready.then(() => { labels.forEach(drawLabel); kick(); });

  const NPTS = 400;
  let curve = null, routeLine = null, hopNodes = [], hopU = [], hopHit = [], tourTl = null;
  const pkts = Array.from({ length: 12 }, () => { const p = new T.Mesh(new T.BoxGeometry(0.11, 0.11, 0.11), pktM); scene.add(p); return p; });
  const head = new T.Mesh(new T.OctahedronGeometry(0.17), headM); scene.add(head);
  const trail = Array.from({ length: 8 }, () => { const t = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), pktM); scene.add(t); return t; });
  const ripples = Array.from({ length: 4 }, () => { const r = new T.Mesh(new T.RingGeometry(0.2, 0.26, 32), M("basic", "--amber", { transparent: true, side: T.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.visible = false; scene.add(r); return r; });
  let hits = [];
  const S = { intro: 0, draw: 0, u: 0, chase: 0, yaw: 0 };

  function checkHops() {
    hopU.forEach((u, i) => {
      if (hopHit[i] || S.u < u - 0.003) return;
      hopHit[i] = true;
      onHop(i, hopU.length);
      hits.push({ p: curve.getPointAt(Math.min(u, 0.999)), t: performance.now() });
    });
  }
  function tour() {
    if (!curve) return;
    tourTl?.kill();
    hopHit = hopU.map(() => false);
    onHop(-1, hopU.length);
    const dur = Math.max(4, Math.min(8, curve.getLength() * 0.45));
    S.u = 0; S.draw = 0;
    tourTl = gsap.timeline({ onUpdate: kick })
      .to(S, { draw: 1, duration: 0.9, ease: "power2.inOut" })
      .to(S, { chase: 1, duration: 1, ease: "power2.inOut" }, 0.3)
      .to(S, { u: 1, duration: dur, ease: "power1.inOut", onUpdate: checkHops }, 0.5)
      .to(S, { chase: 0, duration: 1.4, ease: "power2.inOut" }, "-=0.3");
  }
  /** Đổi lộ trình theo tab đang chọn rồi chạy lại từ đầu. */
  function setRoute(route) {
    const c = route.campus;
    if (!c) return;
    if (routeLine) { scene.remove(routeLine); routeLine.geometry.dispose(); }
    hopNodes.forEach((n) => scene.remove(n)); hopNodes = [];
    const v = c.pts.map(([x, y]) => new T.Vector3(X(x), 0.12, Z(y)));
    curve = new T.CatmullRomCurve3(v, false, "centripetal");
    // lộ trình đi cổng sau: xoay camera sang phía đường Lê Quang Định để không bị các toà nhà che
    gsap.to(S, { yaw: c.yaw || 0, duration: 1.4, ease: "power2.inOut", overwrite: "auto", onUpdate: kick });
    const sp = curve.getSpacedPoints(NPTS);
    routeLine = new T.Line(new T.BufferGeometry().setFromPoints(sp), routeM); routeLine.computeLineDistances(); scene.add(routeLine);
    hopU = c.stops.map((si) => {
      let best = 0, bd = Infinity;
      sp.forEach((p, i) => { const dd = p.distanceTo(v[si]); if (dd < bd) { bd = dd; best = i; } });
      return best / NPTS;
    });
    hopU.slice(0, -1).forEach((u) => { const n = new T.Mesh(new T.OctahedronGeometry(0.14), hopM); const p = curve.getPointAt(u); n.position.set(p.x, 0.32, p.z); scene.add(n); hopNodes.push(n); });
    for (const [k, mats] of Object.entries(lots)) {
      const on = k === c.lot;
      mats.forEach((m) => { if (m.transparent) m.opacity = on ? (m.type === "LineBasicMaterial" ? 1 : 0.32) : (m.type === "LineBasicMaterial" ? 0.3 : 0.07); });
    }
    tour();
  }

  // kéo ngang để xoay
  let drag = null;
  wrap.addEventListener("pointerdown", (e) => { drag = e.clientX; });
  addEventListener("pointermove", (e) => { if (drag === null) return; S.yaw += (e.clientX - drag) * 0.008; drag = e.clientX; kick(); });
  ["pointerup", "pointercancel"].forEach((t) => addEventListener(t, () => { drag = null; }));
  const resize = () => { const w = wrap.clientWidth || 1, h = wrap.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); kick(); };

  const center = new T.Vector3(X(275), 0, Z(150)), camPos = new T.Vector3(), look = new T.Vector3(), chasePos = new T.Vector3(), chaseLook = new T.Vector3();
  const over = new T.Vector3(), want = new T.Vector3(), wantLook = new T.Vector3();
  let first = true;
  const t0 = performance.now();
  function frame() {
    raf = 0;
    const t = (performance.now() - t0) / 1000, e = ez(S.intro), asp = cam.aspect;
    // camera tổng quan: hạ từ trên cao xuống góc nghiêng theo cuộn
    const dist = asp > 1.6 ? 19 : asp > 1.15 ? 22 : 29;
    const yaw = -0.5 + S.yaw + Math.sin(t * 0.15) * 0.06, pitch = lerp(1.45, 0.78, e), r = dist * lerp(1.12, 1, e);
    over.set(center.x + Math.sin(yaw) * Math.cos(pitch) * r, Math.sin(pitch) * r, center.z + Math.cos(yaw) * Math.cos(pitch) * r);
    // camera bám theo gói tin
    const u = Math.min(0.999, S.u), p = curve ? curve.getPointAt(u) : center, tg = curve ? curve.getTangentAt(u) : new T.Vector3(0, 0, -1);
    const back = asp > 1.15 ? 3.6 : 5, up = asp > 1.15 ? 3 : 4.2;
    want.set(p.x - tg.x * back + tg.z * 1.2, up, p.z - tg.z * back - tg.x * 1.2);
    wantLook.set(p.x + tg.x * 2, 0, p.z + tg.z * 2);
    if (first) { chasePos.copy(want); chaseLook.copy(wantLook); first = false; }
    chasePos.lerp(want, 0.08); chaseLook.lerp(wantLook, 0.1);
    const c = ez(S.chase);
    camPos.copy(over).lerp(chasePos, c); look.copy(center).lerp(chaseLook, c);
    cam.position.copy(camPos); cam.lookAt(look);
    blocks.forEach((b) => { const d0 = (b.d / dmax) * 0.5, q = ez(seg(S.intro, d0, d0 + 0.45)); b.g.scale.y = Math.max(0.001, q + Math.sin(q * Math.PI) * 0.08); });
    if (routeLine) routeLine.geometry.setDrawRange(0, Math.floor((NPTS + 1) * S.draw));
    const drawn = S.draw >= 1, moving = S.u > 0 && S.u < 1;
    pkts.forEach((pk, i) => {
      const v = (t * 0.09 + i / pkts.length) % 1;
      pk.visible = !!curve && drawn && !(moving && v > S.u);
      if (pk.visible) { const q = curve.getPointAt(v); pk.position.set(q.x, 0.14, q.z); pk.rotation.set(t * 2 + i, t * 3, 0); }
    });
    head.visible = !!curve && S.draw > 0.05; head.position.set(p.x, 0.32 + Math.sin(t * 6) * 0.05, p.z); head.rotation.y = t * 3;
    trail.forEach((d, i) => { const v = u - (i + 1) * 0.012; d.visible = head.visible && moving && v > 0; if (d.visible) { const q = curve.getPointAt(v); d.position.set(q.x, 0.3, q.z); d.scale.setScalar(1 - i * 0.1); } });
    hopNodes.forEach((n, i) => { n.rotation.y = t * 2; n.position.y = 0.32 + Math.sin(t * 3 + i) * 0.04; });
    const now = performance.now();
    hits = hits.filter((h) => now - h.t < 1200);
    ripples.forEach((m, i) => { const h = hits[i]; m.visible = !!h; if (h) { const k = (now - h.t) / 1200; m.position.set(h.p.x, 0.1, h.p.z); m.scale.setScalar(1 + k * 6); m.material.opacity = 1 - k; } });
    beamM.opacity = 0.22 + Math.sin(t * 2.2) * 0.06;
    beacons.forEach((b, bi) => {
      b.gem.rotation.y = t * 1.5 * b.sign; b.gem.position.y = 0.55 + Math.sin(t * 2.2 + bi) * 0.07;
      b.rings.forEach((rg, i) => { const k = (t * 0.55 + i / 3) % 1; rg.scale.setScalar(1 + k * 3); rg.material.opacity = 0.7 * (1 - k); });
    });
    labels.forEach((sp) => { const o = sp.userData, f = Math.max(0.55, Math.min(1.8, cam.position.distanceTo(sp.position) / 14)); sp.scale.set(o.h * o.r * f, o.h * f, 1); sp.material.opacity = ez(seg(S.intro, 0.5, 0.95)); });
    renderer.render(scene, cam);
    if (visible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  resize();
  new ResizeObserver(resize).observe(wrap);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(wrap);
  return { S, kick, setRoute, tour };
}
