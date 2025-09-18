const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 设置默认环境变量
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'chatp2p_jwt_secret_key_2024_development';
}

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const callRoutes = require('./routes/calls');
const { authenticateToken } = require('./middleware/auth');
const { initDatabase } = require('./database/init');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/calls', authenticateToken, callRoutes);

// Socket.IO 连接处理
const activeUsers = new Map();
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 用户加入
  socket.on('user:join', (data) => {
    const { userId, username } = data;
    
    // 如果用户已经存在，更新 socketId
    const existingUser = Array.from(activeUsers.values()).find(u => u.userId === userId);
    if (existingUser) {
      // 移除旧的连接
      activeUsers.delete(existingUser.socketId);
    }
    
    activeUsers.set(socket.id, { userId, username, socketId: socket.id });
    socket.userId = userId;
    socket.username = username;
    
    console.log(`用户 ${username} (${userId}) 加入`);
    
    // 广播在线用户列表
    io.emit('users:online', Array.from(activeUsers.values()));
  });

  // 发起通话
  socket.on('call:initiate', (data) => {
    const { targetUserId, callType = 'video' } = data;
    const caller = activeUsers.get(socket.id);
    
    if (!caller) return;

    // 查找目标用户
    const targetUser = Array.from(activeUsers.values())
      .find(user => user.userId === targetUserId);

    if (!targetUser) {
      socket.emit('call:error', { message: '目标用户不在线' });
      return;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建通话记录
    activeCalls.set(callId, {
      id: callId,
      caller: caller,
      callee: targetUser,
      status: 'ringing',
      startTime: new Date(),
      type: callType
    });

    // 通知目标用户
    io.to(targetUser.socketId).emit('call:incoming', {
      callId,
      caller: caller,
      callType
    });

    // 确认发起成功
    socket.emit('call:initiated', { callId });
  });

  // 接受通话
  socket.on('call:accept', (data) => {
    const { callId } = data;
    const call = activeCalls.get(callId);
    
    if (!call || call.callee.socketId !== socket.id) {
      socket.emit('call:error', { message: '通话不存在或无权操作' });
      return;
    }

    call.status = 'connected';
    call.connectTime = new Date();

    // 通知双方通话已建立
    io.to(call.caller.socketId).emit('call:accepted', { callId });
    io.to(call.callee.socketId).emit('call:accepted', { callId });

    console.log(`通话 ${callId} 已建立`);
  });

  // 拒绝通话
  socket.on('call:reject', (data) => {
    const { callId } = data;
    const call = activeCalls.get(callId);
    
    if (!call || call.callee.socketId !== socket.id) {
      socket.emit('call:error', { message: '通话不存在或无权操作' });
      return;
    }

    call.status = 'rejected';
    call.endTime = new Date();

    // 通知发起方
    io.to(call.caller.socketId).emit('call:rejected', { callId });

    // 清理通话记录
    activeCalls.delete(callId);
  });

  // 结束通话
  socket.on('call:end', (data) => {
    const { callId } = data;
    const call = activeCalls.get(callId);
    
    if (!call) return;

    call.status = 'ended';
    call.endTime = new Date();

    // 通知双方通话结束
    io.to(call.caller.socketId).emit('call:ended', { callId });
    io.to(call.callee.socketId).emit('call:ended', { callId });

    // 清理通话记录
    activeCalls.delete(callId);
    console.log(`通话 ${callId} 已结束`);
  });

  // WebRTC 信令转发
  socket.on('webrtc:offer', (data) => {
    const { callId, offer, targetUserId } = data;
    const call = activeCalls.get(callId);
    
    if (!call) return;

    const targetUser = call.caller.userId === targetUserId ? call.callee : call.caller;
    io.to(targetUser.socketId).emit('webrtc:offer', { callId, offer });
  });

  socket.on('webrtc:answer', (data) => {
    const { callId, answer, targetUserId } = data;
    const call = activeCalls.get(callId);
    
    if (!call) return;

    const targetUser = call.caller.userId === targetUserId ? call.callee : call.caller;
    io.to(targetUser.socketId).emit('webrtc:answer', { callId, answer });
  });

  socket.on('webrtc:ice-candidate', (data) => {
    const { callId, candidate, targetUserId } = data;
    const call = activeCalls.get(callId);
    
    if (!call) return;

    const targetUser = call.caller.userId === targetUserId ? call.callee : call.caller;
    io.to(targetUser.socketId).emit('webrtc:ice-candidate', { callId, candidate });
  });

  // 通话质量数据上报
  socket.on('call:quality-report', (data) => {
    const { callId, qualityData } = data;
    console.log(`通话 ${callId} 质量数据:`, qualityData);
    // 这里可以存储到数据库或发送到监控系统
  });

  // 用户断开连接
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`用户 ${user.username} 断开连接`);
      activeUsers.delete(socket.id);
      
      // 清理该用户的所有通话
      for (const [callId, call] of activeCalls.entries()) {
        if (call.caller.socketId === socket.id || call.callee.socketId === socket.id) {
          call.status = 'ended';
          call.endTime = new Date();
          
          const otherUser = call.caller.socketId === socket.id ? call.callee : call.caller;
          if (otherUser.socketId) {
            io.to(otherUser.socketId).emit('call:ended', { callId });
          }
          
          activeCalls.delete(callId);
        }
      }
      
      // 广播更新在线用户列表
      io.emit('users:online', Array.from(activeUsers.values()));
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    activeCalls: activeCalls.size
  });
});

// 获取 ICE 服务器配置
app.get('/api/ice-servers', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // 如果配置了 TURN 服务器，添加到列表中
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL
    });
  }

  res.json({ iceServers });
});

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 初始化数据库并启动服务器
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
