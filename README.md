# cap-and-gown · Thiệp mời tốt nghiệp

Thiệp mời động cho lễ tốt nghiệp **25/11/2026** (IUH, 12 Nguyễn Văn Bảo, Gò Vấp). Mỗi khách có một link riêng
`/t/<slug>`; trang tự điền đúng tên và cách xưng hô, khách bấm xác nhận có đến hay không, dữ liệu lưu vào Google Sheet.

- Giao diện: HTML + CSS + ES modules thuần, không bundler (`public/`). Thư viện duy nhất là GSAP 3.15.0, lưu sẵn trong `public/vendor/gsap/`.
- API: hai hàm serverless trên Vercel (`api/guest.js`, `api/rsvp.js`), gọi Google Sheets REST bằng service account (JWT RS256 qua `node:crypto`).
- Bản thiết kế gốc để đối chiếu: `design/thiep.html`.

## Chạy thử ở máy

```bash
npm run dev     # http://localhost:3333, không cần cấu hình gì
npm test        # dùng node --test (Node >= 20)
```

Chưa có biến môi trường thì API dùng `data/guests.sample.json` (hoặc `data/guests.local.json` nếu bạn tạo, file này không được commit)
và ghi RSVP vào `data/dev-store.json`. Link thử: `/t/my-linh-c3d4`. Mở `/` (không có slug) sẽ ra thiệp chung "Bạn thân mến", không có nút xác nhận.

## Cài đặt một lần

### 1. Google Sheet
Tạo Sheet mới với hai tab, hàng 1 là tiêu đề:

- Tab `Khach`: `slug | ho_ten | ten_goi | xung_ho | nhom | kenh_gui | da_gui | mo_lan_dau | link_chung` (cột A đến I).
  `link_chung`: để trống với khách riêng. Gõ `x` cho slug gửi vào group nhiều người (ví dụ group công ty):
  link đó vẫn chào đúng tên nhóm (`ten_goi` + `xung_ho`), nhưng không có nút xác nhận (nhiều người chung một
  link sẽ ghi đè nhau), thay vào đó là form lời chúc, mỗi lời chúc một dòng trong tab `LoiChuc`.
  Ví dụ dòng cho group công ty: `cty-dotb-x7k2 | Anh chị em DotB | DotB | anh chị | Công ty | Telegram | | | x`.
- Tab `XacNhan`: `slug | trang_thai | so_nguoi_di_cung | loi_nhan | cap_nhat_luc | gio_den` (cột A đến F).
  `gio_den` là khung giờ khách chọn: `Đợt 1 · 09:00–11:00`, `Đợt 2 · 12:30–13:30` hoặc `Cả hai đợt`
  (bắt buộc khi "Sẽ đến", để trống khi "Không đi được"). Sheet cũ chỉ cần thêm tiêu đề `gio_den` ở ô F1.
- Tab `LoiChuc`: `thoi_gian | loi_chuc | ky_ten | thiet_bi | ip | nguon` (cột A đến F). Lời chúc gửi từ link công
  khai (không có slug) hoặc link chung của nhóm. `nguon` là slug của link chung, trống là link công khai, để lọc
  lời chúc theo nhóm. Chữ ký không bắt buộc. Form báo rõ cho khách là có ghi thời gian, loại thiết bị và IP để
  chống spam. Mỗi máy (IP + trình duyệt) gửi tối đa 8 lời chúc trong 10 phút; cả văn phòng chung một IP vẫn gửi được.

Lời văn tự xưng **Hưng** (cấu hình `EVENT.graduateShort`). Cách gọi người nhận là `xung_ho + ten_goi`, dùng nhất quán
ở màn hình mở đầu, đầu thiệp, lời mời và các câu cá nhân hóa. Lời chào chung là "Trân trọng kính mời".

| `ten_goi` | `xung_ho` | Cách gọi trong câu |
| --- | --- | --- |
| Linh | chị | chị Linh |
| Mai | cô | cô Mai |
| Minh Anh | bạn | bạn Minh Anh |
| cô Mai và bác Vinh | *(trống)* | cô Mai và bác Vinh |
| Minh Anh | *(trống)* | Minh Anh |

`xung_ho` có thể tùy chỉnh. Ô trống dùng nguyên tên gọi, không tự thêm "bạn"; thiếu `ten_goi` thì dùng `ho_ten`.
Tên gọi đã có đúng danh xưng sẽ được giữ nguyên để tránh ghép trùng. "cả nhóm" / "anh em" dùng riêng xưng hô.
Thiệp chung không có slug dùng "Bạn thân mến" và xưng hô "bạn". Nhãn thao tác dùng văn trung tính.
Cột H do site tự ghi lần đầu khách mở thiệp.

### 2. Service account
1. Google Cloud Console → tạo project → bật **Google Sheets API**.
2. IAM → Service Accounts → tạo account → Keys → Add key → JSON.
3. Mở Sheet → Share → dán email của service account → quyền **Editor**.

### 3. Vercel
1. Import repo này (không cần framework, build command trống; `vercel.json` đã cấu hình `public/` và rewrite `/t/:slug`).
2. Settings → Environment Variables, thêm 3 biến (xem `.env.example`): `SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
3. Deploy, mở thử một link khách và bấm xác nhận, kiểm tra tab `XacNhan` có dòng mới.

### 4. Google Map (không bắt buộc)
Chưa có key thì khung bản đồ dùng link nhúng không cần key. Muốn dùng API chính thức:

1. Google Cloud Console → bật **Maps Embed API**.
2. Sửa key: Application restrictions chọn **Websites** và thêm tên miền của site, API restrictions chỉ chọn **Maps Embed API**. Key này lộ trong link iframe nên bắt buộc phải giới hạn.
3. Thêm biến `GOOGLE_MAPS_EMBED_KEY` trên Vercel rồi deploy lại.

## Thêm khách và tạo link

```bash
npm run guest -- "Đặng Thùy Dương" chị      # bỏ xưng hô thì dùng nguyên tên
npm run guest -- "cô Mai và bác Vinh"       # một thiệp mời chung hai người
npm run guest -- --file danh-sach.csv       # CSV, mỗi dòng: ho_ten,xung_ho,nhom,kenh_gui
BASE_URL=https://ten-mien-cua-ban.vercel.app npm run guest -- "Tên Khách" anh
```

Lệnh in ra các dòng (cách nhau bằng tab) để dán vào tab `Khach` từ ô A2, rồi danh sách link `tên → link` để gửi từng người.

Slug là hai từ cuối của tên (bỏ dấu) cộng 4 ký tự ngẫu nhiên, khó đoán nên không cần đăng nhập.
Nếu tự điền slug trong Sheet, dùng 3–64 ký tự gồm chữ cái không dấu (`a-z`, `A-Z`), chữ số và dấu `-`.
Slug phân biệt hoa/thường: ô A ghi `cM-bV` thì link là `/t/cM-bV`; giữ nguyên giá trị này khi gửi link và xác nhận RSVP.

## Sửa nội dung

Mọi chữ, giờ giấc, lộ trình, lưu ý nằm trong `public/src/config.js`. Mục ghi `CẦN ĐIỀN` còn thiếu thông tin thật:

- [ ] `EVENT.meetingPoint`: vị trí điểm hẹn trong trường
- [ ] `ROUTES` (ô tô): tên và địa chỉ bãi ô tô
- [ ] `MAP`: link ghim Google Maps của bãi chợ Gò Vấp, cổng sau (Lê Quang Định), cổng chính
- [ ] Vẽ lại sơ đồ SVG trong `public/index.html` theo ảnh bản đồ thật (giữ nguyên id các khối thì code không cần đổi)

## Nhạc nền

Đổi bài: chép file vào `public/media/` rồi sửa `MUSIC` trong `config.js`. Vào trang là nhạc thử tự phát; nếu trình duyệt chặn thì nhạc bắt đầu từ lần chạm, bấm hoặc gõ phím đầu tiên. Màn hình mở đầu dừng lại chờ khách chạm để mở thiệp nên nhạc thường bật đúng lúc này; khách không chạm thì thiệp tự mở sau 10 giây. Khách tắt bằng nút góc dưới bên phải và lựa chọn đó được nhớ lại.

## Lịch gửi thiệp

Nhắn "save the date" trước 5/11 → gửi thiệp chính thức 12/11 (xong chậm nhất 15/11) → hạn xác nhận 23/11 → nhắc lại 24/11.

## Cấu trúc

```
public/            site tĩnh (index.html, src/*.js, src/style.css)
api/               hàm serverless; _lib/ gồm validate, sheets, local, store
scripts/           dev.mjs (server dev), new-guest.mjs (tạo slug)
data/              guests.sample.json cho chạy local
test/              node --test
design/thiep.html  bản thiết kế đã chốt
```

## Ghi chú kỹ thuật

- API: `GET /api/guest?slug=` → `{name, short, call, shared?, rsvp|null}` hoặc 404 (`shared: true` với link chung, khi đó `POST /api/rsvp` trả 400 `shared_link`). `POST /api/rsvp` `{slug, status: yes|maybe|no, plusOnes: 0–5, arrival: dot1|dot2|ca-hai (bắt buộc khi yes), message ≤ 300}`, bắt buộc `Content-Type: application/json`. `POST /api/wish` `{message: 2–300 ký tự, name?: ≤ 60 ký tự, slug?: slug link chung}` (có ô bẫy bot `website`; server tự ghi thiết bị từ User-Agent và IP), cũng bắt buộc JSON.
- Danh sách khách cache 60 giây; gặp slug lạ thì đọc lại Sheet nếu cache cũ hơn 10 giây, nên thêm khách xong dùng link được gần như ngay.
- Mọi ghi vào Sheet dùng `valueInputOption=RAW` nên lời nhắn bắt đầu bằng `=` không bị chạy thành công thức.
- Header bảo mật và CSP nằm trong `vercel.json`. CSP chưa kiểm trên deploy thật: mở DevTools trên bản preview, nếu có lỗi chặn thì nới đúng chỗ đó.
