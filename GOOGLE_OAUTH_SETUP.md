# Hướng dẫn thiết lập Google OAuth Authentication

## 1. Tạo Google OAuth Credentials

### Bước 1: Truy cập Google Cloud Console
1. Đi tới [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Kích hoạt Google Sheets API và Google+ API

### Bước 2: Tạo OAuth 2.0 Credentials
1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Chọn **Web application**
4. Thêm **Authorized JavaScript origins**:
   - `http://localhost:3000` (cho development)
   - `https://yourdomain.com` (cho production)
5. Thêm **Authorized redirect URIs**:
   - `http://localhost:3000` (cho development)
   - `https://yourdomain.com` (cho production)

### Bước 3: Lấy Client ID
1. Copy **Client ID** từ credentials vừa tạo
2. Thêm vào file `.env` trong thư mục frontend:
```
REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here
```

## 2. Thiết lập Google Sheets cho Authorized Emails

### Bước 1: Tạo sheet mới
1. Mở Google Sheets của bạn
2. Tạo sheet mới tên **AuthorizedEmails**
3. Thêm header **Email** vào cột A
4. Thêm các email có domain **@mangoforsalon.com** được cấp quyền vào cột A (mỗi email một dòng)

### Bước 2: Cấp quyền truy cập
1. Chia sẻ Google Sheets với service account email
2. Đảm bảo service account có quyền **Editor**

**Lưu ý quan trọng:** Chỉ các email có domain `@mangoforsalon.com` mới được phép truy cập hệ thống.

## 3. Cấu hình Backend

### Bước 1: Tạo file .env
Tạo file `.env` trong thư mục `merchant-interaction-tracking-be`:

```env
# Google Sheets Configuration
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
SPREADSHEET_ID=your-spreadsheet-id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Bước 2: Cài đặt dependencies
```bash
cd merchant-interaction-tracking-be
npm install
```

### Bước 3: Chạy backend
```bash
npm run start:dev
```

## 4. Cấu hình Frontend

### Bước 1: Tạo file .env
Tạo file `.env` trong thư mục gốc:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here
REACT_APP_API_BASE_URL=http://localhost:3001
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Chạy frontend
```bash
npm start
```

## 5. Kiểm tra hoạt động

1. Mở trình duyệt và truy cập `http://localhost:3000`
2. Click **Đăng nhập với Google**
3. Chọn tài khoản Google
4. Nếu email của bạn có trong danh sách **AuthorizedEmails**, bạn sẽ được đăng nhập thành công
5. Nếu không, bạn sẽ thấy thông báo "Email không được cấp quyền truy cập"

## 6. Troubleshooting

### Lỗi thường gặp:

1. **"Invalid client"**: Kiểm tra lại Client ID trong .env
2. **"Unauthorized"**: Kiểm tra email có trong sheet AuthorizedEmails không
3. **"CORS error"**: Đảm bảo backend đã cấu hình CORS đúng
4. **"Google Sheets API error"**: Kiểm tra service account credentials và quyền truy cập

### Debug:
- Kiểm tra console browser để xem lỗi frontend
- Kiểm tra logs backend để xem lỗi server
- Đảm bảo tất cả environment variables đã được set đúng
