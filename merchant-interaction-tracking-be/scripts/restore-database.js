#!/usr/bin/env node

/**
 * Script để restore database SQLite từ backup
 * Usage: node scripts/restore-database.js <backup-file-name>
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const databasePath = process.env.DATABASE_PATH || path.resolve(projectRoot, 'data', 'notes.db');
const backupsDir = path.resolve(projectRoot, 'data', 'backups');

// Lấy tên file backup từ argument
const backupFileName = process.argv[2];

if (!backupFileName) {
  console.error('❌ Please provide backup file name');
  console.error('   Usage: node scripts/restore-database.js <backup-file-name>');
  console.error('\n   Available backups:');
  
  if (fs.existsSync(backupsDir)) {
    const backups = fs.readdirSync(backupsDir).filter(f => f.endsWith('.db'));
    if (backups.length === 0) {
      console.error('   No backups found');
    } else {
      backups.forEach(b => console.error(`   - ${b}`));
    }
  } else {
    console.error('   No backups directory found');
  }
  
  process.exit(1);
}

const backupPath = path.resolve(backupsDir, backupFileName);

// Kiểm tra backup file có tồn tại không
if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  process.exit(1);
}

// Xác nhận restore
console.log('⚠️  WARNING: This will overwrite the current database!');
console.log(`   Current database: ${databasePath}`);
console.log(`   Backup file: ${backupPath}`);
console.log('\n   Are you sure you want to continue? (yes/no)');

// Đơn giản hóa: chỉ restore nếu có flag --force
if (process.argv[3] !== '--force') {
  console.log('   Use --force flag to proceed: node scripts/restore-database.js <backup-file> --force');
  process.exit(1);
}

// Đảm bảo thư mục data/ tồn tại
const dataDir = path.dirname(databasePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Backup database hiện tại trước khi restore
if (fs.existsSync(databasePath)) {
  const currentBackupPath = databasePath + '.before-restore-' + Date.now();
  fs.copyFileSync(databasePath, currentBackupPath);
  console.log(`   Current database backed up to: ${currentBackupPath}`);
}

// Restore từ backup
try {
  fs.copyFileSync(backupPath, databasePath);
  const stats = fs.statSync(databasePath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Database restored successfully!`);
  console.log(`   Backup: ${backupPath}`);
  console.log(`   Restored to: ${databasePath}`);
  console.log(`   Size: ${fileSizeInMB} MB`);
} catch (error) {
  console.error(`❌ Failed to restore database:`, error.message);
  process.exit(1);
}

