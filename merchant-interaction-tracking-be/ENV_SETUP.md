# Environment Variables Setup

## AI Configuration

Để sử dụng Google Gemini AI, tạo file `.env` trong thư mục `merchant-interaction-tracking-be` với nội dung:

```env
# AI Provider Configuration
AI_PROVIDER=gemini
GOOGLE_AI_API_KEY=AIzaSyA0K-VKBawZqOeAr3Uyq6KuK-Fi5MwxfkQ

# Other configurations
PASSCODE=130398
PORT=3001
```

## Các AI Providers được hỗ trợ:

### 1. Google Gemini (Miễn phí - Khuyến nghị)
```env
AI_PROVIDER=gemini
GOOGLE_AI_API_KEY=your-api-key-here
```

### 2. OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
```

### 3. Anthropic Claude
```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-api-key-here
```

### 4. Rule-based (Mặc định - Không cần API key)
```env
AI_PROVIDER=rule-based
```

## Lưu ý:

1. File `.env` không được commit vào git (đã có trong .gitignore)
2. Restart backend server sau khi thay đổi .env
3. Nếu không có file .env, hệ thống sẽ sử dụng rule-based analysis

