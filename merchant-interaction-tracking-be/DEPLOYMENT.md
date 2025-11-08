# 📦 Deployment Guide - Notes Database

## ⚠️ Vấn đề Database khi Deploy

Khi deploy bằng cách thay thế thư mục `dist/`, **database SQLite sẽ bị mất** nếu:
- Database file nằm trong thư mục `dist/`
- Database file sử dụng relative path và process chạy từ `dist/`

## ✅ Giải pháp đã áp dụng

Database được lưu ở thư mục `data/` bên ngoài `dist/`:
- **Path**: `./data/notes.db` (relative từ thư mục project root)
- **Environment variable**: `DATABASE_PATH` (có thể override)

## 📁 Cấu trúc thư mục khi deploy

```
project-root/
├── dist/              # Code đã build (có thể thay thế)
├── data/              # Database files (KHÔNG được xóa)
│   └── notes.db
├── node_modules/      # Dependencies
├── .env               # Environment variables
└── package.json
```

## 🚀 Quy trình Deploy an toàn

### 1. Backup Database (Trước khi deploy)

```bash
# Cách 1: Sử dụng script backup (khuyến nghị)
npm run db:backup
# Hoặc với tên custom
npm run db:backup my-backup-name.db

# Cách 2: Backup thủ công
cp data/notes.db data/notes.db.backup
# Hoặc
tar -czf notes-db-backup-$(date +%Y%m%d).tar.gz data/
```

Backup sẽ được lưu trong `data/backups/` directory.

### 2. Deploy Code

```bash
# Build code mới
npm run build

# Backup thư mục dist cũ (nếu cần)
mv dist dist.old

# Copy dist mới (hoặc giải nén từ zip)
# ... copy dist mới vào ...

# Đảm bảo thư mục data/ vẫn còn
mkdir -p data/
```

### 3. Restore Database (Nếu cần)

```bash
# Cách 1: Sử dụng script restore (khuyến nghị)
npm run db:restore notes-backup-2025-01-15.db --force

# Cách 2: Restore thủ công
cp data/notes.db.backup data/notes.db
```

**Lưu ý**: Script restore sẽ tự động backup database hiện tại trước khi restore.

## 🔧 Cấu hình Environment Variables

### Option 1: Sử dụng default path (`./data/notes.db`)
```bash
# Không cần set gì, sẽ tự động dùng ./data/notes.db
```

### Option 2: Custom path
```bash
# Trong .env
DATABASE_PATH=/var/app/data/notes.db
```

### Option 3: Absolute path trên server
```bash
# Trong .env
DATABASE_PATH=/home/user/app-data/notes.db
```

## 📝 Checklist khi Deploy

- [ ] Backup database trước khi deploy
- [ ] Đảm bảo thư mục `data/` tồn tại và có quyền ghi
- [ ] Kiểm tra `DATABASE_PATH` trong `.env` (nếu có)
- [ ] Sau khi deploy, verify database vẫn còn data
- [ ] Test tạo/đọc note để đảm bảo DB hoạt động

## 🛡️ Best Practices

1. **Luôn backup database trước khi deploy**
2. **Sử dụng absolute path trong production** (`/var/app/data/notes.db`)
3. **Không commit database file vào git** (đã có trong .gitignore)
4. **Tạo thư mục data/ trong deployment script**
5. **Set proper permissions** cho thư mục data/

## 🔄 Migration Script (Optional)

Nếu cần migrate database từ vị trí cũ:

```bash
# Di chuyển database từ root sang data/
mkdir -p data/
mv notes.db data/notes.db
```

## 📊 Monitoring

Sau khi deploy, kiểm tra:
```bash
# Kiểm tra database file tồn tại
ls -lh data/notes.db

# Kiểm tra kích thước (không được = 0)
du -h data/notes.db
```

