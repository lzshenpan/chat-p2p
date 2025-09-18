const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'chatp2p.db');

const getDb = () => {
  return new sqlite3.Database(dbPath);
};

const createCallRecord = (callData) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    const {
      id,
      userId,
      targetUserId,
      callType,
      duration,
      qualityData,
      startTime,
      endTime
    } = callData;
    
    const createdAt = new Date().toISOString();
    const qualityDataStr = JSON.stringify(qualityData);
    
    db.run(
      `INSERT INTO calls (id, userId, targetUserId, callType, duration, qualityData, startTime, endTime, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, targetUserId, callType, duration, qualityDataStr, startTime, endTime, createdAt],
      function(err) {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          id,
          userId,
          targetUserId,
          callType,
          duration,
          qualityData,
          startTime,
          endTime,
          createdAt
        });
      }
    );
  });
};

const getCallHistory = (userId, options = {}) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    // 获取总数
    db.get(
      'SELECT COUNT(*) as total FROM calls WHERE userId = ?',
      [userId],
      (err, countRow) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }
        
        const total = countRow.total;
        
        // 获取通话记录
        db.all(
          `SELECT c.*, u.username as targetUsername 
           FROM calls c 
           LEFT JOIN users u ON c.targetUserId = u.id 
           WHERE c.userId = ? 
           ORDER BY c.startTime DESC 
           LIMIT ? OFFSET ?`,
          [userId, limit, offset],
          (err, rows) => {
            db.close();
            if (err) {
              reject(err);
              return;
            }
            
            const calls = rows.map(row => ({
              id: row.id,
              targetUserId: row.targetUserId,
              targetUsername: row.targetUsername,
              callType: row.callType,
              duration: row.duration,
              qualityData: row.qualityData ? JSON.parse(row.qualityData) : {},
              startTime: row.startTime,
              endTime: row.endTime,
              createdAt: row.createdAt
            }));
            
            resolve({
              calls,
              pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
              }
            });
          }
        );
      }
    );
  });
};

const updateCallRecord = (callId, updateData) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    const { duration, qualityData, endTime } = updateData;
    const qualityDataStr = qualityData ? JSON.stringify(qualityData) : null;
    
    let query = 'UPDATE calls SET ';
    let params = [];
    let setParts = [];
    
    if (duration !== undefined) {
      setParts.push('duration = ?');
      params.push(duration);
    }
    
    if (qualityDataStr !== undefined) {
      setParts.push('qualityData = ?');
      params.push(qualityDataStr);
    }
    
    if (endTime !== undefined) {
      setParts.push('endTime = ?');
      params.push(endTime);
    }
    
    if (setParts.length === 0) {
      db.close();
      resolve(null);
      return;
    }
    
    query += setParts.join(', ') + ' WHERE id = ?';
    params.push(callId);
    
    db.run(query, params, function(err) {
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
        id: callId,
        duration,
        qualityData,
        endTime
      });
    });
  });
};

module.exports = {
  createCallRecord,
  getCallHistory,
  updateCallRecord
};
