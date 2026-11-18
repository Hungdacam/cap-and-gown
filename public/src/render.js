import { EVENT, COPY, CHECKS, SCHEDULE, NOTES, SEV_LABEL } from "./config.js";
import { $, esc, formatDateVi } from "./util.js";
import { guestText } from "./address.js";
import { ARRIVALS } from "./arrival.js";

export const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';
export const PEND_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke-dasharray="3 2.2"/></svg>';
const MERGE_SVG = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.25a2.25 2.25 0 1 1-3 2.12v5.26a2.25 2.25 0 1 1 1.5 0V7.47A5 5 0 0 0 7 9h2.13a2.25 2.25 0 1 1 0 1.5H7A6.5 6.5 0 0 1 3.5 9.03v1.6A2.25 2.25 0 1 1 2 10.62V5.37A2.25 2.25 0 1 1 5 3.25Z"/></svg>';

const addressShort = () => EVENT.address.replace(/,\s*TP\.HCM$/i, "");
const CAP_SVG = '<svg class="cap-ic" viewBox="200 44 104 72" aria-hidden="true"><path class="sp-cap-base" d="M224 84 V102 C238 112 262 112 276 102 V84"/><path class="sp-cap-top" d="M250 52 L296 72 L250 92 L204 72 Z"/><path class="sp-tassel" d="M250 72 L286 78 V102"/><circle class="sp-tassel-tip" cx="286" cy="106" r="4"/></svg>';
export const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
export const RULER_FROM = minutes("08:30"), RULER_TO = minutes("14:00");

export function renderStatic() {
  document.title = `Thiệp mời tốt nghiệp của ${EVENT.graduate}`;
  $("messageLabel").textContent = `Lời nhắn cho ${EVENT.graduateShort} (không bắt buộc)`;
  $("contactLabel").textContent = `Lạc đường? Liên hệ ${EVENT.graduateShort}`;
  $("log").textContent = `Chọn một trạng thái để ${EVENT.graduateShort} sắp xếp đón tiếp nhé`;

  const credits = CHECKS.find((c) => c.credits);
  $("credits").textContent = credits ? credits.credits : "";

  $("prTitle").textContent = COPY.prTitle;
  $("prNum").textContent = COPY.prNumber;
  $("prMeta").innerHTML =
    `<span class="merged" id="merged">${MERGE_SVG}${esc(COPY.prBadge)}</span>` +
    `<span><b style="color:var(--text)">${esc(EVENT.graduate)}</b></span>` +
    `<span class="branch">${esc(COPY.fromLabel)} ${esc(EVENT.cohort)}</span><span>→</span><span class="branch">${esc(COPY.toLabel)}</span>` +
    // số tín chỉ bọc trong #credN để đếm từ 0 lên khi cuộn tới
    `<span class="diff"><span class="add">${esc(COPY.diffAdd).replace(/\d+/, '<span id="credN">$&</span>')}</span> <span class="del">${esc(COPY.diffDel)}</span></span>`;

  $("cardCohort").textContent = EVENT.cohort;
  $("cardPhoto").alt = `Ảnh thẻ của ${EVENT.graduate}`;
  $("cardStamp").textContent = COPY.prBadge.toUpperCase();
  $("cardName").textContent = EVENT.graduate;
  $("cardMajor").textContent = EVENT.major;
  $("cardDate").textContent = `Lễ tốt nghiệp ${EVENT.date.split("-").reverse().join("/")}`;

  const rows = [
    ["ngày", formatDateVi(EVENT.date), "n"],
    ["giờ gặp", EVENT.guestWindows.map((w) => `${w.from}–${w.to}`).join(", "), "v"],
    ["nhận bằng", `${EVENT.ceremonyStart}–${EVENT.ceremonyEnd}`, "v", `# ${EVENT.ceremonySession.toLowerCase()}`],
    ["trường", EVENT.schoolShort, "v"],
    ["địa chỉ", addressShort(), "v"],
    ["ngành", EVENT.major, "v"],
    ["bằng", EVENT.degree, "v"],
    ["trang phục", EVENT.dressCode, "v"],
  ];
  $("yaml").innerHTML =
    '<div><span class="c-cmt"># thông tin buổi lễ</span></div>' +
    rows.map(([k, v, cls, cmt]) => `<div class="yl"><span class="k">${esc(k)}</span>:<span class="${cls}">${esc(v)}</span>${cmt ? ` <span class="c-cmt">${esc(cmt)}</span>` : ""}</div>`).join("");

  $("meetLabel").textContent = `${EVENT.guestArrive} · ${EVENT.meetingPoint}`;
  $("hallLabel").textContent = `nhận bằng · ${EVENT.ceremonyStart}`;
  $("arrival").innerHTML = '<option value="">Chọn khung giờ…</option>' +
    ARRIVALS.map((a) => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("");

  // Thước giờ 08:30 → 14:00: hai khung gặp khách và giờ nhận bằng, đầu đọc chạy theo cuộn (scroll-effects.js).
  const pct = (t) => `${(((minutes(t) - RULER_FROM) / (RULER_TO - RULER_FROM)) * 100).toFixed(2)}%`;
  const width = (a, b) => `${(((minutes(b) - minutes(a)) / (RULER_TO - RULER_FROM)) * 100).toFixed(2)}%`;
  $("rTrack").innerHTML =
    EVENT.guestWindows.map((w, i) => `<span class="r-blk meet" data-a="${esc(w.from)}" data-b="${esc(w.to)}" style="left:${pct(w.from)};width:${width(w.from, w.to)}">đợt ${i + 1}</span>`).join("") +
    `<span class="r-blk cer" data-a="${esc(EVENT.ceremonyStart)}" data-b="${esc(EVENT.ceremonyEnd)}" style="left:${pct(EVENT.ceremonyStart)};width:${width(EVENT.ceremonyStart, EVENT.ceremonyEnd)}">nhận bằng</span>` +
    '<i class="r-now" id="rNow" hidden></i>';
  // Không ghi nhãn ở đầu thước (08:30): nằm quá sát nhãn 9h nên đè nhau trên điện thoại. Bong bóng đầu đọc đã ghi giờ.
  const ticks = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
  $("rTicks").innerHTML = ticks.map((t) => `<span style="left:${pct(t)}">${Number(t.slice(0, 2))}h</span>`).join("");
  $("rLegendCer").textContent = `${EVENT.graduateShort} nhận bằng · ${EVENT.ceremonySession}`;

  // Lịch trình: tạo một lần để giữ trạng thái và các hiệu ứng khi tải xong khách.
  const pipe = $("pipe");
  pipe.style.setProperty("--n", SCHEDULE.length);
  pipe.innerHTML = SCHEDULE.map((s) => {
    const cer = s.at === EVENT.ceremonyStart;
    return `<div class="stage${s.key ? " key" : ""}${cer ? " cer" : ""}" data-at="${esc(s.at)}" data-end="${esc(s.end)}">` + (cer ? CAP_SVG : "") +
    `<span class="st"><i class="dotst"></i><span class="lbl">sắp tới</span></span>` +
    `<time>${esc(s.at)}<small>–${esc(s.end)}</small></time><h3>${esc(s.title)}</h3><p>${esc(guestText(s.text))}</p></div>`;
  }).join("");

  // Lưu ý
  const count = (sev) => NOTES.filter((n) => n.sev === sev).length;
  const parts = ["error", "warn", "info"].filter(count).map((sev) => `${count(sev)} ${SEV_LABEL[sev]}`);
  $("lint").innerHTML =
    `<div class="lint-head"><span>${NOTES.length} lưu ý${parts.length ? " · " + parts.join(", ") : ""}</span></div>` +
    NOTES.map((n) => `<div class="issue${n.sev === "error" ? " hl" : ""}"><span class="sev ${esc(n.sev)}">${esc(SEV_LABEL[n.sev])}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join("");

  // Liên hệ: chỉ hiện khi đã điền số thật
  if (EVENT.phone) {
    $("phone").textContent = EVENT.phone.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
    $("phone").href = `tel:${EVENT.phone}`;
    $("contact").hidden = false;
  }

  renderGuestCopy();
  $("footSub").textContent = COPY.footerSub;
}

/** Nội dung cá nhân hóa; không truyền khách thì dùng xưng hô mặc định. */
export function renderGuestCopy(guest = {}) {
  document.querySelectorAll("#pipe .stage p").forEach((el, i) => {
    el.textContent = guestText(SCHEDULE[i].text, guest);
  });
  $("footLine").textContent = guestText(COPY.footerLine, guest);
}

/** Cột "Điều kiện tốt nghiệp". `present` = khách đã bấm "sẽ đến". */
export function renderChecks({ present, note, guest }) {
  const total = CHECKS.length + 1;
  const ok = CHECKS.length + (present ? 1 : 0);
  $("checks").innerHTML =
    `<h3>Điều kiện tốt nghiệp · ${ok}/${total} đạt</h3>` +
    CHECKS.map((c) => `<div class="check">${CHECK_SVG}<div>${esc(c.label)}<small>${esc(c.value)}</small></div></div>`).join("") +
    `<div class="check${present ? "" : " pending"}">${present ? CHECK_SVG : PEND_SVG}<div>${esc(guestText("Sự có mặt của {pron}", guest))}<small>${esc(note)}</small></div></div>`;
}
