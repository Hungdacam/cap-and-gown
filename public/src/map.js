import { EVENT, ROUTES, DEFAULT_ROUTE, MAP } from "./config.js";
import { $, esc } from "./util.js";

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

export function initMap() {
  drawGrid();

  const tabs = $("tabs");
  tabs.innerHTML = ROUTES.map((r) => `<button class="tab" type="button" role="tab" aria-selected="false" tabindex="-1" data-mode="${esc(r.id)}">${esc(r.tab)}</button>`).join("");
  const buttons = [...tabs.querySelectorAll(".tab")];

  const show = (id, focusTab = false) => {
    const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
    buttons.forEach((b) => {
      const on = b.dataset.mode === r.id;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
      if (on && focusTab) b.focus();
    });
    $("route").setAttribute("d", r.path);
    ROUTES.forEach((x) => $(x.focus).classList.toggle("dim", x.focus !== r.focus));
    $("trace").innerHTML =
      `<div class="hd">› Chỉ đường tới điểm hẹn</div>` +
      r.hops.map((h, i) => `<div class="hop"><span class="i">${i + 1}</span><span>${esc(h[0])}</span><span class="ms">${esc(h[1])}</span></div>`).join("");
  };

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

  $("mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(MAP.schoolQuery);

  const addr = `${EVENT.school}, ${EVENT.address}`;
  $("copyAddr").addEventListener("click", async () => {
    const btn = $("copyAddr");
    try {
      await navigator.clipboard.writeText(addr);
      btn.textContent = "Đã sao chép địa chỉ";
    } catch {
      btn.textContent = EVENT.address;
    }
    setTimeout(() => (btn.textContent = "Sao chép địa chỉ cho Grab"), 2500);
  });
}

export function initPhoneCopy() {
  const btn = $("copyPhone");
  btn.addEventListener("click", async () => {
    const txt = $("phone").textContent.replace(/\s/g, "");
    try {
      await navigator.clipboard.writeText(txt);
      btn.textContent = "Đã sao chép";
    } catch {
      const r = document.createRange();
      r.selectNodeContents($("phone"));
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      btn.textContent = "Đã chọn số";
    }
    setTimeout(() => (btn.textContent = "Sao chép số"), 2000);
  });
}
