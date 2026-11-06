import { GUEST_CALLS, COPY } from "./config.js";
import { $ } from "./util.js";
import { renderStatic } from "./render.js";
import { startCountdown, startPipeline } from "./countdown.js";
import { initMap, initGoogleMap, initPhoneCopy } from "./map.js";
import { initMusic, isMusicOff } from "./music.js";
import { initDecor } from "./decor.js";
import { getSlug, fetchGuest, GENERIC_GUEST, pronoun, greeting } from "./guest.js";
import { initRsvp } from "./rsvp.js";
import { googleCalendarUrl, needsSafariForIcs } from "./calendar.js";
import { startSplash } from "./splash.js";
import { initSmoothScroll } from "./smooth-scroll.js";
import { initScrollEffects } from "./scroll-effects.js";

function renderGuest(g, slug) {
  const el = $("guestName");
  el.textContent = g.name;
  $("slugEcho").textContent = slug || "guest";
  $("greet").textContent = `// ${greeting(g)}`;

  // Câu mở đầu, {pron} in đậm. Dựng bằng DOM nên tên khách không bao giờ bị hiểu là HTML.
  const lede = $("lede");
  lede.textContent = "";
  const [before, after = ""] = COPY.lede.split("{pron}");
  const b = document.createElement("b");
  b.textContent = pronoun(g);
  lede.append(before, b, after);
}

async function boot() {
  renderStatic();
  startCountdown();
  startPipeline();
  initMap();
  initGoogleMap();
  initPhoneCopy();
  initMusic();
  const decor = initDecor();

  $("cal").hidden = false;
  $("calGoogle").href = googleCalendarUrl();
  $("calHint").hidden = !needsSafariForIcs(navigator.userAgent, navigator.maxTouchPoints);
  // Cú chạm mở thiệp là để bật nhạc, khách đã tắt nhạc thì không cần chạm.
  const splash = startSplash({ gate: !isMusicOff() });

  const slug = getSlug();
  let guest = GENERIC_GUEST, rsvp = null, mode = "generic";
  if (slug) {
    try {
      const found = await fetchGuest(slug);
      if (found) {
        guest = { ...found.guest, call: GUEST_CALLS.includes(found.guest.call) ? found.guest.call : "bạn" };
        rsvp = found.rsvp;
        mode = "ok";
      }
    } catch (err) {
      console.error(err);
      mode = "error";
    }
  }
  renderGuest(guest, mode === "ok" ? slug : "");
  initRsvp({ slug, guest, rsvp, mode });
  if (mode === "ok") splash.setGuest(greeting(guest), pronoun(guest));

  await splash.ready;
  initSmoothScroll(decor.syncScroll);
  initScrollEffects(splash.opening);
  await splash.tapped;
  await splash.open();
}

boot();
