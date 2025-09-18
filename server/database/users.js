const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'chatp2p.db');

const getDb = () => {
  return new sqlite3.Database(dbPath);
};

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [id],
      (err, row) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    const { id, email, password, username, createdAt } = userData;
    
    db.run(
      'INSERT INTO users (id, email, password, username, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, email, password, username, createdAt],
      function(err) {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id,
          email,
          username,
          createdAt
        });
      }
    );
  });
};

const updateUser = (id, updateData) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    const { username } = updateData;
    const updatedAt = new Date().toISOString();
    
    db.run(
      'UPDATE users SET username = ?, updatedAt = ? WHERE id = ?',
      [username, updatedAt, id],
      function(err) {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          resolve(null);
          return;
        }
        
        resolve({
          id,
          username,
          updatedAt
        });
      }
    );
  });
};

const getUsers = () => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.all(
      'SELECT id, email, username, createdAt FROM users ORDER BY createdAt DESC',
      [],
      (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      }
    );
  });
};

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getUsers
};
