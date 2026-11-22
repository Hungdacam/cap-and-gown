// Tiệc thân mật sau buổi chụp ảnh. Để ở server chứ không để trong public/src/config.js (file ai cũng tải được),
// nên chỉ khách có cột khach_di_tiec = 1 mới nhận được tên quán và giờ đặt bàn qua GET /api/guest.
import { EVENT } from "../../public/src/config.js";

export const PARTY = {
  time: "13:30", // giờ đặt bàn
  place: "Hai Đắc - Hải sản & Lẩu",
  address: "305/28 Đ. Lê Văn Sỹ, Tân Sơn Hòa, Hồ Chí Minh, Việt Nam", // CẦN ĐIỀN địa chỉ quán, để trống thì chỉ hiện nút mở Google Maps
  mapUrl: "https://maps.app.goo.gl/pPBKwd4WNL6TJhsk9",
  bookingName: EVENT.graduateShort, // tên đặt bàn, khách báo tên này với nhân viên
};
