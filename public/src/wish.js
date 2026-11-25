import { EVENT } from "./config.js";
import { $, esc } from "./util.js";
import { sendWish } from "./guest.js";
import { mood, planeFly } from "./fx.js";

const MAX = 300;

/**
 * Form lời nhắn riêng tư gửi Hưng, có ở mọi link.
 * slug: slug của link riêng hoặc link chung; server ghi vào cột nguon (chỉ khi slug có thật) để biết lời nhắn từ ai.
 * pron: cách gọi người đọc ("chị Linh", "mọi người"...). shared: link chung của nhóm. Chữ ký không bắt buộc.
 * Form báo rõ là có ghi thời gian, thiết bị và IP (server lưu, client không gửi thêm gì).
 */
export function initWish({ slug = "", pron = "mọi người", shared = false } = {}) {
  const form = $("wishForm"), msg = $("wishMsg"), count = $("wishCount"), send = $("wishSend"), log = $("log");
  const host = esc(EVENT.graduateShort), you = esc(pron);
  const setLog = (html, isError = false) => { log.innerHTML = html; log.classList.toggle("err", isError); };
  let sending = false;

  form.hidden = false;
  // Link chung: nhiều người dùng một link, nhắc ký tên để Hưng biết ai gửi.
  setLog(shared
    ? `<span class="c-cmt">› Link này cả nhóm dùng chung. Mỗi người cứ để lại một lời nhắn và ký tên để ${host} biết ai gửi nhé.</span>`
    : `<span class="c-cmt">› ${host} đang chờ lời nhắn của ${you}. Ký tên hay không là tùy ${you}.</span>`);
  msg.addEventListener("input", () => (count.textContent = `${msg.value.length}/${MAX}`));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    const message = msg.value.trim();
    if ([...message].length < 2) {
      setLog(`<span>› Viết vài chữ rồi hãy gửi nhé.</span>`, true);
      msg.focus?.();
      return;
    }
    sending = true;
    send.disabled = true;
    const label = send.textContent;
    send.textContent = "Đang gửi…";
    try {
      await sendWish({ message, name: $("wishName").value.trim(), website: $("wishWeb").value, ...(slug ? { slug } : {}) });
      msg.value = "";
      count.textContent = `0/${MAX}`;
      const signed = $("wishName").value.trim();
      setLog(`<b>✓ Đã gửi lời nhắn${signed ? ` · ký tên ${esc(signed)}` : ""}</b><br><span class="c-cmt">› ${host} cảm ơn ${you} rất nhiều! Muốn nhắn thêm thì cứ viết tiếp.</span>`);
      try { planeFly(send); mood("wish", { fromEl: send, pron }); } catch (e) { console.error(e); }
    } catch (err) {
      console.error(err);
      setLog(err.code === "too_many"
        ? `<span>› Hôm nay đã nhận nhiều lời nhắn từ máy này, nghỉ tay vài phút rồi gửi tiếp nhé.</span>`
        : `<span>› Chưa gửi được. Vui lòng kiểm tra mạng và thử lại.</span>`, true);
    } finally {
      sending = false;
      send.disabled = false;
      send.textContent = label;
    }
  });
}
