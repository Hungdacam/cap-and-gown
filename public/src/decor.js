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
    ["Lời cảm ơn", document.querySelector(".term")],
    ["Khoảnh khắc", $("album-h").closest("section")],
    ["Lời nhắn", $("msg-h").closest("section")],
    ["Nơi gặp nhau", $("map-h").closest("section")],
  ];
  const list = $("gList"), fill = $("gFill"), gbarFill = $("gbarFill"), mini = $("mini");
  // ScrollSmoother dịch nội dung bằng transform nên scrollIntoView không cuộn được.
  const goTo = (el) => {
    const smoother = window.ScrollSmoother?.get();
    if (smoother) smoother.scrollTo(el, true, "top 24px");
    else el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };

  const items = sections.map(([label, el]) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => goTo(el));
    li.append(b);
    list.append(li);
    return li;
  });

  let ratio = 0, slider = null, tops = [], lastCur = -1;
  const wide = matchMedia("(min-width:1180px)"); // nhánh git và bản đồ thu nhỏ chỉ hiện trên màn hình rộng

  // Hàm cuộn chạy mỗi khung hình (ScrollSmoother gọi qua onUpdate): không đọc vị trí phần tử ở đây, vì đọc sau khi ghi
  // buộc trình duyệt tính lại bố cục giữa chừng và làm giật. Vị trí các mục đo một lần, đo lại khi đổi kích thước hay refresh.
  const docTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  const measureTops = () => { tops = sections.map(([, el]) => docTop(el)); lastCur = -1; };

  const onScroll = () => {
    const doc = document.documentElement;
    const y = scrollY, max = Math.max(1, doc.scrollHeight - innerHeight);
    // Màn hình hẹp chỉ còn vạch tiến độ: dùng transform để không tính lại bố cục mỗi lần cuộn.
    gbarFill.style.transform = `scaleY(${(y / max).toFixed(4)})`;
    if (!wide.matches) return;
    if (slider) slider.style.transform = `translate3d(0,${(y * ratio).toFixed(1)}px,0)`;
    const probe = y + innerHeight * 0.45;
    let cur = 0;
    tops.forEach((t, i) => { if (t < probe) cur = i; });
    if (cur === lastCur) return;
    lastCur = cur;
    items.forEach((li, i) => { li.classList.toggle("past", i <= cur); li.classList.toggle("now", i === cur); });
    const center = (li) => li.offsetTop + li.offsetHeight / 2;
    fill.style.top = center(items[0]) + "px";
    fill.style.height = center(items[cur]) - center(items[0]) + "px";
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
      slider.style.top = "0";
      slider.style.height = innerHeight * ratio + "px";
      mini.append(slider);
    }
    measureTops();
    onScroll();
  };
  // Ghim lịch trình chèn thêm khoảng đệm: đo lại vị trí các mục sau mỗi lần ScrollTrigger tính lại.
  window.ScrollTrigger?.addEventListener("refresh", () => { measureTops(); onScroll(); });

  // Viền sáng chạy theo con trỏ trên các khung (CSS .panel::after đọc --mx, --my).
  addEventListener("pointermove", (e) => {
    const p = e.target.closest?.(".panel");
    if (!p) return;
    const r = p.getBoundingClientRect();
    p.style.setProperty("--mx", `${e.clientX - r.left}px`);
    p.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", buildMini);
  // Nội dung đổi chiều cao (tên khách, form xác nhận, ảnh tải xong) thì vẽ lại bản đồ thu nhỏ.
  new ResizeObserver(buildMini).observe(document.querySelector(".wrap"));
  return { syncScroll: onScroll };
}
