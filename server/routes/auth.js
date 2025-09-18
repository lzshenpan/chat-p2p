const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, createUser, getUserById } = require('../database/users');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // 检查用户是否已存在
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = uuidv4();
    const user = await createUser({
      id: userId,
      email,
      password: hashedPassword,
      username,
      createdAt: new Date().toISOString()
    });

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 游客登录
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: '请输入用户名' });
    }

    // 创建临时用户
    const userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 生成 JWT
    const token = jwt.sign(
      { userId, email: null, isGuest: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '游客登录成功',
      token,
      user: {
        id: userId,
        email: null,
        username,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('游客登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 验证令牌
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.isGuest) {
      return res.json({
        valid: true,
        user: {
          id: decoded.userId,
          email: null,
          username: '游客用户',
          isGuest: true
        }
      });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isGuest: false
      }
    });
  } catch (error) {
    res.status(401).json({ error: '无效的访问令牌' });
  }
});

module.exports = router;
