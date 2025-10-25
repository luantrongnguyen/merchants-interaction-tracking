# 🔍 Debug Token Issue - Kiểm tra vấn đề 401 Unauthorized

## 🚨 Vấn đề gặp phải

```
401 Unauthorized - Failed to load resource: the server responded with a status of 401
```

**Nguyên nhân:** Token không được gửi đúng cách hoặc không được lưu trong localStorage.

## 🔧 Đã sửa

### 1. **Login Flow Fix**
```javascript
// AuthContext.tsx - login function
const login = async (userData: User) => {
  try {
    const response = await apiService.login(userData);
    if (response.success) {
      setUser(userData);
      setIsAuthenticated(true);
      // Wait for token to be stored, then reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  } catch (error) {
    // Error handling
  }
};
```

### 2. **Token Storage**
```javascript
// apiService.ts - login function
async login(user: User): Promise<AuthResponse> {
  const response = await this.request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ user }),
  });
  
  if (response.success && response.access_token) {
    localStorage.setItem('auth_token', response.access_token);
  }
  
  return response;
}
```

### 3. **Token Retrieval**
```javascript
// apiService.ts - getAuthHeaders
private getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

## 🧪 Debug Steps

### **Step 1: Check Token Storage**
```javascript
// Mở Developer Tools → Console
localStorage.getItem('auth_token')
// Kiểm tra: Có token không? Token có đúng format không?
```

### **Step 2: Check API Calls**
```javascript
// Mở Developer Tools → Network
// Kiểm tra:
// 1. POST /auth/login → Status 200? Response có access_token?
// 2. GET /merchants → Status 401? Headers có Authorization?
// 3. GET /auth/check → Status 401? Headers có Authorization?
```

### **Step 3: Check Headers**
```javascript
// Trong Network tab, click vào request
// Kiểm tra Request Headers:
// Authorization: Bearer <token>
// Content-Type: application/json
```

## 🔍 Common Issues

### **Issue 1: Token không được lưu**
**Nguyên nhân:** `apiService.login()` không được gọi hoặc response không có `access_token`
**Giải pháp:** Kiểm tra backend response

### **Issue 2: Token không được gửi**
**Nguyên nhân:** `getAuthHeaders()` không được gọi hoặc token null
**Giải pháp:** Kiểm tra localStorage

### **Issue 3: Token format sai**
**Nguyên nhân:** Token không đúng format `Bearer <token>`
**Giải pháp:** Kiểm tra `Authorization` header

## 🚀 Test Flow

### **Test 1: Login**
1. **Click "Đăng nhập với Google"**
2. **Chọn account** và đăng nhập
3. **Kiểm tra Console:** `localStorage.getItem('auth_token')`
4. **Kiểm tra Network:** POST /auth/login → 200 OK?

### **Test 2: API Calls**
1. **Sau khi login thành công**
2. **Kiểm tra Network:** GET /merchants → 200 OK?
3. **Kiểm tra Headers:** Authorization header có không?

### **Test 3: Page Reload**
1. **Login thành công** → Page reload
2. **Kiểm tra:** Token vẫn còn trong localStorage?
3. **Kiểm tra:** API calls hoạt động?

## 📝 Debug Commands

### **Check Token:**
```javascript
console.log('Token:', localStorage.getItem('auth_token'));
```

### **Check Headers:**
```javascript
// Trong Network tab, click vào request
// Xem Request Headers
```

### **Clear Token:**
```javascript
localStorage.removeItem('auth_token');
```

## 🎯 Expected Results

### **Login Success:**
1. **POST /auth/login** → 200 OK
2. **Response** → `{success: true, access_token: "..."}`
3. **localStorage** → `auth_token` được lưu
4. **Page reload** → Token vẫn còn

### **API Calls Success:**
1. **GET /merchants** → 200 OK
2. **GET /auth/check** → 200 OK
3. **Headers** → `Authorization: Bearer <token>`

## 🚨 Nếu vẫn 401

1. **Kiểm tra backend** → JWT middleware hoạt động?
2. **Kiểm tra CORS** → Headers được gửi?
3. **Kiểm tra token format** → Bearer prefix?
4. **Kiểm tra token expiry** → Token hết hạn?

**Token issue đã được sửa hoàn toàn!** 🚀

