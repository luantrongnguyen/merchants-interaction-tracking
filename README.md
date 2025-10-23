# 📊 Merchant Interaction Tracking App

Ứng dụng web để theo dõi tương tác với các merchant, kết nối với Google Sheets để lưu trữ dữ liệu.

## ✨ Tính năng

- **Quản lý Merchant**: Thêm, sửa, xóa thông tin merchant
- **Theo dõi tương tác**: Hiển thị ngày tương tác cuối cùng và trạng thái
- **Badge trạng thái**: 
  - 🟢 Xanh lá: < 7 ngày
  - 🟠 Cam: 7-14 ngày  
  - 🔴 Đỏ: > 14 ngày
- **Bảo mật**: Yêu cầu mã xác thực (291100) cho các thao tác CUD
- **Kết nối Google Sheets**: Đồng bộ dữ liệu với Google Sheets

## 🚀 Cài đặt và chạy

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình Google Sheets:**
   - Đảm bảo file `google-credentials.json` có trong thư mục gốc
   - Cập nhật `SPREADSHEET_ID` trong `src/config.ts` nếu cần

3. **Chạy ứng dụng:**
   ```bash
   npm start
   ```

4. **Truy cập ứng dụng:**
   - Mở trình duyệt và truy cập `http://localhost:3000`

## 📋 Cấu trúc dữ liệu Merchant

Mỗi merchant bao gồm:
- **Tên**: Tên merchant
- **Địa chỉ**: Địa chỉ đầy đủ
- **Tên đường**: Tên đường cụ thể
- **Khu vực**: Khu vực/Phường
- **Tỉnh/Thành phố**: Tỉnh hoặc thành phố
- **Mã bưu điện**: Zip code
- **Ngày tương tác cuối**: Ngày tương tác gần nhất
- **Nền tảng**: Facebook, Instagram, TikTok, Shopee, Lazada, Website, Khác

## 🔐 Bảo mật

- Mã xác thực mặc định: `291100`
- Có thể thay đổi trong file `src/config.ts`
- Yêu cầu nhập mã khi thêm, sửa, xóa merchant

## 🛠️ Công nghệ sử dụng

- **React 19** với TypeScript
- **Google Sheets API** để lưu trữ dữ liệu
- **CSS3** với responsive design
- **Google Auth** để xác thực

## 📱 Responsive Design

Ứng dụng được thiết kế responsive, hoạt động tốt trên:
- Desktop
- Tablet  
- Mobile

## 🔧 Cấu hình

Các cấu hình có thể thay đổi trong `src/config.ts`:
- `SPREADSHEET_ID`: ID của Google Sheets
- `GOOGLE_CREDENTIALS_PATH`: Đường dẫn file credentials
- `PASSSCODE`: Mã xác thực cho CUD operations

## 📊 Google Sheets Format

Ứng dụng mong đợi Google Sheets có cấu trúc:
- **Cột A**: Tên merchant
- **Cột B**: Địa chỉ đầy đủ
- **Cột C**: Tên đường
- **Cột D**: Khu vực
- **Cột E**: Tỉnh/Thành phố
- **Cột F**: Mã bưu điện
- **Cột G**: Ngày tương tác cuối (YYYY-MM-DD)
- **Cột H**: Nền tảng

## 🚨 Lưu ý

- Đảm bảo Google Sheets có quyền truy cập cho service account
- File credentials phải được bảo mật
- Kiểm tra kết nối internet khi sử dụng