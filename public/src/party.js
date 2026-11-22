// Phần mời tiệc thân mật. Chỉ hiện khi /api/guest trả về `party` (khách có cột khach_di_tiec = 1).
import { COPY, EVENT } from "./config.js";
import { $, formatDateVi } from "./util.js";

const COPY_LABEL = "Sao chép tên quán";

/** Ghép câu có chỗ trống {pron}, {time}, {name}; phần thay vào in đậm, dựng bằng DOM nên tên khách không thành HTML. */
function fillLine(el, template, values) {
  el.textContent = "";
  for (const part of template.split(/(\{\w+\})/)) {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    if (key && key in values) {
      const b = document.createElement("b");
      b.textContent = values[key];
      el.append(b);
    } else if (part) el.append(part);
  }
}

/** Trả về true nếu đã hiện phần tiệc. */
export function initParty(party, pron) {
  if (!party?.place || !party?.time) return false;

  $("partyTime").textContent = party.time;
  $("partyDate").textContent = formatDateVi(EVENT.date).replace(/\/\d{4}$/, "").replace(", ", " · "); // "Thứ Tư · 25/11"
  fillLine($("partyLede"), COPY.partyLede, { pron });
  fillLine($("partyBook"), COPY.partyBooking, { pron, time: party.time, name: `“${party.bookingName || EVENT.graduateShort}”` });
  $("partyPlace").textContent = party.place;
  $("partyAddr").textContent = party.address || "";
  $("partyAddr").hidden = !party.address;

  const map = $("partyMap");
  if (/^https:\/\//.test(party.mapUrl || "")) map.href = party.mapUrl;
  else map.hidden = true;

  const btn = $("partyCopy");
  const text = [party.place, party.address].filter(Boolean).join(", ");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Đã sao chép";
    } catch {
      btn.textContent = party.place;
    }
    setTimeout(() => (btn.textContent = COPY_LABEL), 2200);
  });

  $("partySec").hidden = false;
  return true;
}
