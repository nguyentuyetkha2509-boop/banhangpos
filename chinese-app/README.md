# Học Tiếng Trung

App học tiếng Trung (HSK1) - chạy như mobile web app (PWA), tách biệt hoàn toàn với app `banhangpos` trong cùng repo.

## Tính năng

- **Bài học theo HSK1**: 150 từ vựng chuẩn HSK1, chia 15 bài, mỗi bài kèm quiz trắc nghiệm cuối bài.
- **Flashcard + Spaced Repetition (SRS)**: ôn từ theo thuật toán lặp lại ngắt quãng kiểu SM-2, tự tính lịch ôn dựa trên mức độ nhớ bạn tự đánh giá (Lại / Khó / Ổn / Dễ).
- **Phát âm & thanh điệu**: nghe phát âm chuẩn (Web Speech API - giọng zh-CN), luyện phân biệt 4 thanh điệu, ghi âm giọng mình để tự so sánh.
- **Viết chữ Hán**: xem hoạt hình thứ tự nét (dùng thư viện `hanzi-writer`) và tự viết thử để kiểm tra.

Toàn bộ tiến độ lưu trong `localStorage` của trình duyệt - không cần backend, không cần đăng nhập.

## Chạy thử

```bash
cd chinese-app
npm install
npm run dev
```

Mở địa chỉ hiển thị trong terminal bằng trình duyệt điện thoại (cùng mạng wifi) hoặc trình duyệt máy tính ở chế độ giả lập mobile.

> Lưu ý: tính năng đọc phát âm cần trình duyệt hỗ trợ Web Speech API và có sẵn giọng đọc tiếng Trung (zh-CN) - Chrome/Edge trên máy tính và hầu hết trình duyệt di động đều hỗ trợ. Tính năng ghi âm cần cấp quyền micro và chạy trên HTTPS (hoặc localhost).

## Build production

```bash
npm run build
npm run preview
```
