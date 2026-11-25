import { COPY } from "./config.js";
import { normalizeCall } from "./address.js";
import { $, capFirst } from "./util.js";
import { renderStatic, renderGuestCopy } from "./render.js";
import { initMap } from "./map.js";
import { initMusic, isMusicOff } from "./music.js";
import { initDecor } from "./decor.js";
import { getSlug, fetchGuest, GENERIC_GUEST, pronoun } from "./guest.js";
import { initWish } from "./wish.js";
import { initGallery } from "./gallery.js";
import { confetti } from "./fx.js";
import { startSplash } from "./splash.js";
import { initSmoothScroll } from "./smooth-scroll.js";
import { initScrollEffects } from "./scroll-effects.js";
import { playHeroIntro, initCardTilt } from "./hero.js";
import { initBgGraph } from "./bg-graph.js";

function renderGuest(g, slug, name) {
  $("guestName").textContent = name;
  $("slugEcho").textContent = slug || "moi-nguoi";
  $("greet").textContent = `// ${COPY.greeting}`;
  $("guestLine").textContent = `✓ ${pronoun(g)}`;

  // Câu cảm ơn, {pron} in đậm. Dựng bằng DOM nên tên khách không bao giờ bị hiểu là HTML.
  const lede = $("lede");
  lede.textContent = "";
  COPY.lede.split(/(\{pron\})/).forEach((part) => {
    if (part === "{pron}") {
      const b = document.createElement("b");
      b.textContent = pronoun(g);
      lede.append(b);
    } else if (part) lede.append(part);
  });
  renderGuestCopy(g);
}

async function boot() {
  renderStatic();
  const map = initMap();
  initMusic();
  const decor = initDecor();
  // Cú chạm mở thư là để bật nhạc, khách đã tắt nhạc thì không cần chạm.
  const splash = startSplash({ gate: !isMusicOff() });

  // Thư gửi chung cho mọi người; link riêng (/t/<slug>) và link chung của nhóm thì gọi đúng tên.
  // Lỗi mạng hay slug lạ đều quay về bản chung, thư cảm ơn không có gì phải báo lỗi.
  const slug = getSlug();
  let guest = GENERIC_GUEST, known = false;
  if (slug) {
    try {
      const found = await fetchGuest(slug);
      if (found) {
        guest = { ...found.guest, call: normalizeCall(found.guest.call) };
        known = true;
      }
    } catch (err) {
      console.error(err);
    }
  }
  const name = known ? capFirst(pronoun(guest)) : guest.name;
  renderGuest(guest, known ? slug : "", name);
  // Lời nhắn có ở mọi link; link riêng và link nhóm gửi kèm slug để Hưng biết ai nhắn.
  initWish({ slug: known ? slug : "", pron: pronoun(guest), shared: guest.shared === true });
  let gallery = null;
  try { gallery = initGallery(guest); } catch (err) { console.error(err); }
  splash.setGuest(COPY.greeting, name);

  // Thư lộ ra thì terminal gõ lệnh, tên giải mã, thẻ tốt nghiệp đóng dấu rồi bung pháo giấy.
  splash.opening.then(() => {
    playHeroIntro();
    if (window.gsap) gsap.delayedCall(2.6, () => {
      try {
        const r = $("cardStamp").getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + r.height / 2);
      } catch (err) { console.error(err); }
    });
  });

  await splash.ready;
  initSmoothScroll(decor.syncScroll);
  initScrollEffects(splash.opening, { map, gallery });
  // Trang trí: lỗi ở đây không được chặn bước mở thư phía sau.
  for (const decorate of [initCardTilt, initBgGraph]) {
    try { decorate(); } catch (err) { console.error(err); }
  }
  await splash.tapped;
  await splash.open();
}

boot();
