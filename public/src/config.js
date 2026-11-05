// Toàn bộ nội dung thiệp nằm ở đây. Sửa file này rồi deploy lại là xong.
// Mục nào ghi "CẦN ĐIỀN" thì đang để trống hoặc là giá trị tạm.

export const EVENT = {
  date: "2026-11-25",
  tz: "+07:00",
  ceremonyStart: "08:00", // lễ chính trong hội trường
  guestArrive: "10:00", // khách bắt đầu đến, đếm ngược tới mốc này
  guestWindowEnd: "11:00", // khách nên đến trước giờ này
  calendarEnd: "11:30", // giờ kết thúc khi thêm vào lịch
  rsvpDeadline: "2026-11-23", // hạn báo có đến hay không

  graduate: "Lê Viết Nguyên Hưng", // CẦN XÁC NHẬN họ tên đầy đủ
  school: "Trường Đại học Công nghiệp TP.HCM (IUH)",
  schoolShort: "ĐH Công nghiệp TP.HCM (IUH)",
  address: "12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM",
  major: "Kỹ thuật Phần mềm",
  degree: "Kỹ sư Phần mềm",
  cohort: "K17",
  dressCode: "Thoải mái nhé anh em",

  phone: "0917316172", // CẦN ĐIỀN số điện thoại thật. Để trống thì ẩn khung "Lạc đường? Gọi mình".
  meetingPoint: "sẽ cập nhật", // CẦN ĐIỀN vị trí điểm hẹn trong trường
};

export const COPY = {
  // {pron} được thay bằng cách gọi khách, ví dụ "chị Linh"
  lede: "Sau 5 năm cày cuốc, thi cử và những đêm làm đồ án tới sáng, cuối cùng mình cũng ra trường. Mình rất muốn có {pron} ở đó trong ngày đặc biệt này.",
  prTitle: "Mình chính thức tốt nghiệp rồi!",
  prNumber: "#2026",
  prBadge: "Đã tốt nghiệp",
  fromLabel: "sinh viên",
  toLabel: "cựu sinh viên",
  diffAdd: "+167 tín chỉ",
  diffDel: "−0 lần bỏ cuộc",
  footerLine: "Hẹn gặp bạn ở buổi lễ",
  footerSub: "built with ☕, Stack Overflow và sự đồng hành của mọi người",
  genericName: "Bạn thân mến",
};

// Điều kiện tốt nghiệp. Mục cuối "Sự có mặt của bạn" tự đạt khi khách bấm "sẽ đến".
export const CHECKS = [
  { label: "Khóa luận tốt nghiệp", value: "Đã hoàn thành" },
  { label: "Tích lũy tín chỉ", value: "167 / 167", credits: "167/167 tín chỉ" },
  { label: "Chuẩn đầu ra tiếng Anh", value: "TOEIC 450+" },
];

// Lịch trình buổi sáng. Trạng thái tự đổi theo giờ thật của ngày lễ.
export const SCHEDULE = [
  { at: "08:00", end: "09:45", title: "Lễ trao bằng", text: "Mình ở trong hội trường, khách chưa cần tới." },
  { at: "10:00", end: "10:30", title: "Khách đến, gặp ở điểm hẹn", text: "Đến trong khoảng 10:00–11:00 là được. Đến sớm được ưu tiên chụp hình trước nha anh em", key: true },
  { at: "10:30", end: "11:30", title: "Chụp ảnh cùng nhau", text: "Trong khuôn viên trường." },
  { at: "11:30", end: "12:00", title: "Chia tay", text: "Cảm ơn bạn đã dành buổi sáng cho mình." },
];

// Hướng dẫn đường đi. `path` là đường vẽ trên sơ đồ SVG trong index.html,
// `focus` là id của khối được làm nổi bật.
export const ROUTES = [
  {
    id: "grab",
    tab: "Grab · khuyên dùng",
    focus: "n-grab",
    path: "M324 320 H398 V200 H376",
    hops: [
      ["Đặt Grab tới 12 Nguyễn Văn Bảo, hoặc Cổng 4 đường Nguyễn Văn Nghi", "bước 1"],
      ["Xuống xe ngay cổng chính", "bước 2"],
      ["Đi vào trong tới điểm hẹn", "bước 3"],
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
      ["Gửi xe ở bãi ô tô gần trường (đang chốt địa điểm)", "bước 1"], // CẦN ĐIỀN tên và địa chỉ bãi
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

// Lưu ý trước khi đi. sev: error (quan trọng) | warn (nên nhớ) | info (gợi ý)
export const NOTES = [
  { sev: "error", title: "Đến trong khoảng 10:00–11:00", text: "Lễ chính trong hội trường bắt đầu lúc 8:00. Khách đến sau để chụp ảnh cùng mình, không cần dự lễ." },
  { sev: "warn", title: "Ưu tiên đi Grab", text: "Bãi xe trong trường rất đông vào ngày lễ. Đi Grab thì xuống ngay cổng chính, không phải tìm chỗ gửi." },
  { sev: "warn", title: "Nguyễn Văn Bảo là đường một chiều", text: "Đoạn gần trường chỉ đi một chiều. Đi xe máy thì gửi ở chợ Gò Vấp rồi vào cổng sau cho nhanh." },
  { sev: "info", title: "Trang phục", text: "Lịch sự, tông sáng. Mặc trắng hoặc be chụp cùng áo cử nhân sẽ rất hợp." },
  { sev: "info", title: "Hoa không bắt buộc", text: "Có mặt là quý rồi. Nếu mang hoa, mình nhận ở điểm hẹn." },
  { sev: "info", title: "Nếu trời mưa", text: "Mang áo mưa mỏng. Điểm chụp ảnh trong nhà sẽ báo trên thiệp." },
];
export const SEV_LABEL = { error: "quan trọng", warn: "nên nhớ", info: "gợi ý" };

// Thêm vào lịch
export const CALENDAR = {
  title: "Chúc mừng tốt nghiệp của Hưng",
  details: "Cảm ơn bạn đã đến chung vui. Lễ chính 08:00, khách đến khoảng 10:00–11:00.",
};

export const GUEST_CALLS = ["bạn", "anh", "chị", "em", "thầy", "cô", "cả nhóm", "anh em"];
