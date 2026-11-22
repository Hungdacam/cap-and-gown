import { COPY } from "./config.js";
import { normalizeCall } from "./address.js";
import { $, capFirst } from "./util.js";
import { renderStatic, renderGuestCopy } from "./render.js";
import { startCountdown, startPipeline } from "./countdown.js";
import { initMap, initGoogleMap, initPhoneCopy } from "./map.js";
import { initMusic, isMusicOff } from "./music.js";
import { initDecor } from "./decor.js";
import { getSlug, fetchGuest, GENERIC_GUEST, pronoun } from "./guest.js";
import { initRsvp } from "./rsvp.js";
import { initWish } from "./wish.js";
import { initParty } from "./party.js";
import { googleCalendarUrl, needsSafariForIcs } from "./calendar.js";
import { startSplash } from "./splash.js";
import { initSmoothScroll } from "./smooth-scroll.js";
import { initScrollEffects } from "./scroll-effects.js";
import { initFacts } from "./facts.js";
import { playHeroIntro, initCardTilt } from "./hero.js";
import { initBgGraph } from "./bg-graph.js";

function renderGuest(g, slug, name) {
  $("guestName").textContent = name;
  $("slugEcho").textContent = slug || "guest";
  $("greet").textContent = `// ${COPY.invitationGreeting}`;

  // Câu mở đầu, {pron} in đậm. Dựng bằng DOM nên tên khách không bao giờ bị hiểu là HTML.
  const lede = $("lede");
  lede.textContent = "";
  const [before, after = ""] = COPY.lede.split("{pron}");
  const b = document.createElement("b");
  b.textContent = pronoun(g);
  lede.append(before, b, after);
  renderGuestCopy(g);
}

async function boot() {
  renderStatic();
  startCountdown();
  startPipeline();
  initFacts();
  const map = initMap();
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
  let guest = GENERIC_GUEST, rsvp = null, party = null, mode = "generic";
  if (slug) {
    try {
      const found = await fetchGuest(slug);
      if (found) {
        guest = { ...found.guest, call: normalizeCall(found.guest.call) };
        rsvp = found.rsvp;
        party = found.party;
        // Link chung (cột link_chung trong Sheet): chào đúng tên nhóm nhưng chỉ nhận lời chúc, không nhận xác nhận.
        mode = guest.shared ? "shared" : "ok";
      }
    } catch (err) {
      console.error(err);
      mode = "error";
    }
  }
  const known = mode === "ok" || mode === "shared";
  const name = known ? capFirst(pronoun(guest)) : guest.name;
  renderGuest(guest, known ? slug : "", name);
  initRsvp({ slug, guest, rsvp, mode });
  // Link công khai và link chung của nhóm: thay phần xác nhận bằng form lời chúc, mỗi lời chúc là một dòng mới (không ghi đè).
  if (mode === "generic") initWish();
  if (mode === "shared") initWish({ slug, pron: pronoun(guest) });
  // Mời tiệc thân mật (cột khach_di_tiec). Hiện trước khi dựng hiệu ứng cuộn để ScrollTrigger đo đúng vị trí.
  if (known && party) {
    try { initParty(party, pronoun(guest)); } catch (err) { console.error(err); }
  }
  splash.setGuest(COPY.invitationGreeting, name);

  // Thiệp lộ ra thì terminal gõ lệnh, tên khách giải mã, thẻ tốt nghiệp đung đưa.
  splash.opening.then(playHeroIntro);

  await splash.ready;
  initSmoothScroll(decor.syncScroll);
  initScrollEffects(splash.opening, { map });
  // Trang trí: lỗi ở đây không được chặn bước mở thiệp phía sau.
  for (const decorate of [initCardTilt, initBgGraph]) {
    try { decorate(); } catch (err) { console.error(err); }
  }
  await splash.tapped;
  await splash.open();
}

boot();
