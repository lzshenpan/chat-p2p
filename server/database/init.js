const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'chatp2p.db');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接错误:', err);
        reject(err);
        return;
      }
      console.log('数据库连接成功');
    });

    // 创建用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `, (err) => {
      if (err) {
        console.error('创建用户表错误:', err);
        reject(err);
        return;
      }
    });

    // 创建通话记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        targetUserId TEXT NOT NULL,
        callType TEXT NOT NULL DEFAULT 'video',
        duration INTEGER DEFAULT 0,
        qualityData TEXT,
        startTime TEXT NOT NULL,
        endTime TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('创建通话记录表错误:', err);
        reject(err);
        return;
      }
    });

    // 创建索引
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls (userId)
    `, (err) => {
      if (err) {
        console.error('创建索引错误:', err);
        reject(err);
        return;
      }
    });

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls (startTime)
    `, (err) => {
      if (err) {
        console.error('创建索引错误:', err);
        reject(err);
        return;
      }
      
      console.log('数据库初始化完成');
      resolve();
    });

    db.close();
  });
};

module.exports = { initDatabase };
