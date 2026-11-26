// Toàn bộ nội dung thiệp nằm ở đây. Sửa file này rồi deploy lại là xong.
// Mục nào ghi "CẦN ĐIỀN" thì đang để trống hoặc là giá trị tạm.

// Hai khung giờ gặp khách. Khoảng giữa là lúc Hưng nhận bằng trong hội trường.
const GUEST_WINDOWS = [
  { from: "09:00", to: "11:00" },
  { from: "12:30", to: "13:30" },
];

export const EVENT = {
  date: "2026-11-25",
  tz: "+07:00",
  ceremonySession: "Phiên 3", // phiên nhận bằng của Hưng
  ceremonyStart: "11:04",
  ceremonyEnd: "12:10",
  guestWindows: GUEST_WINDOWS,
  guestWindowsText: GUEST_WINDOWS.map((w) => `${w.from}–${w.to}`).join(" hoặc "),
  guestArrive: GUEST_WINDOWS[0].from, // đếm ngược và lịch bắt đầu từ mốc này
  calendarEnd: GUEST_WINDOWS.at(-1).to, // giờ kết thúc khi thêm vào lịch
  rsvpDeadline: "2026-11-23", // hạn báo có đến hay không

  graduate: "Lê Viết Nguyên Hưng", // CẦN XÁC NHẬN họ tên đầy đủ
  graduateShort: "Hưng", // Tên tự xưng trong lời mời và hướng dẫn.
  school: "Trường Đại học Công Nghiệp TP.HCM (IUH)",
  schoolShort: "ĐH Công nghiệp TP.HCM (IUH)",
  address: "12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM",
  major: "Kỹ thuật Phần mềm",
  degree: "Kỹ sư Phần mềm",
  displayName: "Hưng Lê", // tên hiện trên màn mở đầu ("đã chung vui ngày tốt nghiệp của Hưng Lê")
  title: "Tân kỹ sư", // danh xưng nổi bật: dòng terminal và dải băng trên thẻ
  cohort: "K17",
  dressCode: "Thoải mái, thuận tiện chụp ảnh",

  phone: "0917316172", // Để trống thì ẩn khung liên hệ.
  meetingPoint: "trước nhà E hoặc nhà H", // để rộng một chút, khách dễ tìm hơn
};

// Lời văn của thư cảm ơn sau ngày lễ. Gửi cho cả người đã đến lẫn người chỉ gửi lời chúc, nên không câu nào khẳng định khách đã có mặt.
// {pron}: cách gọi khách kèm tên (ví dụ "chị Linh"); link công khai là "mọi người".
export const COPY = {
  greeting: "Gửi lời cảm ơn đến",
  lede: `Ngày 25/11, ${EVENT.graduateShort} chính thức khép lại những năm tháng đại học. Cảm ơn {pron} đã dành cho ${EVENT.graduateShort} một phần của ngày hôm ấy, dù là ghé tận trường chung vui, gửi quà hay nhắn một lời chúc từ xa. Với ${EVENT.graduateShort}, điều nào cũng quý.`,
  prBadge: "Đã tốt nghiệp", // con dấu trên thẻ tốt nghiệp
  albumSub: `Vài khoảnh khắc ${EVENT.graduateShort} muốn giữ lại từ hôm 25/11. Kéo ngang để xoay vòng ảnh, chạm vào một tấm để xem lớn.`,
  // Ảnh riêng (cột anh_rieng trong Sheet): khách riêng và ảnh tập thể của link chung có lời khác nhau.
  meLabel: "dành riêng cho {pron}",
  meCap: `Ảnh của {pron} và ${EVENT.graduateShort}`,
  meSub: `Tấm này ${EVENT.graduateShort} giữ riêng cho {pron}. Chạm vào ảnh để xem lớn.`,
  groupLabel: "ảnh tập thể",
  groupCap: `Ảnh chung của {pron} và ${EVENT.graduateShort}`,
  groupSub: `Đông đủ thế này mới đúng là ngày vui. Cảm ơn {pron} đã cùng nhau ghé chụp với ${EVENT.graduateShort}. Chạm vào ảnh để xem lớn, còn nhiều ảnh khác trong album bên dưới.`,
  driveTitle: "Toàn bộ ảnh ngày lễ",
  driveText: `Ảnh của cả ngày hôm ấy ${EVENT.graduateShort} gom lại trong một album Google Drive. Mời {pron} vào xem và lưu lại những tấm ưng ý nhé.`,
  drivePending: `${EVENT.graduateShort} đang chọn và tải ảnh lên. Link album sẽ có ở đây trong vài ngày tới.`,
  mapSub: `Hôm ấy, mỗi người tìm tới điểm hẹn theo một lối: Grab vào cổng chính hay cổng sau, xe máy, ô tô. Cảm ơn những ai đã lặn lội vào tận trường.`,
  msgSub: `Lời chúc muộn, lời hỏi thăm hay một kỷ niệm của hôm ấy, {pron} cứ để lại ở đây. ${EVENT.graduateShort} sẽ đọc hết.`,
  footerLine: `${EVENT.graduateShort} cảm ơn {pron} rất nhiều`,
  footerSub: "built with ☕, Stack Overflow và sự đồng hành của mọi người",
  genericName: "Mọi người",
  genericCall: "mọi người",
  tapHint: "Chạm để mở thư cảm ơn", // màn hình mở đầu trên điện thoại
  clickHint: "Bấm để mở thư cảm ơn", // màn hình mở đầu trên máy tính
};

// Album: vài khoảnh khắc ngày lễ quay trên vòng ảnh 3D, xếp theo giờ chụp (đọc từ EXIF).
// Ảnh đã thu nhỏ: src (1600px, khi xem lớn) và thumb (560px, trên vòng ảnh); ảnh gốc giữ ở anh-goc/ (không đưa lên git).
// at: giờ chụp, trống nếu ảnh không còn thông tin giờ. caption: không bắt buộc. src để trống thì vẽ ảnh mẫu.
export const PHOTOS = [
  { src: "/media/album/01.jpg", thumb: "/media/album/thumb/01.jpg", at: "10:56", caption: "" },
  { src: "/media/album/02.jpg", thumb: "/media/album/thumb/02.jpg", at: "11:05", caption: "" },
  { src: "/media/album/03.jpg", thumb: "/media/album/thumb/03.jpg", at: "12:25", caption: "" },
  { src: "/media/album/04.jpg", thumb: "/media/album/thumb/04.jpg", at: "12:41", caption: "" },
  { src: "/media/album/05.jpg", thumb: "/media/album/thumb/05.jpg", at: "12:53", caption: "" },
  { src: "/media/album/06.jpg", thumb: "/media/album/thumb/06.jpg", at: "13:08", caption: "" },
  { src: "/media/album/07.jpg", thumb: "/media/album/thumb/07.jpg", at: "13:25", caption: "" },
  { src: "/media/album/08.jpg", thumb: "/media/album/thumb/08.jpg", at: "", caption: "" },
  { src: "/media/album/09.jpg", thumb: "/media/album/thumb/09.jpg", at: "", caption: "" },
];

// Album Google Drive chứa toàn bộ ảnh trong ngày. CẦN ĐIỀN link chia sẻ (để trống thì hiện "sẽ có trong vài ngày tới").
export const ALBUM = {
  driveUrl: "",
};

// Điều kiện tốt nghiệp. Mục cuối về sự có mặt của khách tự đạt khi bấm "sẽ đến".
export const CHECKS = [
  { label: "Khóa luận tốt nghiệp", value: "Đã hoàn thành" },
  { label: "Tích lũy tín chỉ", value: "167 / 167", credits: "167/167 tín chỉ" },
  { label: "Chuẩn đầu ra tiếng Anh", value: "TOEIC 450+" },
];

// Lịch trình ngày lễ. Trạng thái tự đổi theo giờ thật của ngày lễ.
const [W1, W2] = GUEST_WINDOWS;
export const SCHEDULE = [
  { at: W1.from, end: W1.to, title: "Gặp gỡ, chụp ảnh · đợt 1", text: `${EVENT.graduateShort} đón {pron} ở điểm hẹn, chụp ảnh cùng nhau trước giờ nhận bằng.`, key: true },
  { at: EVENT.ceremonyStart, end: EVENT.ceremonyEnd, title: `Nhận bằng · ${EVENT.ceremonySession}`, text: `${EVENT.graduateShort} vào hội trường nhận bằng. Hẹn gặp lại {pron} lúc ${W2.from}.` },
  { at: W2.from, end: W2.to, title: "Gặp gỡ, chụp ảnh · đợt 2", text: `Chụp ảnh cùng ${EVENT.graduateShort} sau khi nhận bằng. ${EVENT.graduateShort} cảm ơn {pron} đã dành thời gian đến chung vui.`, key: true },
];

// Hướng dẫn đường đi. `path` là đường vẽ trên sơ đồ SVG trong index.html (dự phòng khi không có 3D),
// `focus` là id của khối được làm nổi bật.
// `campus` dùng cho sơ đồ 3D (map3d.js), toạ độ theo bản vẽ khuôn viên: bắc ở trên, đường Nguyễn Văn Bảo ở dưới.
//   pts: các điểm gấp khúc của lộ trình; stops: chỉ số điểm ứng với từng bước; yaw: góc xoay camera (3 = nhìn từ phía Lê Quang Định).
export const ROUTES = [
  {
    id: "grab",
    tab: "Grab · cổng chính",
    focus: "n-grab",
    path: "M324 320 H398 V200 H376",
    campus: { lot: "grab", pts: [[168, 408], [215, 408], [215, 378], [222, 310], [230, 252], [270, 240], [322, 241]], stops: [0, 2, 6] },
    hops: [
      ["Đặt Grab tới 12 Nguyễn Văn Bảo, hoặc Cổng 4 đường Nguyễn Văn Nghi", "bước 1"],
      ["Xuống xe ngay cổng chính", "bước 2"],
      ["Đi thẳng qua sân xe đạp tới sân trước nhà E hoặc nhà H", "bước 3"],
    ],
  },
  {
    id: "grab-sau",
    tab: "Grab · cổng sau",
    focus: "n-grab2",
    path: "M344 52 H318 V200 H344", // bắt đầu ở mép trái ô GRAB để không đè lên chữ
    campus: { lot: "grab2", yaw: 3, pts: [[376, -47], [342, -47], [342, 0], [342, 132], [402, 132], [402, 238], [322, 241]], stops: [0, 2, 6] },
    hops: [
      ["Đặt Grab tới cổng sau trường, đường Lê Quang Định", "bước 1"],
      ["Xuống xe ngay cổng sau", "bước 2"],
      [`Vào cổng sau, đi theo lộ trình xe máy của ${EVENT.graduateShort} tới sân trước nhà E hoặc nhà H`, "bước 3"],
    ],
  },
  {
    id: "moto",
    tab: "Xe máy",
    focus: "n-moto",
    path: "M105 72 V52 H318 V200 H344",
    campus: { lot: "moto", yaw: 3, pts: [[-40, 120], [-40, -47], [342, -47], [342, 0], [342, 132], [402, 132], [402, 238], [322, 241]], stops: [0, 3, 7] },
    hops: [
      ["Đi sớm thì vào trường nha hoặc Gửi xe ở bãi đầu chợ Gò Vấp, đối diện Betma English", "bước 1"],
      ["Đi bộ theo đường Lê Quang Định tới cổng sau", "bước 2"],
      ["Vào cổng sau, đi tới sân trước nhà E hoặc nhà H", "bước 3"],
    ],
  },
  {
    id: "car",
    tab: "Ô tô",
    focus: "n-car",
    path: "M190 232 H200 V330 H398 V200 H376",
    campus: { lot: "car", pts: [[-70, 375], [-70, 408], [215, 408], [215, 378], [222, 310], [230, 252], [270, 240], [322, 241]], stops: [0, 3, 7] },
    hops: [
      [`${EVENT.graduateShort} sẽ cập nhật thông tin bãi gửi ô tô sau`, "bước 1"], // CẦN ĐIỀN tên và địa chỉ bãi
      ["Đi bộ hoặc gọi Grab tới cổng chính", "bước 2"],
      ["Vào cổng chính, qua sân xe đạp tới sân trước nhà E hoặc nhà H", "bước 3"],
    ],
  },
];
export const DEFAULT_ROUTE = "grab";

// Ghim bản đồ. CẦN ĐIỀN link ghim thật của bãi chợ Gò Vấp, cổng sau, cổng chính.
export const MAP = {
  schoolQuery: "Trường Đại học Công nghiệp TP.HCM 12 Nguyễn Văn Bảo",
};

// Nhạc nền, phát lặp từ lần bấm đầu tiên trên trang. volume: 0–1.
export const MUSIC = {
  src: "/media/uong-to-violin.mp3",
  volume: 0.5,
};

// Lưu ý trước khi đi. sev: error (quan trọng) | warn (nên nhớ) | info (gợi ý)
export const NOTES = [
  { sev: "error", title: `Đến trong khoảng ${EVENT.guestWindowsText}`, text: `Từ ${EVENT.ceremonyStart} đến ${EVENT.ceremonyEnd}, ${EVENT.graduateShort} nhận bằng ở ${EVENT.ceremonySession} trong hội trường nên không ra gặp được. Khách mời chọn một trong hai khung giờ trên để chụp ảnh cùng ${EVENT.graduateShort}, không cần dự lễ.` },
  { sev: "warn", title: "Ưu tiên đi Grab", text: `Bãi xe trong trường rất đông vào ngày lễ. Đi Grab thì xuống ngay cổng chính, không phải tìm chỗ gửi, hoặc đi Grab tới cổng sau (đường Lê Quang Định) rồi đi theo lộ trình hướng dẫn xe máy của ${EVENT.graduateShort}.` },
  { sev: "warn", title: "Nguyễn Văn Bảo là đường một chiều", text: "Đoạn gần trường chỉ đi một chiều. Đi xe máy thì gửi ở chợ Gò Vấp rồi vào cổng sau cho nhanh." },
  { sev: "info", title: "Trang phục", text: "Ưu tiên trang phục thoải mái, dễ di chuyển và thuận tiện chụp ảnh." },
  { sev: "info", title: "Hoa không bắt buộc", text: `Có mặt là quý rồi, không cần chuẩn bị hoa. Nhà ${EVENT.graduateShort} ở xa nên việc mang hoa về hơi bất tiện.` },
  { sev: "info", title: "Nếu trời mưa", text: "Mang áo mưa mỏng. Điểm chụp ảnh trong nhà sẽ báo trên thiệp." },
];
export const SEV_LABEL = { error: "quan trọng", warn: "nên nhớ", info: "gợi ý" };

// Thêm vào lịch
export const CALENDAR = {
  title: `Chúc mừng tốt nghiệp của ${EVENT.graduateShort}`,
  details: `Đến chung vui và chụp ảnh cùng ${EVENT.graduateShort}. Khung giờ gặp: ${EVENT.guestWindowsText}. ${EVENT.graduateShort} nhận bằng ${EVENT.ceremonySession}, ${EVENT.ceremonyStart}–${EVENT.ceremonyEnd}.`,
};

export { GUEST_CALLS } from "./address.js";
