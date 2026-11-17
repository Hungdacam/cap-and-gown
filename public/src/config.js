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
  cohort: "K17",
  dressCode: "Thoải mái, thuận tiện chụp ảnh",

  phone: "0917316172", // Để trống thì ẩn khung liên hệ.
  meetingPoint: "trước nhà E hoặc nhà H", // để rộng một chút, khách dễ tìm hơn
};

export const COPY = {
  invitationGreeting: "Trân trọng kính mời",
  // {pron} được thay bằng cách gọi khách, ví dụ "chị Linh"
  lede: `Sau 5 năm cày cuốc, thi cử và những đêm làm đồ án tới sáng, cuối cùng ${EVENT.graduateShort} cũng ra trường. ${EVENT.graduateShort} rất mong {pron} sẽ có mặt trong ngày đặc biệt này.`,
  prTitle: `${EVENT.graduateShort} chính thức tốt nghiệp rồi!`,
  prNumber: "#2026",
  prBadge: "Đã tốt nghiệp",
  fromLabel: "sinh viên",
  toLabel: "cựu sinh viên",
  diffAdd: "+167 tín chỉ",
  diffDel: "−0 lần bỏ cuộc",
  footerLine: `${EVENT.graduateShort} hẹn gặp {pron} ở buổi lễ`,
  footerSub: "built with ☕, Stack Overflow và sự đồng hành của mọi người",
  genericName: "Bạn thân mến",
  tapHint: "Chạm để mở thiệp", // màn hình mở đầu trên điện thoại
  clickHint: "Bấm để mở thiệp", // màn hình mở đầu trên máy tính
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

// Hướng dẫn đường đi. `path` là đường vẽ trên sơ đồ SVG trong index.html,
// `focus` là id của khối được làm nổi bật.
export const ROUTES = [
  {
    id: "grab",
    tab: "Grab · cổng chính",
    focus: "n-grab",
    path: "M324 320 H398 V200 H376",
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
    hops: [
      ["Đi sớm thì vào trường nha hoặc Gửi xe ở bãi đầu chợ Gò Vấp, đối diện Betma English", "bước 1"],
      ["Đi bộ theo đường Lê Quang Định tới cổng sau", "bước 2"],
      ["Vào cổng sau, đi tới điểm hẹn", "bước 3"],
    ],
  },
  {
    id: "car",
    tab: "Ô tô",
    focus: "n-car",
    path: "M190 232 H200 V330 H398 V200 H376",
    hops: [
      [`${EVENT.graduateShort} sẽ cập nhật thông tin bãi gửi ô tô sau`, "bước 1"], // CẦN ĐIỀN tên và địa chỉ bãi
      ["Đi bộ hoặc gọi Grab tới cổng chính", "bước 2"],
      ["Vào cổng chính, đi tới điểm hẹn", "bước 3"],
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
