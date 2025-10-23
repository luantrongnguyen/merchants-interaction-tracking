# 🚀 Hướng dẫn chạy ứng dụng Merchant Tracking với Google Sheets

## 📋 Yêu cầu hệ thống
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn
- Google Cloud Project với Google Sheets API enabled
- Service Account credentials

## 🔧 Cài đặt và chạy

### 1. Backend (NestJS API + Google Sheets)

```bash
# Di chuyển vào thư mục backend
cd "C:\Users\ADMIN\Desktop\New folder\merchant-interaction-tracking-be\merchant-tracking-be"

# Cài đặt dependencies (nếu chưa cài)
npm install

# Chạy backend
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:3001`

### 2. Frontend (React)

```bash
# Di chuyển vào thư mục frontend
cd "C:\Users\ADMIN\Desktop\New folder\merchant-interaction-tracking"

# Cài đặt dependencies (nếu chưa cài)
npm install

# Chạy frontend
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📊 Google Sheets Setup

### 1. Tạo Google Sheets
- Tạo Google Sheets mới với tên "Merchant Tracking"
- Đặt tên sheet đầu tiên là "Merchants"
- Tạo header row với các cột:
  - A: Tên
  - B: Địa chỉ
  - C: Tên đường
  - D: Khu vực
  - E: Tỉnh/Thành phố
  - F: Mã bưu điện
  - G: Ngày tương tác cuối
  - H: Nền tảng

### 2. Cấu hình Service Account
- Tạo Service Account trong Google Cloud Console
- Tải file credentials JSON
- Đặt file `google-credentials.json` trong thư mục backend
- Share Google Sheets với email của Service Account

### 3. Cấu hình Spreadsheet ID
- Copy Spreadsheet ID từ URL Google Sheets
- Cập nhật trong `src/config/app.config.ts`:
  ```typescript
  export const appConfig = {
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',
    googleCredentialsPath: './google-credentials.json',
    port: 3001,
  };
  ```

## 🔗 API Endpoints

- `GET /merchants` - Lấy danh sách merchant từ Google Sheets
- `GET /merchants/:id` - Lấy merchant theo ID
- `POST /merchants` - Tạo merchant mới trong Google Sheets
- `PATCH /merchants/:id` - Cập nhật merchant trong Google Sheets
- `DELETE /merchants/:id` - Xóa merchant khỏi Google Sheets

## 🔐 Bảo mật

- Mã xác thực: `291100`
- Yêu cầu nhập mã khi thêm, sửa, xóa merchant
- Google Sheets API authentication qua Service Account

## 🎯 Tính năng

- ✅ Quản lý merchant (CRUD) với Google Sheets
- ✅ Badge trạng thái theo ngày tương tác
- ✅ Giao diện responsive
- ✅ Xác thực bảo mật cho CUD operations
- ✅ Đồng bộ dữ liệu với Google Sheets

## 🚨 Lưu ý

1. **Chạy backend trước** - Frontend cần backend API để hoạt động
2. **CORS đã được cấu hình** - Backend cho phép frontend localhost:3000
3. **Google Sheets permissions** - Service Account cần quyền edit Google Sheets
4. **Port mặc định**: Backend (3001), Frontend (3000)

## 🐛 Troubleshooting

### Lỗi kết nối Google Sheets
- Kiểm tra file `google-credentials.json` có đúng không
- Kiểm tra Service Account có quyền truy cập Google Sheets
- Kiểm tra Spreadsheet ID có đúng không

### Lỗi kết nối API
- Kiểm tra backend có chạy tại port 3001 không
- Kiểm tra CORS configuration trong main.ts

### Lỗi frontend
- Kiểm tra console browser để xem lỗi chi tiết
- Đảm bảo backend đang chạy trước khi mở frontend

## 📈 Google Sheets Format

Ứng dụng mong đợi Google Sheets có cấu trúc:
- **Cột A**: Tên merchant
- **Cột B**: Địa chỉ đầy đủ
- **Cột C**: Tên đường
- **Cột D**: Khu vực
- **Cột E**: Tỉnh/Thành phố
- **Cột F**: Mã bưu điện
- **Cột G**: Ngày tương tác cuối (YYYY-MM-DD)
- **Cột H**: Nền tảng

## 🔄 Workflow

1. **Thêm merchant**: Dữ liệu được lưu vào Google Sheets
2. **Cập nhật merchant**: Dữ liệu được cập nhật trong Google Sheets
3. **Xóa merchant**: Dữ liệu được xóa khỏi Google Sheets
4. **Xem danh sách**: Dữ liệu được đọc từ Google Sheets
