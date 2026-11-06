import { EVENT } from "./config.js";
import { $ } from "./util.js";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mã vạch trang trí trên thẻ, độ rộng vạch suy từ ngày lễ. */
function drawBarcode() {
  const digits = EVENT.date.replace(/-/g, "").repeat(2);
  let x = 0;
  const stops = [];
  for (const ch of digits) {
    const d = Number(ch);
    const on = 2 + (d % 3) * 2, off = 2 + ((d + 1) % 2) * 2;
    stops.push(`var(--card-ink) ${x}px ${x + on}px`, `transparent ${x + on}px ${x + on + off}px`);
    x += on + off;
  }
  $("cardBar").style.background = `linear-gradient(90deg,${stops.join(",")})`;
}

/** Nhánh git bên trái, bản đồ thu nhỏ bên phải, vạch tiến độ khi màn hình hẹp. */
export function initDecor() {
  drawBarcode();

  const sections = [
    ["Lời mời", document.querySelector(".term")],
    ["Thiệp mời", $("pr-h").closest("section")],
    ["Lịch trình", $("pipe-h").closest("section")],
    ["Đường đi", $("map-h").closest("section")],
    ["Lưu ý", $("lint-h").closest("section")],
  ];
  const list = $("gList"), fill = $("gFill"), gbarFill = $("gbarFill"), mini = $("mini");
  const items = sections.map(([label, el]) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      // ScrollSmoother dịch nội dung bằng transform nên scrollIntoView không cuộn được.
      const smoother = window.ScrollSmoother?.get();
      if (smoother) smoother.scrollTo(el, true, "top 24px");
      else el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    });
    li.append(b);
    list.append(li);
    return li;
  });

  let ratio = 0, slider = null;

  const onScroll = () => {
    const doc = document.documentElement;
    const y = scrollY, max = Math.max(1, doc.scrollHeight - innerHeight);
    let cur = 0;
    sections.forEach(([, el], i) => { if (el.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
    items.forEach((li, i) => { li.classList.toggle("past", i <= cur); li.classList.toggle("now", i === cur); });
    const center = (li) => li.offsetTop + li.offsetHeight / 2;
    fill.style.top = center(items[0]) + "px";
    fill.style.height = center(items[cur]) - center(items[0]) + "px";
    gbarFill.style.height = (y / max) * 100 + "%";
    if (slider) {
      slider.style.top = y * ratio + "px";
      slider.style.height = innerHeight * ratio + "px";
    }
  };

  const buildMini = () => {
    mini.textContent = "";
    slider = null;
    const H = mini.clientHeight, docH = document.documentElement.scrollHeight;
    if (H && docH) {
      ratio = H / docH;
      const wrap = document.querySelector(".wrap").getBoundingClientRect();
      const block = (el, cls) => {
        const r = el.getBoundingClientRect();
        if (!r.height) return;
        const b = document.createElement("b");
        if (cls) b.className = cls;
        b.style.top = (r.top + scrollY) * ratio + "px";
        b.style.height = Math.max(2, r.height * ratio) + "px";
        b.style.left = ((r.left - wrap.left) / wrap.width) * 100 + "%";
        b.style.width = (r.width / wrap.width) * 100 + "%";
        mini.append(b);
      };
      document.querySelectorAll(".wrap .panel").forEach((el) => block(el));
      document.querySelectorAll(".wrap h2").forEach((el) => block(el, "t"));
      slider = document.createElement("i");
      mini.append(slider);
    }
    onScroll();
  };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", buildMini);
  // Nội dung đổi chiều cao (tên khách, form xác nhận, ảnh tải xong) thì vẽ lại bản đồ thu nhỏ.
  new ResizeObserver(buildMini).observe(document.querySelector(".wrap"));
  return { syncScroll: onScroll };
}
