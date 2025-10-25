# Hướng dẫn cấu hình Environment Variables

## Frontend (.env)

Tạo file `.env` trong thư mục gốc của project với nội dung:

```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here

# API Configuration  
REACT_APP_API_BASE_URL=http://localhost:3001
```

## Backend (.env)

Tạo file `.env` trong thư mục `merchant-interaction-tracking-be` với nội dung:

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

## Lưu ý quan trọng:

1. **REACT_APP_GOOGLE_CLIENT_ID**: Lấy từ Google Cloud Console OAuth credentials
2. **SPREADSHEET_ID**: ID của Google Sheets chứa dữ liệu merchants
3. **JWT_SECRET**: Chuỗi bí mật để ký JWT tokens (nên dùng chuỗi dài và phức tạp)
4. **GOOGLE_CREDENTIALS_PATH**: Đường dẫn đến file service account credentials

## Cách lấy Google Client ID:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Tạo **OAuth 2.0 Client ID** nếu chưa có
5. Copy **Client ID** và paste vào file .env

## Cách lấy Spreadsheet ID:

1. Mở Google Sheets của bạn
2. URL sẽ có dạng: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy phần `SPREADSHEET_ID` từ URL

