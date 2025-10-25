# 🔍 Debug Issues - Kiểm tra vấn đề API và UI

## 🚨 Vấn đề hiện tại

1. **API gọi thành công nhưng chưa xóa trên merchant list** - Phải refresh lại
2. **Login thành công nhưng chưa refresh call API lại**

## 🔧 Đã sửa

### 1. **Delete Merchant Issue**

**Vấn đề:** API delete thành công nhưng UI không cập nhật

**Đã sửa:**
- ✅ `handlePasscodeSuccess()` - Đóng modal sau khi thành công
- ✅ `deleteMerchant()` - Force reload merchants list
- ✅ Clear error state khi thành công

### 2. **Login Refresh Issue**

**Vấn đề:** Login thành công nhưng không refresh merchant list

**Đã sửa:**
- ✅ `login()` - Thêm `window.location.reload()` ngay lập tức
- ✅ Page reload để refresh merchant list

## 🧪 Test Steps

### **Test Delete:**
1. **Login** với email `@mangoforsalon.com`
2. **Click Delete** trên một merchant
3. **Nhập passcode** và confirm
4. **Kiểm tra:** Merchant có bị xóa khỏi list không?
5. **Kiểm tra:** Modal có đóng không?

### **Test Login:**
1. **Logout** (clear localStorage)
2. **Login** với email `@mangoforsalon.com`
3. **Kiểm tra:** Page có reload không?
4. **Kiểm tra:** Merchant list có load không?

## 🔍 Debug Commands

### **Frontend Debug:**
```javascript
// Kiểm tra token
localStorage.getItem('auth_token')

// Kiểm tra merchants state
// Trong React DevTools → Components → App
```

### **Network Debug:**
1. **Mở Developer Tools** → **Network**
2. **Thực hiện delete** → Kiểm tra DELETE request
3. **Kiểm tra response** → Status 200?
4. **Thực hiện login** → Kiểm tra POST /auth/login
5. **Kiểm tra GET /merchants** → Có được gọi không?

## 🎯 Expected Results

### **Delete Success:**
1. DELETE request → 200 OK
2. GET /merchants → 200 OK với updated list
3. UI cập nhật → Merchant bị xóa
4. Modal đóng

### **Login Success:**
1. POST /auth/login → 200 OK
2. Page reload
3. GET /merchants → 200 OK
4. Merchant list hiển thị

## 🚀 Next Steps

1. **Test delete** với một merchant
2. **Test login** và kiểm tra reload
3. **Kiểm tra Network tab** cho tất cả requests
4. **Kiểm tra Console** cho errors

Nếu vẫn có vấn đề, cần kiểm tra backend API responses!

