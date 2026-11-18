import { $, canAnimate } from "./util.js";

// Nền: đồ thị commit 3D (các nhánh và nút merge), camera đi xuyên "lịch sử" theo vị trí cuộn trang.
// Nằm dưới mọi nội dung, chỉ vẽ lại khi trang cuộn hoặc chuột di chuyển, không vẽ khi splash đang che.
export function initBgGraph() {
  const T = window.THREE;
  if (!canAnimate() || !T) return;
  // Điện thoại: các khung đã che gần hết bề ngang nên nền gần như không thấy, bỏ hẳn để dành GPU cho cuộn mượt.
  if (matchMedia("(hover: none), (max-width: 760px)").matches) return;
  const cv = $("bggraph");
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(55, 1, 0.1, 200);
  scene.fog = new T.Fog(0x000000, 4, 24); // nút ở xa chìm vào nền, không dồn thành đám sau nội dung
  const group = new T.Group(); scene.add(group);
  const small = innerWidth < 700, L = small ? 4 : 6, LEN = 170, mats = [];
  const TOK = ["--accent", "--pink", "--amber", "--ok", "--merge", "--accent"];
  const rnd = (i, k) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
  const lanes = [];
  for (let i = 0; i < L; i++) {
    const x0 = (i - (L - 1) / 2) * (small ? 2.6 : 3.4), y0 = Math.sin(i * 1.9) * 2.2;
    lanes.push([x0, y0]);
    const pts = [], nodes = [];
    for (let z = 12; z > -LEN; z -= 1.5) pts.push(x0 + Math.sin(z * 0.07 + i) * 0.5, y0 + Math.cos(z * 0.05 + i) * 0.4, z);
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
    const lm = new T.LineBasicMaterial({ transparent: true, opacity: 0.55 }); mats.push([lm, TOK[i]]);
    group.add(new T.Line(g, lm));
    for (let k = 0; k < pts.length; k += 3 * (3 + Math.floor(rnd(i, k) * 3))) nodes.push(pts[k], pts[k + 1], pts[k + 2]);
    const ng = new T.BufferGeometry(); ng.setAttribute("position", new T.Float32BufferAttribute(nodes, 3));
    const pm = new T.PointsMaterial({ size: 0.15, transparent: true, opacity: 0.75 }); mats.push([pm, TOK[i]]);
    group.add(new T.Points(ng, pm));
  }
  // nhánh hợp nhất giữa hai làn kề nhau
  for (let m = 0; m < (small ? 10 : 18); m++) {
    const a = Math.floor(rnd(m, 1) * (L - 1)), za = 8 - rnd(m, 2) * (LEN - 20), dz = 6 + rnd(m, 3) * 6;
    const p0 = new T.Vector3(lanes[a][0], lanes[a][1], za), p2 = new T.Vector3(lanes[a + 1][0], lanes[a + 1][1], za - dz);
    const p1 = new T.Vector3((p0.x + p2.x) / 2, p0.y + 1.2, za - dz / 2);
    const cm = new T.LineBasicMaterial({ transparent: true, opacity: 0.4 }); mats.push([cm, "--merge"]);
    group.add(new T.Line(new T.BufferGeometry().setFromPoints(new T.QuadraticBezierCurve3(p0, p1, p2).getPoints(16)), cm));
  }
  let dirty = true;
  const paint = () => { for (const [m, t] of mats) m.color.set(css(t)); scene.fog.color.set(css("--bg")); dirty = true; };
  paint();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", paint);
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); dirty = true; };
  resize();
  addEventListener("resize", resize);
  let camZ = 12, px = 0, py = 0, mx = 0, my = 0;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  gsap.ticker.add(() => {
    if (document.documentElement.classList.contains("splash-on")) return; // splash đang che: không vẽ nền
    const smoother = window.ScrollSmoother?.get();
    const y = smoother ? smoother.scrollTop() : scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const goal = 12 - (y / max) * (LEN - 30);
    const moved = Math.abs(goal - camZ) > 0.01 || Math.abs(mx - px) > 0.001 || Math.abs(my - py) > 0.001;
    if (!moved && !dirty) return;
    camZ += (goal - camZ) * 0.08; px += (mx - px) * 0.05; py += (my - py) * 0.05;
    cam.position.set(px * 3, -py * 2, camZ); cam.lookAt(px * 1.5, -py, camZ - 20);
    group.rotation.z = camZ * 0.004;
    renderer.render(scene, cam);
    dirty = false;
  });
}
