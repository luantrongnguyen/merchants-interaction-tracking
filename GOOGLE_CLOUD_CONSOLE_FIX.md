# 🔧 Google Cloud Console Fix - Sửa lỗi Origin không được phép

## 🚨 Lỗi gặp phải

```
403 (Forbidden) - The given origin is not allowed for the given client ID
```

## 🔍 Nguyên nhân

**Google OAuth Client ID** chưa được cấu hình đúng **Authorized JavaScript origins** trong Google Cloud Console.

## ✅ Giải pháp

### 1. **Truy cập Google Cloud Console**

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** → **Credentials**

### 2. **Cấu hình OAuth Client**

1. **Tìm OAuth 2.0 Client ID** của bạn
2. **Click Edit** (icon bút chì)
3. **Thêm Authorized JavaScript origins:**

```
http://localhost:3000
http://localhost:3001
http://localhost:3002
https://your-domain.com
https://luannguyentrong-mango.phuhoangcar.com
```

### 3. **Cấu hình Authorized redirect URIs**

```
http://localhost:3000
http://localhost:3001
http://localhost:3002
https://your-domain.com
https://luannguyentrong-mango.phuhoangcar.com
```

### 4. **Cấu hình OAuth consent screen**

1. Vào **OAuth consent screen**
2. **Thêm Test users:**
   ```
   brian.nguyen@mangoforsalon.com
   admin@mangoforsalon.com
   ```
3. **Publishing status:** Testing (hoặc Production nếu cần)

## 🎯 Cấu hình chi tiết

### **Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:3001
http://localhost:3002
https://luannguyentrong-mango.phuhoangcar.com
https://your-production-domain.com
```

### **Authorized redirect URIs:**
```
http://localhost:3000
http://localhost:3001
http://localhost:3002
https://luannguyentrong-mango.phuhoangcar.com
https://your-production-domain.com
```

### **OAuth consent screen:**
- **User Type:** External
- **App name:** Merchant Interaction Tracking
- **User support email:** your-email@mangoforsalon.com
- **Developer contact:** your-email@mangoforsalon.com
- **Scopes:** email, profile, openid
- **Test users:** brian.nguyen@mangoforsalon.com

## 🧪 Test sau khi cấu hình

### **Test 1: Local Development**
1. **Start frontend:** `npm start`
2. **Open:** `http://localhost:3000`
3. **Click:** "Đăng nhập với Google"
4. **Kiểm tra:** Không có 403 error

### **Test 2: Production**
1. **Deploy** lên production domain
2. **Open** production URL
3. **Click:** "Đăng nhập với Google"
4. **Kiểm tra:** Login thành công

## 📝 Notes

- **Client ID** phải match với `CONFIG.GOOGLE_CLIENT_ID`
- **Origins** phải match với domain thực tế
- **Test users** phải có domain `@mangoforsalon.com`
- **Publishing status** phải là Testing hoặc Production

## 🚀 Kết quả

Sau khi cấu hình đúng:
- ✅ **Không còn 403 Forbidden**
- ✅ **Google Auth hoạt động bình thường**
- ✅ **FedCM enabled** (theo yêu cầu của Google)
- ✅ **Login thành công** với email `@mangoforsalon.com`

## 🔗 Links hữu ích

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [FedCM Migration Guide](https://developers.google.com/identity/gsi/web/guides/fedcm-migration)

