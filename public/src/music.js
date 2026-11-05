import { MUSIC } from "./config.js";
import { $ } from "./util.js";

const OFF_KEY = "music-off";
const FADE_MS = 1500;

// Trình duyệt chặn tự phát nhạc khi chưa có tương tác, nên nhạc bắt đầu từ lần bấm đầu tiên trên trang.
// Khách đã tắt thì lần sau không tự bật lại. localStorage có thể bị chặn nên phải bọc try/catch.
const readOff = () => { try { return localStorage.getItem(OFF_KEY) === "1"; } catch { return false; } };
const writeOff = (off) => { try { localStorage.setItem(OFF_KEY, off ? "1" : "0"); } catch { /* không lưu được thì thôi */ } };

export function initMusic() {
  const btn = $("musicBtn"), label = $("musicLabel");
  const audio = new Audio();
  audio.preload = "none"; // 3 MB, chỉ tải khi thật sự phát
  audio.loop = true;
  audio.src = MUSIC.src;

  let fade = 0;
  const fadeIn = () => {
    clearInterval(fade);
    audio.volume = 0;
    const started = performance.now();
    fade = setInterval(() => {
      const t = Math.min(1, (performance.now() - started) / FADE_MS);
      audio.volume = MUSIC.volume * t;
      if (t === 1) clearInterval(fade);
    }, 50);
  };

  const paint = () => {
    const on = !audio.paused;
    btn.setAttribute("aria-pressed", on);
    btn.classList.toggle("on", on);
    label.textContent = on ? "Tắt nhạc" : "Bật nhạc";
  };
  audio.addEventListener("play", paint);
  audio.addEventListener("pause", paint);

  const removeGestures = () => ["click", "keydown"].forEach((ev) => document.removeEventListener(ev, onFirstGesture));
  const play = async () => {
    try {
      const fresh = audio.currentTime === 0;
      await audio.play();
      if (fresh) fadeIn();
      else audio.volume = MUSIC.volume;
      removeGestures();
    } catch { /* trình duyệt từ chối hoặc lỗi tải: giữ nguyên nút để khách thử lại */ }
  };
  function onFirstGesture(e) {
    if (btn.contains(e.target)) return; // nút có xử lý riêng
    play();
  }

  btn.addEventListener("click", () => {
    if (audio.paused) { writeOff(false); play(); }
    else { writeOff(true); audio.pause(); removeGestures(); }
  });

  if (!readOff()) ["click", "keydown"].forEach((ev) => document.addEventListener(ev, onFirstGesture));

  // Rời tab hoặc khóa màn hình thì tạm dừng, quay lại phát tiếp.
  let resume = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { resume = !audio.paused; audio.pause(); }
    else if (resume) { resume = false; play(); }
  });
}
