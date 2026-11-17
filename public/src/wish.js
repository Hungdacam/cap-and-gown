import { EVENT } from "./config.js";
import { $, esc } from "./util.js";
import { sendWish } from "./guest.js";
import { confetti } from "./confetti.js";

const MAX = 300;

/**
 * Form lời chúc riêng tư, chỉ dùng ở thiệp chung (link công khai, không có slug).
 * Chữ ký không bắt buộc. Form báo rõ là có ghi thời gian, thiết bị và IP (server lưu, client không gửi thêm gì).
 */
export function initWish() {
  const form = $("wishForm"), msg = $("wishMsg"), count = $("wishCount"), send = $("wishSend"), log = $("log");
  const host = esc(EVENT.graduateShort);
  const setLog = (html, isError = false) => { log.innerHTML = html; log.classList.toggle("err", isError); };
  let sending = false;

  form.hidden = false;
  setLog(`<span class="c-cmt">› Gửi ${host} vài lời chúc nhé. Ký tên hay không là tùy bạn.</span>`);
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
      await sendWish({ message, name: $("wishName").value.trim(), website: $("wishWeb").value });
      msg.value = "";
      count.textContent = `0/${MAX}`;
      setLog(`<b>✓ Đã gửi lời chúc</b><br><span class="c-cmt">› ${host} cảm ơn bạn rất nhiều! Muốn chúc thêm thì cứ viết tiếp.</span>`);
      confetti();
    } catch (err) {
      console.error(err);
      setLog(err.code === "too_many"
        ? `<span>› Bạn gửi hơi nhiều lời chúc rồi, nghỉ tay vài phút rồi gửi tiếp nhé.</span>`
        : `<span>› Chưa gửi được. Vui lòng kiểm tra mạng và thử lại.</span>`, true);
    } finally {
      sending = false;
      send.disabled = false;
      send.textContent = label;
    }
  });
}
