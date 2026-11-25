import { EVENT, COPY } from "./config.js";
import { $, canAnimate, esc } from "./util.js";

// Màn mở thiệp: hàng nghìn hạt sáng xoáy như thiên hà rồi kết thành tên khách, mũ tốt nghiệp 3D rơi xuống phía trên.
// Khách chạm thì mũ tung lên, hạt bung về phía người xem, nền tan dần để lộ thiệp. Không có WebGL thì chỉ hiện chữ.
const AUTO_OPEN = 10; // giây sau khi tên hiện xong, khách không chạm thì tự mở để không ai bị kẹt
const FAILSAFE = 26; // giây, dài hơn intro + chờ API + AUTO_OPEN + lúc mở
const NO_GATE_WAIT = 6500; // ms, khách tắt nhạc (không cần chạm) vẫn đợi tên hiện rồi mới mở
const HOLD_MS = 1600; // ms, tên đứng yên bao lâu trước khi tự mở khi không cần chạm

const revealPage = () => document.documentElement.classList.remove("splash-on");
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ez = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Vẽ tên khách rõ nét lên <canvas> trong #spName, màu chuyển như các hạt sáng. Trả về bề rộng (px CSS).
 * Không dùng chữ HTML với background-clip:text: Safari trên iPhone không vẽ lại vùng tô khi chữ đổi cỡ trên lớp GPU,
 * khách chỉ thấy nửa tên (ví dụ "Chị" của "Chị Thự"). Canvas là ảnh bitmap nên trình duyệt nào cũng hiện đủ.
 */
function paintName(el, name, fontPx) {
  let c = el.querySelector("canvas");
  if (!c) { c = document.createElement("canvas"); el.replaceChildren(c); }
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", name); // tên khách chỉ đi vào thuộc tính và canvas, không bao giờ thành HTML
  const dpr = Math.min(devicePixelRatio || 1, 3);
  const font = `700 ${fontPx}px "Chakra Petch", "Be Vietnam Pro", system-ui, sans-serif`;
  const g = c.getContext("2d");
  g.font = font;
  const m = g.measureText(name);
  const asc = m.actualBoundingBoxAscent || fontPx * 0.95, desc = m.actualBoundingBoxDescent || fontPx * 0.3;
  const padX = fontPx * 0.12, padY = fontPx * 0.12; // chừa chỗ cho dấu trên chữ hoa (Á, Ấ) và dấu dưới (ị, ọ)
  const w = Math.ceil(m.width + padX * 2), h = Math.ceil(asc + desc + padY * 2);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  c.style.width = `${w}px`; c.style.height = `${h}px`;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.font = font;
  g.textBaseline = "alphabetic";
  const grad = g.createLinearGradient(padX, 0, w - padX, 0);
  grad.addColorStop(0, css("--accent")); grad.addColorStop(0.5, css("--merge")); grad.addColorStop(1, css("--pink"));
  g.fillStyle = grad;
  g.fillText(name, padX, padY + asc);
  return w;
}

/** Cỡ chữ để tên rộng tối đa `maxW` px: vẽ thử một lần rồi thu theo tỉ lệ nếu quá rộng. */
function fitName(el, name, fontPx, maxW) {
  const w = paintName(el, name, fontPx);
  if (w <= maxW) return fontPx;
  const fitted = (fontPx * maxW) / w;
  paintName(el, name, fitted);
  return fitted;
}

/** Cảnh three.js. Trả về null nếu thiếu THREE hoặc máy không tạo được WebGL. */
function createScene() {
  const T = window.THREE;
  if (!T) return null;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: $("spGL"), antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 1.75)); // điện thoại: đỡ nặng GPU
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(45, 1, 0.1, 200);
  cam.position.set(0, 0, 14);
  scene.add(new T.AmbientLight(0xffffff, 0.85));
  const dl = new T.DirectionalLight(0xffffff, 1.2); dl.position.set(3, 6, 8); scene.add(dl);

  const small = innerWidth < 700, N = small ? 2600 : 5000;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), start = new Float32Array(N * 3);
  const target = new Float32Array(N * 3), dir = new Float32Array(N * 3), delay = new Float32Array(N), phase = new Float32Array(N);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("color", new T.BufferAttribute(col, 3));
  const dot = document.createElement("canvas");
  dot.width = dot.height = 64;
  { const g = dot.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const dotTex = new T.CanvasTexture(dot);
  const mat = new T.PointsMaterial({ size: small ? 0.12 : 0.09, map: dotTex, vertexColors: true, transparent: true, depthWrite: false });
  scene.add(new T.Points(geo, mat));
  // thiên hà ba nhánh xoắn, tâm lùi sâu sau màn hình
  for (let i = 0; i < N; i++) {
    const r = 4 + Math.pow(Math.random(), 0.7) * 18, a = (i % 3) * 2.094 + r * 0.32 + (Math.random() - 0.5) * 0.6;
    start[i * 3] = Math.cos(a) * r; start[i * 3 + 1] = (Math.random() - 0.5) * 1.4 + Math.sin(a) * r * 0.16; start[i * 3 + 2] = Math.sin(a) * r * 0.7;
    phase[i] = Math.random() * 6.28;
    dir[i * 3] = (Math.random() - 0.5) * 2; dir[i * 3 + 1] = (Math.random() - 0.5) * 2; dir[i * 3 + 2] = 0.6 + Math.random() * 1.6;
  }
  // bụi sao nền
  const SN = small ? 350 : 800, sp3 = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { sp3[i * 3] = (Math.random() - 0.5) * 90; sp3[i * 3 + 1] = (Math.random() - 0.5) * 55; sp3[i * 3 + 2] = -20 - Math.random() * 40; }
  const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(sp3, 3));
  const starMat = new T.PointsMaterial({ size: 0.18, map: dotTex, transparent: true, opacity: 0.55, depthWrite: false });
  const stars = new T.Points(sg, starMat); scene.add(stars);
  // mũ tốt nghiệp 3D
  const capG = new T.Group();
  const boardM = new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.25 });
  const skullM = new T.MeshStandardMaterial({ color: 0x1b2340, roughness: 0.55, metalness: 0.1 });
  const goldM = new T.MeshStandardMaterial({ color: 0xffb547, roughness: 0.35, metalness: 0.45, emissive: 0x4a3000 });
  let m;
  capG.add(new T.Mesh(new T.BoxGeometry(2.4, 0.09, 2.4), boardM));
  m = new T.Mesh(new T.CylinderGeometry(0.78, 0.9, 0.62, 32), skullM); m.position.y = -0.35; capG.add(m);
  m = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.08, 16), goldM); m.position.y = 0.08; capG.add(m);
  m = new T.Mesh(new T.BoxGeometry(1.15, 0.03, 0.045), goldM); m.position.set(0.58, 0.07, 0); capG.add(m);
  const hang = new T.Group(); hang.position.set(1.15, 0.07, 0); capG.add(hang);
  m = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.75, 8), goldM); m.position.y = -0.38; hang.add(m);
  m = new T.Mesh(new T.ConeGeometry(0.1, 0.38, 12), goldM); m.position.y = -0.85; hang.add(m);
  scene.add(capG);
  // vòng quỹ đạo với ba "commit" chạy quanh mũ
  const TILT = Math.PI / 2.2;
  const halo = new T.Mesh(new T.TorusGeometry(2.1, 0.015, 8, 120), new T.MeshBasicMaterial({ transparent: true, opacity: 0.55 }));
  halo.rotation.x = TILT; scene.add(halo);
  const orbs = [0, 1, 2].map(() => { const o = new T.Mesh(new T.SphereGeometry(0.08, 12, 10), new T.MeshBasicMaterial()); scene.add(o); return o; });

  let textW = 1, textH = 1, capY = 2, capS = 1, hasText = false;
  function paint() {
    const bg = new T.Color(css("--bg")), dark = (bg.r + bg.g + bg.b) / 3 < 0.5;
    mat.blending = dark ? T.AdditiveBlending : T.NormalBlending; mat.needsUpdate = true;
    starMat.color.set(css("--muted"));
    boardM.color.set(css("--accent")); halo.material.color.set(css("--accent"));
    orbs.forEach((o, k) => o.material.color.set(css(["--pink", "--amber", "--ok"][k])));
    const A = new T.Color(css("--accent")), B = new T.Color(css("--merge")), C = new T.Color(css("--pink")), tmp = new T.Color();
    for (let j = 0; j < N; j++) {
      const u = clamp01(target[j * 3] / textW + 0.5);
      if (u < 0.5) tmp.copy(A).lerp(B, u * 2); else tmp.copy(B).lerp(C, (u - 0.5) * 2);
      col[j * 3] = tmp.r; col[j * 3 + 1] = tmp.g; col[j * 3 + 2] = tmp.b;
    }
    geo.attributes.color.needsUpdate = true;
  }
  function sample(txt) {
    const c = document.createElement("canvas"), g = c.getContext("2d"), fs = 180;
    const font = `700 ${fs}px "Chakra Petch", "Be Vietnam Pro", system-ui, sans-serif`;
    g.font = font;
    const w = Math.ceil(g.measureText(txt).width) + 40, h = Math.round(fs * 1.5);
    c.width = w; c.height = h; g.font = font; g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(txt, w / 2, h / 2 + fs * 0.05);
    const d = g.getImageData(0, 0, w, h).data, list = [];
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 140) list.push(x, y);
    return { list, w, h, fs };
  }
  const place = (el, y, above) => { el.style.top = `${y - (above ? el.offsetHeight : 0)}px`; };
  let lastName = "";
  /** Đặt đích của hạt theo tên khách và căn chữ HTML (tên rõ nét, lời chào, thông tin) đúng vị trí trong cảnh 3D. */
  function layout(name = lastName) {
    lastName = name;
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    const visH = 2 * 14 * Math.tan(T.MathUtils.degToRad(22.5)), visW = visH * cam.aspect;
    const s = sample(name || " "), n = s.list.length / 2, tw = Math.min(visW * 0.84, 12.5), k = tw / s.w;
    hasText = n > 0;
    textW = tw; textH = s.h * k * 0.6;
    for (let j = 0; j < N; j++) {
      if (hasText) {
        const q = ((Math.random() * n) | 0) * 2;
        target[j * 3] = (s.list[q] - s.w / 2) * k + (Math.random() - 0.5) * k * 1.2;
        target[j * 3 + 1] = -(s.list[q + 1] - s.h / 2) * k + (Math.random() - 0.5) * k * 1.2;
      } else { target[j * 3] = (Math.random() - 0.5) * tw; target[j * 3 + 1] = (Math.random() - 0.5) * 1.2; }
      target[j * 3 + 2] = (Math.random() - 0.5) * 0.4;
      delay[j] = clamp01(target[j * 3] / tw + 0.5) * 0.25 + Math.random() * 0.1; // tên kết lại từ trái sang phải
    }
    capS = Math.min(1, visW / 8); capY = textH / 2 + 1.55 + capS * 0.9;
    capG.scale.setScalar(capS); halo.scale.setScalar(capS);
    paint();
    cam.position.set(0, 0, 14); cam.lookAt(0, 0.4, 0); cam.updateMatrixWorld();
    const proj = (y) => { const v = new T.Vector3(0, y, 0).project(cam); return (1 - (v.y + 1) / 2) * h; };
    place($("spGreet"), proj(textH / 2 + 0.35), true);
    const infoTop = proj(-textH / 2 - 0.35);
    place($("spInfo"), infoTop);
    place($("spHint"), infoTop + $("spInfo").offsetHeight + 22);
    // Tên rõ nét đè đúng chỗ các hạt kết thành; tên dài hay font chưa tải kịp thì thu cho vừa 92% bề ngang.
    if (name) {
      const nameEl = $("spName");
      nameFont = fitName(nameEl, name, (s.fs * (tw / visW) * w) / s.w, w * 0.92);
      nameEl.style.top = `${proj(0) - nameEl.offsetHeight / 2}px`;
    }
  }
  let nameFont = 0;
  // Đổi giao diện sáng/tối: chỉ vẽ lại màu của tên, không xếp lại các hạt.
  const repaintName = () => { if (lastName && nameFont) paintName($("spName"), lastName, nameFont); };

  const S = { vis: 0, m: 0, burst: 0, toss: 0, capIn: 0, dim: 0 };
  let px = 0, py = 0, mx = 0, my = 0;
  const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove, { passive: true });
  const t0 = performance.now();
  function frame() {
    const t = (performance.now() - t0) / 1000, rot = t * 0.1, ca = Math.cos(rot), sa = Math.sin(rot), b = S.burst, bb = b * b * 16;
    for (let j = 0; j < N; j++) {
      const j3 = j * 3, k = ez(seg(S.m, delay[j], delay[j] + 0.62));
      const sx = start[j3], sz = start[j3 + 2], gx = sx * ca - sz * sa, gz = sx * sa + sz * ca - 8, gy = start[j3 + 1];
      const ph = phase[j], tx = target[j3] + Math.sin(t * 1.2 + ph) * 0.025, ty = target[j3 + 1] + Math.cos(t * 1.4 + ph) * 0.025, tz = target[j3 + 2] + Math.sin(t + ph) * 0.05;
      pos[j3] = gx + (tx - gx) * k + dir[j3] * bb;
      pos[j3 + 1] = gy + (ty - gy) * k + dir[j3 + 1] * bb;
      pos[j3 + 2] = gz + (tz - gz) * k + dir[j3 + 2] * bb;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = S.vis * (1 - ez(seg(b, 0.35, 1))) * (1 - S.dim * 0.6);
    starMat.opacity = 0.55 * S.vis * (1 - ez(seg(b, 0.2, 0.8)));
    stars.rotation.z = t * 0.01;
    const ci = S.capIn, ts = S.toss;
    capG.visible = halo.visible = ci > 0.001;
    capG.position.set(0, capY + (1 - ci) * 7 + Math.sin(t * 1.5) * 0.07 + ts * ts * 16, 0);
    capG.rotation.set(0.38 + ts * 7, t * 0.55 + ts * 4, ts * 2.5);
    hang.rotation.z = Math.sin(t * 2.2) * 0.18; hang.rotation.x = Math.cos(t * 1.7) * 0.12;
    halo.position.set(0, capG.position.y - 0.25 * capS, 0); halo.rotation.z = t * 0.3;
    halo.material.opacity = 0.55 * clamp01(ci) * (1 - ts);
    const R = 2.1 * capS;
    orbs.forEach((o, k) => {
      const a = t * 0.9 + k * 2.094;
      o.position.set(Math.cos(a) * R, halo.position.y + Math.sin(a) * R * Math.cos(TILT), Math.sin(a) * R * Math.sin(TILT));
      o.visible = ci > 0.5 && ts < 0.3;
    });
    px += (mx - px) * 0.05; py += (my - py) * 0.05;
    cam.position.set(px * 1.6, -py * 1.1, 14 - ez(b) * 8); cam.lookAt(0, 0.4, 0);
    renderer.render(scene, cam);
  }
  const onResize = () => layout();
  const onTheme = () => { paint(); repaintName(); };
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  addEventListener("resize", onResize);
  scheme.addEventListener?.("change", onTheme);
  gsap.ticker.add(frame);
  layout("");

  return {
    S,
    layout,
    hasText: () => hasText,
    dispose() {
      gsap.ticker.remove(frame);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onMove);
      scheme.removeEventListener?.("change", onTheme);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      dotTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss(); // trả lại context WebGL cho bản đồ 3D và nền
    },
  };
}

/**
 * ready: cảnh đã hiện, lúc này làm việc nặng không ai thấy.
 * tapped: khách đã chạm, hoặc đã hết giờ chờ. Không có gate thì resolve ngay.
 * setGuest(): kết tên khách từ hạt sáng, dữ liệu khách về lúc nào thì kết lúc đó.
 * open(): tung mũ, bung hạt, nền tan dần. opening resolve đúng lúc thiệp bắt đầu lộ ra.
 */
export function startSplash({ gate = false } = {}) {
  const el = $("splash");
  if (!canAnimate()) {
    el.remove();
    revealPage();
    return { ready: Promise.resolve(), tapped: Promise.resolve(), opening: Promise.resolve(), setGuest() {}, open: async () => {} };
  }

  const ui = ["#spGreet", "#spName", "#spInfo", "#spHint", "#spChrome"];
  $("spTl").textContent = "~/2026 ▸ ./thank-you";
  $("spBr").textContent = `lễ tốt nghiệp · ${EVENT.cohort}`;
  $("spInfo").innerHTML = `đã chung vui ngày tốt nghiệp của <b class="ttl">${esc(EVENT.displayName)}</b><br><b class="d">${esc(EVENT.date.split("-").reverse().join("."))}</b> · IUH · ${esc(EVENT.degree)}`;
  gsap.set(ui, { autoAlpha: 0 });

  let scene = null;
  try { scene = createScene(); } catch (err) { console.error(err); }
  el.classList.toggle("no-gl", !scene);
  // JS đã chạy thì thay lưới an toàn của CSS bằng đồng hồ GSAP (tab nền làm GSAP dừng nhưng CSS vẫn đếm).
  el.style.animation = "none";

  const intro = gsap.timeline().to("#spChrome", { autoAlpha: 1, duration: 0.6 }, 0);
  if (scene) intro.to(scene.S, { vis: 1, duration: 1, ease: "power2.out" }, 0);
  const ready = intro.then(() => {});

  let markTapped;
  const tapped = new Promise((resolve) => (markTapped = resolve));
  let isTapped = false, userTapped = false, autoOpen = null, formTl = null, markFormed;
  const formed = new Promise((resolve) => (markFormed = resolve));

  const tap = (byUser) => {
    if (isTapped) return;
    isTapped = true;
    userTapped = byUser;
    autoOpen?.kill();
    markTapped();
  };
  if (gate) {
    el.removeAttribute("aria-hidden");
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    const hint = matchMedia("(pointer: coarse)").matches ? COPY.tapHint : COPY.clickHint;
    el.setAttribute("aria-label", hint);
    $("spHintText").textContent = hint;
    el.addEventListener("click", () => tap(true));
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      tap(true);
    });
  } else {
    tap(false);
  }

  const fonts = document.fonts?.load
    ? Promise.race([document.fonts.load('700 180px "Chakra Petch"'), wait(1500)]).catch(() => {})
    : Promise.resolve();

  /** Tên khách kết lại từ hạt, rồi chữ thật hiện rõ, hạt lùi thành quầng sáng. */
  async function form(greeting, name) {
    $("spGreet").textContent = greeting; // textContent: lời chào và tên khách là dữ liệu không tin cậy
    await Promise.all([fonts, ready]);
    if (!el.isConnected) return;
    // Tên được vẽ lên canvas sau khi font đã tải, với cỡ chữ cuối cùng (xem paintName).
    if (scene) scene.layout(name);
    else fitName($("spName"), name, parseFloat(getComputedStyle($("spName")).fontSize) || 48, innerWidth * 0.92);
    formTl = gsap.timeline({ onComplete: markFormed });
    if (scene) {
      formTl.to(scene.S, { m: 1, duration: 2.6, ease: "power2.inOut" }, 0)
        .to(scene.S, { capIn: 1, duration: 1.2, ease: "bounce.out" }, 1.5)
        .to(scene.S, { dim: 1, duration: 0.9, ease: "power2.out" }, 2.2)
        .fromTo("#spName", { autoAlpha: 0, scale: 1.06, y: 6 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.9, ease: "power2.out", clearProps: "transform" }, 2.2);
    } else {
      formTl.fromTo("#spName", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, clearProps: "transform" }, 0);
    }
    formTl.fromTo("#spGreet", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, scene ? 1.8 : 0.3)
      .fromTo("#spInfo", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, scene ? 2.3 : 0.5);
    if (gate) formTl.fromTo("#spHint", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, scene ? 2.7 : 0.7);
    formTl.call(() => {
      if (isTapped) return;
      el.focus({ preventScroll: true });
      autoOpen = gsap.delayedCall(AUTO_OPEN, () => tap(false));
    });
  }

  let markOpening;
  const opening = new Promise((resolve) => (markOpening = resolve));
  const failsafe = gsap.delayedCall(FAILSAFE, () => {
    el.remove();
    scene?.dispose();
    revealPage();
    markOpening();
  });

  return {
    ready,
    tapped,
    opening,
    setGuest(greeting, name) {
      form(greeting, name).catch((err) => console.error(err));
    },
    async open() {
      if (!el.isConnected) return; // lưới an toàn đã mở thiệp trước
      failsafe.kill();
      autoOpen?.kill();
      // Khách chạm sớm thì cho tên hiện ngay. Không cần chạm (đã tắt nhạc) thì đợi tên kết xong rồi mới mở.
      if (userTapped) formTl?.progress(1);
      else if (!gate) await Promise.race([formed.then(() => wait(HOLD_MS)), wait(NO_GATE_WAIT)]); // cho khách kịp đọc tên
      else await Promise.race([formed, wait(NO_GATE_WAIT)]);
      const tl = gsap.timeline();
      tl.to(ui, { autoAlpha: 0, y: -12, duration: 0.35, stagger: 0.04 }, 0);
      if (scene) {
        tl.to(scene.S, { toss: 1, duration: 1.1, ease: "power2.in" }, 0)
          .to(scene.S, { burst: 1, duration: 1.6, ease: "power2.in" }, 0.1);
      }
      tl.to(el, { "--bgA": 0, duration: 0.9, ease: "power2.inOut" }, 0.55)
        .call(() => { el.style.pointerEvents = "none"; revealPage(); markOpening(); }, null, 0.65);
      await tl;
      el.remove();
      scene?.dispose();
    },
  };
}
