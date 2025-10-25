# 🔍 Debug Authentication - Kiểm tra lỗi 401

## 🚨 Vấn đề hiện tại

- ✅ Login thành công
- ❌ API merchants bị 401 Unauthorized
- ❌ JWT token không được gửi đúng cách

## 🔧 Đã sửa

### 1. **AuthContext.tsx**
- ✅ Lưu `access_token` vào localStorage khi login
- ✅ Xóa token khi logout
- ✅ Đảm bảo token có sẵn khi checkAuth

### 2. **apiService.ts**
- ✅ Cải thiện `getAuthHeaders()` để gửi token đúng cách
- ✅ Kiểm tra token trước khi gửi Authorization header

## 🧪 Test Steps

### **Bước 1: Kiểm tra localStorage**
```javascript
// Mở Developer Tools → Console
console.log('Auth token:', localStorage.getItem('auth_token'));
```

### **Bước 2: Kiểm tra Network Headers**
1. Mở **Developer Tools** → **Network**
2. Thực hiện request đến `/merchants`
3. Kiểm tra **Request Headers**:
   - Có `Authorization: Bearer <token>` không?
   - Token có đúng format không?

### **Bước 3: Kiểm tra Backend Logs**
- Backend có nhận được token không?
- JWT validation có thành công không?
- Có lỗi gì trong backend logs không?

## 🔍 Debug Commands

### **Frontend Debug:**
```javascript
// Kiểm tra token
localStorage.getItem('auth_token')

// Kiểm tra user state
// Trong React DevTools → Components → AuthProvider
```

### **Backend Debug:**
```bash
# Kiểm tra JWT secret
echo $JWT_SECRET

# Kiểm tra backend logs
# Xem có lỗi JWT validation không
```

## 🎯 Expected Results

### **Sau khi login:**
1. `localStorage.getItem('auth_token')` → Có token
2. Network request có `Authorization: Bearer <token>`
3. Backend nhận được token và validate thành công
4. API merchants trả về 200 OK

### **Nếu vẫn 401:**
1. Kiểm tra JWT secret có đúng không
2. Kiểm tra token format
3. Kiểm tra backend CORS headers
4. Kiểm tra JWT expiration

## 🚀 Next Steps

1. **Test login** với email `@mangoforsalon.com`
2. **Kiểm tra localStorage** có token không
3. **Kiểm tra Network tab** có Authorization header không
4. **Kiểm tra backend logs** có nhận được token không

Nếu vẫn lỗi, cần kiểm tra backend JWT configuration!

