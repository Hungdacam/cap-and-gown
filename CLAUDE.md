# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personalized graduation invitation site. Each guest gets a private `/t/<slug>` link that shows their name and form of address, and lets them RSVP. Guest and RSVP data live in a Google Sheet. All site copy, code comments and error messages to users are in Vietnamese.

`../CLAUDE.md` describes a different project (the `UI/` React portal). It does not apply here.

## Commands

```bash
npm run dev                  # http://localhost:3333, no config needed (PORT=4000 to change)
npm test                     # node --test test/*.test.js
node --test test/validate.test.js                          # one file
node --test --test-name-pattern="<name>" test/*.test.js    # one test
npm run guest -- "Họ Tên" chị            # generate slug + row for the Khach tab
npm run guest -- --file danh-sach.csv    # bulk: ho_ten,xung_ho,nhom,kenh_gui
```

Requires Node >= 20. There is no build, bundler, linter, type-checker, or npm dependency, and the code is plain ES modules. Keep the server dependency-free: Google auth is a hand-rolled RS256 JWT via `node:crypto`, and Sheets is called over REST with `fetch`. The one browser library is GSAP 3.15.0, committed as minified builds in `public/vendor/gsap/` and loaded as classic scripts, so the library and its plugins are globals (the CSP rules out a CDN). `canAnimate()` in `util.js` lists the required ones; without them, or with reduced motion, the page runs with no animation.

## Architecture

**Frontend (`public/`)** is served as static files. `/t/:slug` rewrites to `index.html`, and the client reads the slug from the URL (or `#<slug>` for testing). `main.js` renders static content first, then fetches the guest, then starts the RSVP flow in one of three modes:
- `ok`: guest found, RSVP form shown.
- `generic`: no slug or unknown slug (404). Renders "Bạn thân mến" with no RSVP buttons.
- `error`: network or server failure. Shows a reload message.

**Splash and scrolling:** `html.splash-on` is set in the HTML and locks scrolling until `splash.js` clears it. The splash has no text. `boot()` starts it right after the static render and never waits for fonts or images, so guests see motion immediately. After the guest data and `splash.ready`, it starts ScrollSmoother and `scroll-effects.js` while the cap is still (that work takes about 100ms on a slow phone), then calls `splash.open()`. The lines are drawn on a canvas in `splash-lines.js`. Reveals wait on `splash.opening`, so above-the-fold ones are seen. With ScrollSmoother active, `scrollIntoView` does nothing, so use `ScrollSmoother.get().scrollTo` (see `decor.js`). Keep splash motion on the HTML layers (`.sp-cap`, `.sp-strips`, `.sp-ring`, `.sp-bit`, `.sp-lines`) using transform and opacity only. ScrollSmoother needs `#smooth-wrapper` > `#smooth-content`; `position: fixed` elements must stay outside them, and page padding lives on `#smooth-content`. Scroll reveals use `opacity`, not `autoAlpha`, so unrevealed content stays focusable and readable by screen readers. On touch, ScrollSmoother does nothing but `scroll-effects.js` still runs.

**Content** all lives in `public/src/config.js` (event details, schedule, routes, notes). `CẦN ĐIỀN` marks values still missing. `ROUTES[].focus` and `path` reference element ids and coordinates in the SVG map in `index.html`, so the two must change together.

**API (`api/*.js`)** is Vercel serverless functions with `(req, res)` handlers. `_lib/` is not routed. Contract: `GET /api/guest?slug=`, `POST /api/rsvp`, and `GET /api/map` (the embed URL for the Google Map iframe); the JSON content-type requirement on POST doubles as the CSRF check.

**Storage** is selected in `api/_lib/store.js`, and both backends implement `getGuest`, `getRsvp`, `upsertRsvp`, `markOpened`:
- All three env vars set (`SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`): `sheets.js`.
- Env vars missing and not on Vercel: `local.js`, which reads `data/guests.local.json` or falls back to `guests.sample.json`, and writes `data/dev-store.json`.
- Env vars missing on Vercel: throws `not_configured` (503). It never silently falls back.

Tests inject a fake store with `__setStoreForTests` and a fake response with `fakeRes` from `test/helpers.js`. Sheets tests pass `fetchImpl` and `now` to `createSheetsStore`.

## Things that bite

- **The form-of-address list exists in three places:** `CALLS` in `api/_lib/validate.js`, `GUEST_CALLS` in `public/src/config.js`, and `CALLS` in `scripts/new-guest.mjs`. A test compares only the first two. Unknown values fall back to "bạn" on both server and client.
- **Other client/server duplicates:** the slug regex (`validate.js`, `guest.js`), status labels (`sheets.js`, `rsvp.js`), and the 300-character message limit (`validate.js`, `rsvp.js`, `index.html`).
- **Sheet column order is the schema.** Columns are read by index (`Khach!A:H`, `XacNhan!A:E`). Status is stored as the Vietnamese label and read back as either label or code.
- **Sheet writes must stay `valueInputOption=RAW`**, so guest messages starting with `=` are not run as formulas.
- **Guest names are untrusted.** Render them with `textContent`, DOM nodes, or `esc()` before `innerHTML`.
- **The dev server** applies the `vercel.json` headers, so CSP violations show locally. The CSP is strict (`script-src 'self'`, `connect-src 'self'`): no inline scripts or third-party requests. It also caches API modules, so restart it after changing `api/`.
- **Sheets guest cache:** 60s TTL per function instance, with a forced re-read on an unknown slug if the cache is older than 10s.

`design/thiep.html` is the approved design, kept for reference. It is not served.
