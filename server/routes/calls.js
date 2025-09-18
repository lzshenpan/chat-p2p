const express = require('express');
const { createCallRecord, getCallHistory, updateCallRecord } = require('../database/calls');

const router = express.Router();

// 获取通话记录
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    
    const history = await getCallHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(history);
  } catch (error) {
    console.error('获取通话记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建通话记录
router.post('/record', async (req, res) => {
  try {
    const { callId, targetUserId, callType, duration, qualityData } = req.body;
    const userId = req.user.userId;

    const callRecord = await createCallRecord({
      id: callId,
      userId,
      targetUserId,
      callType: callType || 'video',
      duration: duration || 0,
      qualityData: qualityData || {},
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });

    res.status(201).json({
      message: '通话记录创建成功',
      callRecord
    });
  } catch (error) {
    console.error('创建通话记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新通话记录
router.put('/record/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const { duration, qualityData, endTime } = req.body;
    const userId = req.user.userId;

    const updatedRecord = await updateCallRecord(callId, {
      duration,
      qualityData,
      endTime: endTime || new Date().toISOString()
    });

    if (!updatedRecord) {
      return res.status(404).json({ error: '通话记录不存在' });
    }

    res.json({
      message: '通话记录更新成功',
      callRecord: updatedRecord
    });
  } catch (error) {
    console.error('更新通话记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
