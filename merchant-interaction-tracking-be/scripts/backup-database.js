#!/usr/bin/env node

/**
 * Script để backup database SQLite
 * Usage: node scripts/backup-database.js [backup-name]
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const databasePath = process.env.DATABASE_PATH || path.resolve(projectRoot, 'data', 'notes.db');
const backupsDir = path.resolve(projectRoot, 'data', 'backups');

// Tạo thư mục backups nếu chưa có
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Tên file backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupName = process.argv[2] || `notes-backup-${timestamp}.db`;
const backupPath = path.resolve(backupsDir, backupName);

// Kiểm tra database file có tồn tại không
if (!fs.existsSync(databasePath)) {
  console.error(`❌ Database file not found: ${databasePath}`);
  process.exit(1);
}

// Copy database file
try {
  fs.copyFileSync(databasePath, backupPath);
  const stats = fs.statSync(backupPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Database backed up successfully!`);
  console.log(`   Source: ${databasePath}`);
  console.log(`   Backup: ${backupPath}`);
  console.log(`   Size: ${fileSizeInMB} MB`);
} catch (error) {
  console.error(`❌ Failed to backup database:`, error.message);
  process.exit(1);
}

