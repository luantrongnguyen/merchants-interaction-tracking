# 🚀 Hướng dẫn chạy ứng dụng Merchant Tracking

## 📋 Yêu cầu hệ thống
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

## 🔧 Cài đặt và chạy

### 1. Backend (NestJS API)

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

## 🗄️ Database

Ứng dụng sử dụng SQLite database tự động tạo file `merchant_tracking.db` trong thư mục backend.

## 🔗 API Endpoints

- `GET /merchants` - Lấy danh sách merchant
- `GET /merchants/:id` - Lấy merchant theo ID
- `POST /merchants` - Tạo merchant mới
- `PATCH /merchants/:id` - Cập nhật merchant
- `DELETE /merchants/:id` - Xóa merchant

## 🔐 Bảo mật

- Mã xác thực: `291100`
- Yêu cầu nhập mã khi thêm, sửa, xóa merchant

## 🎯 Tính năng

- ✅ Quản lý merchant (CRUD)
- ✅ Badge trạng thái theo ngày tương tác
- ✅ Giao diện responsive
- ✅ Xác thực bảo mật cho CUD operations
- ✅ Kết nối API backend

## 🚨 Lưu ý

1. **Chạy backend trước** - Frontend cần backend API để hoạt động
2. **CORS đã được cấu hình** - Backend cho phép frontend localhost:3000
3. **Database tự động tạo** - Không cần cấu hình thêm
4. **Port mặc định**: Backend (3001), Frontend (3000)

## 🐛 Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend có chạy tại port 3001 không
- Kiểm tra CORS configuration trong main.ts

### Lỗi database
- Xóa file `merchant_tracking.db` để tạo lại database
- Kiểm tra quyền ghi file trong thư mục backend

### Lỗi frontend
- Kiểm tra console browser để xem lỗi chi tiết
- Đảm bảo backend đang chạy trước khi mở frontend
