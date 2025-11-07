# Hướng dẫn Restart Server để áp dụng Gemini AI

## Các bước cần thực hiện:

### 1. Dừng server hiện tại (nếu đang chạy):
- Nhấn `Ctrl + C` trong terminal đang chạy server
- Hoặc đóng terminal đó

### 2. Kiểm tra file .env:
Đảm bảo file `.env` có nội dung:
```
AI_PROVIDER=gemini
GOOGLE_AI_API_KEY=AIzaSyA0K-VKBawZqOeAr3Uyq6KuK-Fi5MwxfkQ
PASSCODE=130398
PORT=3001
```

### 3. Rebuild và Start lại server:
```bash
cd merchant-interaction-tracking-be
npm run build
npm run start:dev
```

### 4. Kiểm tra log khi server start:
Bạn sẽ thấy log như sau nếu cấu hình đúng:
```
=== AI Configuration ===
AI_PROVIDER: gemini
GOOGLE_AI_API_KEY: AIzaSyA0K-VKBaw...
========================

[AIService] Initialized with provider: gemini
[AIService] Gemini API key present: true
[AIService] Gemini API key preview: AIzaSyA0K-VKBaw...
```

### 5. Test API endpoint:
Gọi endpoint sau (với JWT token):
```
GET http://localhost:3001/ai/config
```

Response mong đợi:
```json
{
  "provider": "gemini",
  "hasGeminiKey": true,
  "geminiKeyPreview": "AIzaSyA0K-VKB..."
}
```

### 6. Test Chatbox:
- Mở chatbox trong frontend
- Hỏi một câu hỏi
- Kiểm tra backend logs để xem:
  - `[AI Service] Using Google Gemini` → ✅ Đang dùng Gemini
  - `[AI Service] Using rule-based analysis` → ❌ Chưa dùng Gemini

## Nếu vẫn chưa hoạt động:

1. Kiểm tra file `.env` có trong thư mục `merchant-interaction-tracking-be/` không
2. Đảm bảo không có khoảng trắng thừa trong file `.env`
3. Kiểm tra log khi server start để xem có lỗi gì không
4. Thử xóa `node_modules` và `dist`, sau đó chạy lại:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   npm run start:dev
   ```

