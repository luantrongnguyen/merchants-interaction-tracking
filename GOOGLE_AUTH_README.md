# 🔐 Google OAuth Authentication - Hướng dẫn hoàn chỉnh

## Tổng quan

Dự án đã được tích hợp tính năng đăng nhập với Google OAuth và kiểm soát quyền truy cập dựa trên danh sách email được cấp quyền trong Google Sheets.

## ✨ Tính năng mới

- **🔑 Đăng nhập với Google**: Sử dụng Google Identity Services
- **📧 Kiểm soát quyền truy cập**: Chỉ email có trong Google Sheets mới được truy cập
- **🛡️ Bảo mật API**: Tất cả API endpoints được bảo vệ bằng JWT
- **🎨 UI hiện đại**: Giao diện đăng nhập/đăng xuất thân thiện

## 🚀 Cài đặt và chạy

### 1. Backend Setup

```bash
cd merchant-interaction-tracking-be
npm install
```

Tạo file `.env`:
```env
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
SPREADSHEET_ID=your-spreadsheet-id
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

Chạy backend:
```bash
npm run start:dev
```

### 2. Frontend Setup

```bash
cd ..
npm install
```

Tạo file `.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_API_BASE_URL=http://localhost:3001
```

Chạy frontend:
```bash
npm start
```

## 📋 Cấu hình Google OAuth

### Bước 1: Tạo OAuth Credentials
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo OAuth 2.0 Client ID
3. Thêm authorized origins: `http://localhost:3000`
4. Copy Client ID vào file `.env`

### Bước 2: Thiết lập Google Sheets
1. Tạo sheet mới tên **AuthorizedEmails**
2. Thêm email được cấp quyền vào cột A
3. Chia sẻ sheet với service account

## 🔧 Cấu trúc dự án

### Frontend Components
- `GoogleAuth.tsx` - Component đăng nhập Google
- `ProtectedRoute.tsx` - Bảo vệ routes
- `AuthContext.tsx` - Quản lý trạng thái authentication

### Backend Modules
- `auth/` - Authentication module
- `google-sheets/` - Google Sheets integration
- JWT middleware và guards

## 🛡️ Bảo mật

- **JWT Tokens**: Xác thực API requests
- **Email Whitelist**: Kiểm tra email trong Google Sheets
- **CORS**: Cấu hình CORS cho cross-origin requests
- **Route Protection**: Bảo vệ tất cả API endpoints

## 📱 Sử dụng

1. Truy cập ứng dụng
2. Click "Đăng nhập với Google"
3. Chọn tài khoản Google
4. Nếu email có trong danh sách → Đăng nhập thành công
5. Nếu không → Hiển thị thông báo từ chối

## 🔍 Troubleshooting

### Lỗi thường gặp:

1. **"Invalid client"**: Kiểm tra REACT_APP_GOOGLE_CLIENT_ID
2. **"Unauthorized"**: Kiểm tra email trong sheet AuthorizedEmails
3. **"CORS error"**: Kiểm tra cấu hình CORS backend
4. **"Google Sheets API error"**: Kiểm tra service account credentials

### Debug:
- Mở Developer Tools → Console
- Kiểm tra Network tab cho API calls
- Xem logs backend trong terminal

## 📚 Tài liệu tham khảo

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Google Sheets API](https://developers.google.com/sheets/api)

## 🎯 Kết quả

Sau khi cài đặt, ứng dụng sẽ có:
- ✅ Đăng nhập Google OAuth
- ✅ Kiểm soát quyền truy cập theo email
- ✅ Bảo mật API endpoints
- ✅ UI/UX hiện đại và thân thiện

