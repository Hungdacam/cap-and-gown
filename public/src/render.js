import { EVENT, COPY, CHECKS, SCHEDULE, NOTES, SEV_LABEL } from "./config.js";
import { $, esc, formatDateVi } from "./util.js";

export const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';
export const PEND_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke-dasharray="3 2.2"/></svg>';
const MERGE_SVG = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.25a2.25 2.25 0 1 1-3 2.12v5.26a2.25 2.25 0 1 1 1.5 0V7.47A5 5 0 0 0 7 9h2.13a2.25 2.25 0 1 1 0 1.5H7A6.5 6.5 0 0 1 3.5 9.03v1.6A2.25 2.25 0 1 1 2 10.62V5.37A2.25 2.25 0 1 1 5 3.25Z"/></svg>';

const addressShort = () => EVENT.address.replace(/,\s*TP\.HCM$/i, "");

export function renderStatic() {
  document.title = `Thiệp mời tốt nghiệp của ${EVENT.graduate}`;

  const credits = CHECKS.find((c) => c.credits);
  $("credits").textContent = credits ? credits.credits : "";

  $("prTitle").textContent = COPY.prTitle;
  $("prNum").textContent = COPY.prNumber;
  $("prMeta").innerHTML =
    `<span class="merged">${MERGE_SVG}${esc(COPY.prBadge)}</span>` +
    `<span><b style="color:var(--text)">${esc(EVENT.graduate)}</b></span>` +
    `<span class="branch">${esc(COPY.fromLabel)} ${esc(EVENT.cohort)}</span><span>→</span><span class="branch">${esc(COPY.toLabel)}</span>` +
    `<span class="diff"><span class="add">${esc(COPY.diffAdd)}</span> <span class="del">${esc(COPY.diffDel)}</span></span>`;

  const rows = [
    ["ngày", formatDateVi(EVENT.date), "n"],
    ["giờ", `${EVENT.guestArrive} – ${EVENT.guestWindowEnd}`, "v", `# lễ chính ${EVENT.ceremonyStart}`],
    ["trường", EVENT.schoolShort, "v"],
    ["địa chỉ", addressShort(), "v"],
    ["ngành", EVENT.major, "v"],
    ["bằng", EVENT.degree, "v"],
    ["trang phục", EVENT.dressCode, "v"],
  ];
  $("yaml").innerHTML =
    '<div><span class="c-cmt"># thông tin buổi lễ</span></div>' +
    rows.map(([k, v, cls, cmt]) => `<div><span class="k">${esc(k)}</span>: <span class="${cls}">${esc(v)}</span>${cmt ? ` <span class="c-cmt">${esc(cmt)}</span>` : ""}</div>`).join("");

  $("meetLabel").textContent = `${EVENT.guestArrive} · ${EVENT.meetingPoint}`;

  // Lịch trình
  const pipe = $("pipe");
  pipe.style.setProperty("--n", SCHEDULE.length);
  pipe.innerHTML = SCHEDULE.map((s) =>
    `<div class="stage${s.key ? " key" : ""}" data-at="${esc(s.at)}" data-end="${esc(s.end)}">` +
    `<span class="st"><i class="dotst"></i><span class="lbl">sắp tới</span></span>` +
    `<time>${esc(s.at)}</time><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join("");

  // Lưu ý
  const count = (sev) => NOTES.filter((n) => n.sev === sev).length;
  const parts = ["error", "warn", "info"].filter(count).map((sev) => `${count(sev)} ${SEV_LABEL[sev]}`);
  $("lint").innerHTML =
    `<div class="lint-head"><span>${NOTES.length} lưu ý${parts.length ? " · " + parts.join(", ") : ""}</span></div>` +
    NOTES.map((n) => `<div class="issue"><span class="sev ${esc(n.sev)}">${esc(SEV_LABEL[n.sev])}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join("");

  // Liên hệ: chỉ hiện khi đã điền số thật
  if (EVENT.phone) {
    $("phone").textContent = EVENT.phone;
    $("contact").hidden = false;
  }

  $("footLine").textContent = COPY.footerLine;
  $("footSub").textContent = COPY.footerSub;
}

/** Cột "Điều kiện tốt nghiệp". `present` = khách đã bấm "sẽ đến". */
export function renderChecks({ present, note }) {
  const total = CHECKS.length + 1;
  const ok = CHECKS.length + (present ? 1 : 0);
  $("checks").innerHTML =
    `<h3>Điều kiện tốt nghiệp · ${ok}/${total} đạt</h3>` +
    CHECKS.map((c) => `<div class="check">${CHECK_SVG}<div>${esc(c.label)}<small>${esc(c.value)}</small></div></div>`).join("") +
    `<div class="check${present ? "" : " pending"}">${present ? CHECK_SVG : PEND_SVG}<div>Sự có mặt của bạn<small>${esc(note)}</small></div></div>`;
}
