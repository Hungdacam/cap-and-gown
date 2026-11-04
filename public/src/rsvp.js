import { EVENT } from "./config.js";
import { $, esc, capFirst, formatDayMonth } from "./util.js";
import { sendRsvp } from "./guest.js";
import { renderChecks } from "./render.js";
import { confetti } from "./confetti.js";

const STATUSES = ["yes", "maybe", "no"];
const WAITING = "Đang chờ bạn xác nhận ↓";
const LABEL = { yes: "Sẽ đến", maybe: "Chưa chắc", no: "Không đi được" };

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hourCycle: "h23",
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute} ngày ${p.day}/${p.month}`;
}

function setLog(html, isError = false) {
  const log = $("log");
  log.innerHTML = html;
  log.classList.toggle("err", isError);
}

/**
 * state: { slug, guest, rsvp, mode }
 * mode: "ok" | "generic" (link không nhận ra) | "error" (không tải được)
 */
export function initRsvp({ slug, guest, rsvp, mode }) {
  let saved = rsvp; // { status, plusOnes, message, updatedAt } | null
  let chosen = rsvp?.status || null;
  let sending = false;

  const showChecks = () =>
    renderChecks({ present: saved?.status === "yes", note: saved?.status === "yes" ? `${guest.name} sẽ đến` : WAITING });
  showChecks();

  if (mode !== "ok") {
    $("rsvpBtns").hidden = true;
    $("rsvpForm").hidden = true;
    setLog(mode === "error"
      ? '<span class="c-cmt">› Chưa tải được thông tin lúc này. Bạn tải lại trang giúp mình nhé.</span>'
      : '<span class="c-cmt">› Link này chưa nhận ra tên bạn. Hãy mở lại đúng link mình gửi riêng cho bạn, hoặc nhắn trực tiếp để xác nhận nhé.</span>');
    return;
  }

  $("rsvpBtns").hidden = false;
  const subj = guest.call === "bạn" ? "Mình" : capFirst(guest.call);
  $("yes").textContent = `✓ ${subj} sẽ đến`;

  const form = $("rsvpForm"), plus = $("plusOnes"), msg = $("rsvpMsg"), count = $("rsvpCount"), send = $("rsvpSend");
  const updateCount = () => (count.textContent = `${msg.value.length}/300`);
  msg.addEventListener("input", updateCount);

  const select = (status) => {
    chosen = status;
    STATUSES.forEach((s) => $(s).setAttribute("aria-pressed", s === status));
    form.hidden = false;
    $("plusField").hidden = status === "no";
    send.textContent = saved ? "Cập nhật xác nhận" : "Gửi xác nhận";
  };
  STATUSES.forEach((s) => $(s).addEventListener("click", () => select(s)));

  if (saved) {
    plus.value = String(saved.plusOnes ?? 0);
    msg.value = saved.message || "";
    updateCount();
    select(saved.status);
    const when = saved.updatedAt ? ` lúc ${formatWhen(saved.updatedAt)}` : "";
    setLog(`<b>✓ Bạn đã trả lời: ${esc(LABEL[saved.status])}</b>${esc(when)}<br><span class="c-cmt">› Muốn đổi thì chọn lại rồi bấm "Cập nhật xác nhận".</span>`);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!chosen || sending) return;
    sending = true;
    send.disabled = true;
    const label = send.textContent;
    send.textContent = "Đang gửi…";
    const payload = { slug, status: chosen, plusOnes: chosen === "no" ? 0 : Number(plus.value) || 0, message: msg.value.trim() };
    try {
      await sendRsvp(payload);
      const wasYes = saved?.status === "yes";
      saved = { ...payload, updatedAt: new Date().toISOString() };
      showChecks();
      const who = esc(guest.name);
      if (chosen === "yes") {
        setLog(`<b>✓ Đã xác nhận sẽ đến</b> · ${who}<br><span class="c-cmt">› Hẹn gặp bạn lúc ${esc(EVENT.guestArrive)} nhé!</span>`);
        if (!wasYes) confetti();
      } else if (chosen === "maybe") {
        setLog(`<span style="color:var(--warn)">● Chưa chắc</span> · ${who}<br><span class="c-cmt">› Không sao, chốt rồi báo mình trước ngày ${esc(formatDayMonth(EVENT.rsvpDeadline))} nha.</span>`);
      } else {
        setLog(`<span style="color:var(--muted)">○ Không đi được</span> · ${who}<br><span class="c-cmt">› Tiếc ghê! Cảm ơn đã báo, mình sẽ gửi ảnh sau.</span>`);
      }
      send.textContent = "Cập nhật xác nhận";
    } catch {
      setLog('<span>› Chưa gửi được. Bạn kiểm tra mạng rồi bấm gửi lại giúp mình, hoặc nhắn trực tiếp cho mình nhé.</span>', true);
      send.textContent = label;
    } finally {
      sending = false;
      send.disabled = false;
    }
  });
}
