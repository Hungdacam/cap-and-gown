import { EVENT, COPY, CHECKS, ALBUM } from "./config.js";
import { $ } from "./util.js";
import { guestText } from "./address.js";

const dmy = (iso) => iso.split("-").reverse().join("/");

export function renderStatic() {
  document.title = `Lời cảm ơn của ${EVENT.graduate}`;
  const credits = CHECKS.find((c) => c.credits);
  $("credits").textContent = credits ? credits.credits : "";
  $("dayLine").textContent = dmy(EVENT.date);

  $("cardCohort").textContent = EVENT.cohort;
  $("cardPhoto").alt = `Ảnh thẻ của ${EVENT.graduate}`;
  $("cardStamp").textContent = COPY.prBadge.toUpperCase();
  // Danh xưng "Tân kỹ sư": dải băng trên ảnh thẻ và một dòng terminal ở đầu thư.
  $("cardTitle").textContent = EVENT.title.toUpperCase();
  $("titleLine").textContent = `${EVENT.title} ${EVENT.graduateShort}`;
  $("cardName").textContent = EVENT.graduate;
  $("cardMajor").textContent = EVENT.major;
  $("cardDate").textContent = `Lễ tốt nghiệp ${dmy(EVENT.date)}`;

  $("albumSub").textContent = COPY.albumSub;
  $("driveTitle").textContent = COPY.driveTitle;
  // Album Google Drive: chưa có link thì báo sắp có, không để nút bấm vào chỗ trống.
  const drive = $("driveLink");
  if (/^https:\/\//.test(ALBUM.driveUrl)) drive.href = ALBUM.driveUrl;
  else { drive.hidden = true; $("drive").classList.add("pending"); }

  $("mapSub").textContent = COPY.mapSub;
  $("meetLabel").textContent = EVENT.meetingPoint;
  $("hallLabel").textContent = `nhận bằng · ${EVENT.ceremonyStart}`;

  renderGuestCopy();
  // Chân trang: nhánh sinh-viên đã merge xong, Hưng giờ là cựu sinh viên.
  const merged = $("footMerged");
  merged.textContent = "";
  const tag = document.createElement("span");
  tag.className = "c-ok";
  tag.textContent = `merged ${dmy(EVENT.date)}`;
  merged.append(`${COPY.footerAlumni} · `, tag);
  $("footSub").textContent = COPY.footerSub;
}

/** Nội dung cá nhân hóa; không truyền khách thì dùng cách gọi chung. textContent nên tên khách không thành HTML. */
export function renderGuestCopy(guest = {}) {
  const g = guest.call || guest.short ? guest : { call: COPY.genericCall };
  $("driveText").textContent = /^https:\/\//.test(ALBUM.driveUrl) ? guestText(COPY.driveText, g) : COPY.drivePending;
  $("msgSub").textContent = guestText(COPY.msgSub, g);
  $("footLine").textContent = guestText(COPY.footerLine, g);
}
