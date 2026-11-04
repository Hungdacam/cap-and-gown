// Tạo slug riêng cho khách và dòng dán vào tab Khach của Google Sheet.
//
//   npm run guest -- "Đặng Thùy Dương" chị
//   npm run guest -- --file danh-sach.csv        (CSV: ho_ten,xung_ho,nhom,kenh_gui)
//   BASE_URL=https://ten-mien-cua-ban.vn npm run guest -- "Nguyễn Văn A" bạn
//
// Cột của tab Khach: slug | ho_ten | ten_goi | xung_ho | nhom | kenh_gui | da_gui | mo_lan_dau
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

const CALLS = ["bạn", "anh", "chị", "em", "thầy", "cô", "cả nhóm"];
const BASE = (process.env.BASE_URL || "https://<ten-mien-cua-ban>").replace(/\/$/, "");
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const unaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

export function makeSlug(name, call, used = new Set()) {
  const words = unaccent(name).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const stem = (call === "cả nhóm" ? words.slice(0, 3) : words.slice(-2)).join("-") || "khach";
  for (;;) {
    const suffix = Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const slug = `${stem}-${suffix}`;
    if (!used.has(slug)) { used.add(slug); return slug; }
  }
}

export function makeRow({ name, call = "bạn", group = "", channel = "" }, used) {
  call = CALLS.includes(call) ? call : "bạn";
  const short = call === "cả nhóm" ? "" : name.trim().split(/\s+/).pop();
  const slug = makeSlug(name, call, used);
  return { slug, link: `${BASE}/t/${slug}`, cells: [slug, name.trim(), short, call, group, channel, "", ""] };
}

function main(argv) {
  const used = new Set();
  let people = [];
  if (argv[0] === "--file") {
    people = readFileSync(argv[1], "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      .map((l) => l.split(",").map((x) => x.trim()))
      .filter(([n]) => n && n.toLowerCase() !== "ho_ten")
      .map(([name, call, group, channel]) => ({ name, call, group, channel }));
  } else if (argv[0]) {
    people = [{ name: argv[0], call: argv[1] }];
  } else {
    console.error('Cách dùng: npm run guest -- "Họ và tên" [bạn|anh|chị|em|thầy|cô|cả nhóm]\n          npm run guest -- --file danh-sach.csv');
    process.exit(1);
  }
  const rows = people.map((p) => makeRow(p, used));
  console.log("# Dán các dòng này vào tab Khach (từ ô A2), cách nhau bằng tab:");
  rows.forEach((r) => console.log(r.cells.join("\t")));
  console.log("\n# Link gửi cho từng người:");
  rows.forEach((r, i) => console.log(`${people[i].name}\t${r.link}`));
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
