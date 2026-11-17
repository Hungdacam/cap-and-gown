import { EVENT } from "./config.js";
import { $, eventAt, canAnimate } from "./util.js";
import { RULER_FROM, RULER_TO } from "./render.js";

const IDS = ["cd-d", "cd-h", "cd-m", "cd-s"];
let armed = false, tickNow = () => {};

/** Mỗi ô là hai cột số 0–9 xếp dọc; đổi số thì cột lăn tới (transition trong CSS). */
function buildOdometer() {
  const strip = Array.from({ length: 10 }, (_, d) => `<span>${d}</span>`).join("");
  IDS.forEach((id) => { $(id).innerHTML = `<span class="odo"><i>${strip}</i></span><span class="odo"><i>${strip}</i></span>`; });
}
function setOdo(id, v) {
  const cols = $(id).querySelectorAll(".odo i"), s = String(Math.min(v, 99)).padStart(2, "0");
  cols.forEach((c, i) => { c.style.transform = `translateY(${-1.3 * Number(s[i])}em)`; });
}

/** Gọi khi ô đếm ngược cuộn vào màn hình: các số lăn từ 0 tới giá trị thật. Không có hiệu ứng thì hiện ngay. */
export function armOdometer() {
  armed = true;
  tickNow();
}

export function startCountdown() {
  const target = eventAt(EVENT.guestArrive);
  buildOdometer();
  if (!canAnimate()) armed = true;
  const tick = () => {
    let ms = Math.max(0, target - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    if (armed) [d, h, m, s].forEach((v, i) => setOdo(IDS[i], v));
    $("cdText").textContent = `Còn ${d} ngày ${h} giờ ${m} phút tới giờ đón khách.`;
  };
  tickNow = tick;
  tick();
  setInterval(tick, 1000);
}

const LABEL = { queued: "sắp tới", running: "đang diễn ra", done: "đã xong" };

export function startPipeline() {
  const update = () => {
    const now = Date.now();
    const stages = [...document.querySelectorAll(".stage")];
    let done = 0;
    stages.forEach((st) => {
      const a = eventAt(st.dataset.at), b = eventAt(st.dataset.end);
      const s = now >= b ? "done" : now >= a ? "running" : "queued";
      st.dataset.s = s;
      st.querySelector(".lbl").textContent = LABEL[s];
      if (s === "done") done += 1; else if (s === "running") done += 0.5;
    });
    $("pipeBar").style.width = (stages.length ? (done / stages.length) * 100 : 0) + "%";
    // Đúng ngày lễ thì có vạch "bây giờ" trên thước giờ.
    const nowMin = (now - eventAt("00:00")) / 6e4, rn = $("rNow");
    rn.hidden = !(nowMin >= RULER_FROM && nowMin <= RULER_TO);
    if (!rn.hidden) rn.style.left = `${((nowMin - RULER_FROM) / (RULER_TO - RULER_FROM)) * 100}%`;
  };
  update();
  setInterval(update, 60000);
}
