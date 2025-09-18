const express = require('express');
const { getUserById, updateUser, getUsers } = require('../database/users');

const router = express.Router();

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }

    const updatedUser = await updateUser(req.user.userId, { username });
    if (!updatedUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: '用户信息更新成功',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户列表（用于联系人选择）
router.get('/list', async (req, res) => {
  try {
    const users = await getUsers();
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email
    }));

    res.json(userList);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
