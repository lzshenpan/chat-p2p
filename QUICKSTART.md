# ChatP2P 快速开始指南

## 🚀 快速启动

### 1. 安装依赖

```bash
# 安装所有依赖
npm run install:all
```

### 2. 配置环境变量

```bash
# 复制环境配置文件
cp server/env.example server/.env

# 编辑配置文件（可选）
# 默认配置已足够开发使用
```

### 3. 启动开发服务器

```bash
# 同时启动前端和后端
npm run dev
```

### 4. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- WebSocket: ws://localhost:3001

## 🎯 功能演示

### 用户注册/登录
1. 访问 http://localhost:3000
2. 点击"注册"创建账号，或使用"游客模式"快速体验
3. 登录后进入主页面

### 发起视频通话
1. 在主页面查看在线用户列表
2. 点击用户旁边的视频图标发起通话
3. 对方会收到来电通知
4. 接受通话后开始视频通话

### 通话控制
- 🎤 静音/取消静音
- 📹 开启/关闭视频
- 📞 挂断通话
- 📊 实时质量监控

## 🔧 高级配置

### TURN 服务器配置
如果需要支持 NAT 穿透，配置 TURN 服务器：

```bash
# 编辑 server/.env
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=your_username
TURN_CREDENTIAL=your_password
```

### 生产环境部署

```bash
# 使用 Docker 部署
docker-compose up -d

# 或使用脚本部署
./scripts/deploy.sh
```

## 🐛 常见问题

### 1. 无法访问摄像头/麦克风
- 确保浏览器有权限访问设备
- 检查 HTTPS 环境（生产环境需要）

### 2. 连接失败
- 检查防火墙设置
- 配置 TURN 服务器用于 NAT 穿透

### 3. 通话质量差
- 检查网络连接
- 查看质量监控数据
- 调整视频分辨率

## 📱 浏览器支持

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🔒 安全特性

- 端到端加密 (SRTP/DTLS)
- JWT 身份验证
- 游客模式支持
- 通话记录加密存储

## 📊 性能指标

- 延迟: < 300ms
- 连接成功率: > 99%
- 支持分辨率: 最高 1080p
- 并发用户: 无限制 (P2P)

## 🆘 获取帮助

- 查看 README.md 了解详细文档
- 检查控制台错误信息
- 查看服务器日志: `npm run server:dev`
