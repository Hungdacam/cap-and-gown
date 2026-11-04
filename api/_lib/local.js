// Lưu trữ bằng file JSON, chỉ dùng khi chạy thử ở máy (npm run dev). Trên Vercel không bao giờ dùng.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { safeCall } from "./validate.js";

const dataDir = (f) => fileURLToPath(new URL(`../../data/${f}`, import.meta.url));

export function createLocalStore() {
  const guestsFile = existsSync(dataDir("guests.local.json")) ? "guests.local.json" : "guests.sample.json";
  const storeFile = dataDir("dev-store.json");

  const loadStore = async () => {
    try { return JSON.parse(await readFile(storeFile, "utf8")); } catch { return { rsvps: {}, opened: {} }; }
  };
  const saveStore = (s) => writeFile(storeFile, JSON.stringify(s, null, 2));

  return {
    async getGuest(slug) {
      const list = JSON.parse(await readFile(dataDir(guestsFile), "utf8"));
      const g = list.find((x) => x.slug === slug);
      if (!g) return null;
      const s = await loadStore();
      return { row: 0, slug, name: g.name, short: g.short || "", call: safeCall(g.call), openedAt: s.opened?.[slug] || "" };
    },
    async getRsvp(slug) {
      const s = await loadStore();
      return s.rsvps?.[slug] ? { row: 0, ...s.rsvps[slug] } : null;
    },
    async upsertRsvp({ slug, status, plusOnes, message, updatedAt }) {
      const s = await loadStore();
      (s.rsvps ||= {})[slug] = { status, plusOnes, message, updatedAt };
      await saveStore(s);
    },
    async markOpened(slug, _row, at) {
      const s = await loadStore();
      (s.opened ||= {})[slug] = at;
      await saveStore(s);
    },
  };
}
