# 🔧 Khắc phục lỗi CORS

## 🚨 Lỗi CORS thường gặp

### 1. **"Access to fetch at 'URL' from origin 'URL' has been blocked by CORS policy"**

### 2. **"No 'Access-Control-Allow-Origin' header is present"**

## 🛠️ Các bước khắc phục

### **Bước 1: Kiểm tra CORS Configuration Backend**

Đảm bảo `main.ts` có cấu hình CORS đúng:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://luantrongnguyen.github.io',
    'https://luantrongnguyen.github.io/merchants-interaction-tracking',
    'https://luannguyentrong-mango.phuhoangcar.com'
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
});
```

### **Bước 2: Kiểm tra Frontend Request**

Đảm bảo frontend gửi request với CORS headers:

```typescript
const requestOptions: RequestInit = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include',
  mode: 'cors',
};
```

### **Bước 3: Kiểm tra Network Tab**

1. Mở **Developer Tools** (F12)
2. Vào tab **Network**
3. Thực hiện request
4. Kiểm tra:
   - **Request Headers**: Có `Origin` header không?
   - **Response Headers**: Có `Access-Control-Allow-Origin` không?
   - **Status**: Có phải 200/201 không?

### **Bước 4: Kiểm tra Preflight Request**

CORS thường gửi **OPTIONS** request trước:
- Kiểm tra có OPTIONS request không?
- Status code của OPTIONS request?
- Response headers của OPTIONS request?

## 🔍 Debug CORS

### **1. Kiểm tra Console Logs**

```javascript
// Thêm vào frontend để debug
console.log('Request URL:', url);
console.log('Request Options:', requestOptions);
console.log('Response:', response);
```

### **2. Kiểm tra Backend Logs**

```bash
# Chạy backend với debug logs
npm run start:dev
```

### **3. Test CORS với curl**

```bash
# Test OPTIONS request
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v \
  https://luannguyentrong-mango.phuhoangcar.com/merchants
```

## 🚀 Giải pháp nhanh

### **1. Restart Backend**
```bash
cd merchant-interaction-tracking-be
npm run start:dev
```

### **2. Clear Browser Cache**
- Hard refresh: `Ctrl + Shift + R`
- Clear cache: `Ctrl + Shift + Delete`

### **3. Kiểm tra Environment Variables**
```bash
# Backend
echo $PORT
echo $NODE_ENV

# Frontend
echo $REACT_APP_API_BASE_URL
```

## 📋 Checklist CORS

- ✅ **Backend CORS**: Đã cấu hình đúng origins
- ✅ **Frontend Request**: Có `mode: 'cors'` và `credentials: 'include'`
- ✅ **Headers**: Có đầy đủ required headers
- ✅ **Methods**: Có OPTIONS method
- ✅ **Network**: Không có lỗi trong Network tab
- ✅ **Console**: Không có CORS error trong Console

## 🆘 Nếu vẫn lỗi

1. **Kiểm tra URL**: Đảm bảo URL backend đúng
2. **Kiểm tra SSL**: HTTPS vs HTTP
3. **Kiểm tra Port**: Port có đúng không?
4. **Kiểm tra Firewall**: Có bị chặn không?
5. **Kiểm tra DNS**: Domain có resolve đúng không?

## 📞 Liên hệ

Nếu vẫn gặp lỗi, hãy cung cấp:
- Screenshot lỗi CORS
- Network tab logs
- Backend console logs
- Browser console logs
