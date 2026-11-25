import { EVENT, ROUTES, DEFAULT_ROUTE } from "./config.js";
import { $, esc } from "./util.js";
import { initMap3d } from "./map3d.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function drawGrid() {
  const g = $("grid");
  const line = (x1, y1, x2, y2) => {
    const l = document.createElementNS(SVG_NS, "line");
    l.setAttribute("class", "m-grid");
    l.setAttribute("opacity", ".35");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    g.appendChild(l);
  };
  for (let x = 40; x < 640; x += 40) line(x, 0, x, 360);
  for (let y = 40; y < 360; y += 40) line(0, y, 640, y);
}

/**
 * Tabs phương tiện + các bước đi + sơ đồ. Có 3D thì sơ đồ 2D ẩn đi (vẫn giữ làm dự phòng).
 * Trả về { startTour, map3d }: scroll-effects gọi startTour() khi bản đồ vào giữa màn hình.
 */
export function initMap() {
  drawGrid();

  const tabs = $("tabs");
  tabs.innerHTML = ROUTES.map((r) => `<button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-mode="${esc(r.id)}">${esc(r.tab)}</button>`).join("");
  const buttons = [...tabs.querySelectorAll(".tab")];
  let current = ROUTES[0], started = false;
  const status = $("m3status");

  const onHop = (i, total) => {
    const rows = [...document.querySelectorAll("#trace .hop")];
    if (i < 0) {
      rows.forEach((row, k) => { row.classList.remove("hit"); row.querySelector(".ms").textContent = current.hops[k][1]; });
      $("arrive").hidden = true;
      status.textContent = "đang dò đường…";
      return;
    }
    const row = rows[i];
    if (!row) return;
    row.classList.add("hit");
    row.querySelector(".ms").textContent = `✓ ${current.hops[i][1]}`;
    status.textContent = `trạm ${i + 1}/${total} · ${current.hops[i][1]}`;
    if (i === total - 1) { $("arrive").hidden = false; status.textContent = "đã tới điểm hẹn · kéo để xoay"; }
  };
  // 3D chỉ để trang trí: lỗi gì cũng quay về sơ đồ 2D, không được làm hỏng cả thiệp.
  let map3d = null;
  try { map3d = initMap3d({ onHop }); } catch (err) { console.error(err); }
  $("mapPanel").classList.toggle("has-3d", !!map3d);

  const show = (id, focusTab = false) => {
    const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
    current = r;
    buttons.forEach((b) => {
      const on = b.dataset.mode === r.id;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
      if (on && focusTab) b.focus();
    });
    $("route").setAttribute("d", r.path);
    ROUTES.forEach((x) => $(x.focus).classList.toggle("dim", x.focus !== r.focus));
    // Không có 3D thì mọi bước hiện sẵn; có 3D thì sáng dần theo gói tin.
    $("trace").innerHTML =
      `<div class="hd">$ traceroute diem-hen --via ${esc(r.id)}</div>` +
      r.hops.map((h, i) => `<div class="hop${map3d ? "" : " hit"}"><span class="i">${i + 1}</span><span>${esc(h[0])}</span><span class="ms">${esc(h[1])}</span></div>`).join("") +
      `<div class="arrive" id="arrive" hidden>✓ đã tới khu điểm hẹn · ${esc(EVENT.meetingPoint)}</div>`;
    if (map3d && started) map3d.setRoute(r);
  };
  const startTour = () => {
    if (!map3d) return;
    if (!started) { started = true; map3d.setRoute(current); } else map3d.tour();
  };
  $("m3play").addEventListener("click", startTour);

  buttons.forEach((b, i) => {
    b.addEventListener("click", () => show(b.dataset.mode));
    b.addEventListener("keydown", (e) => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      show(buttons[(i + step + buttons.length) % buttons.length].dataset.mode, true);
    });
  });
  show(DEFAULT_ROUTE);
  return { startTour, map3d };
}
