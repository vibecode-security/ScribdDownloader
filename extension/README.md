# Scribd PDF Downloader - Chrome Extension (Manifest V3)

Extension giúp tự động hóa 100% quy trình tải file PDF từ Scribd mà không cần tài khoản VIP hay đăng nhập.

---

## 🚀 Cách cài đặt vào Chrome / Cốc Cốc / Edge / Brave (15 giây)

1. Mở trình duyệt Chrome và truy cập vào đường dẫn:
   ```
   chrome://extensions
   ```
   *(Với Edge là `edge://extensions`, Cốc Cốc là `coccoc://extensions`)*
2. Bật công tắc **"Developer mode" (Chế độ dành cho nhà phát triển)** ở góc trên bên phải.
3. Bấm vào nút **"Load unpacked" (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn thư mục `extension` nằm trong thư mục dự án này:
   ```
   C:\Users\ASUS\Desktop\ScribdDownloader\extension
   ```
5. Xong! Biểu tượng tiện ích **Scribd Downloader** đã xuất hiện trên thanh công cụ trình duyệt.

---

## 🎯 Cách sử dụng

### Cách 1: Khi đang xem tài liệu bất kỳ trên Scribd
1. Mở trang tài liệu Scribd bất kỳ (`https://www.scribd.com/document/...`).
2. Bấm vào icon extension trên thanh công cụ trình duyệt -> Bấm **"Mở Embed & Chuẩn bị tải"**.
3. Tiện ích sẽ tự chuyển sang trang Embed và hiển thị bảng điều khiển nổi ở góc phải bên dưới màn hình.
4. Bấm **"🚀 Tải PDF ngay"**:
   - Extension sẽ tự động cuộn qua từng trang để nạp toàn bộ ảnh, text layer và SVG (chống lỗi trang trắng).
   - Tự động xóa class `document_scroller`, gỡ bỏ các toolbar che khuất.
   - Tự động tối ưu định dạng trang in và mở hộp thoại in của trình duyệt.
5. Trong hộp thoại in:
   - **Máy in (Destination):** Chọn **"Lưu dưới dạng PDF" (Save as PDF)**.
   - Bỏ chọn **"Đầu trang và chân trang" (Headers and footers)**.
   - Bấm **Lưu (Save)**.

### Cách 2: Dán trực tiếp link
- Bấm vào icon extension, dán link hoặc ID tài liệu vào ô nhập liệu -> Bấm **"Mở link & Tải"**.
