import { EVENT } from "./config.js";
import { $, pad2, eventAt } from "./util.js";

export function startCountdown() {
  const target = eventAt(EVENT.guestArrive);
  const tick = () => {
    let ms = Math.max(0, target - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    $("cd-d").textContent = pad2(d);
    $("cd-h").textContent = pad2(h);
    $("cd-m").textContent = pad2(m);
    $("cd-s").textContent = pad2(s);
  };
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
  };
  update();
  setInterval(update, 60000);
}
