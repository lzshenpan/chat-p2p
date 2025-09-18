# ChatP2P - 点对点视频通话应用

基于 WebRTC 的低延迟、低成本视频通话解决方案。

## 功能特性

- 🎥 1v1 实时视频通话
- 🔒 端到端加密保护隐私
- 🌐 支持 Web、移动端
- 📊 通话质量监控
- 💰 低成本 P2P 直连
- 🚀 轻量化设计

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + Socket.IO
- **实时通信**: WebRTC + STUN/TURN
- **状态管理**: Zustand
- **UI组件**: Lucide React

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 环境配置

1. 复制 `server/env.example` 为 `server/.env`
2. 配置 TURN 服务器信息（可选，用于 NAT 穿透）

### 启动开发服务器

```bash
npm run dev
```

- 前端: http://localhost:3000
- 后端: http://localhost:3001

## 项目结构

```
chatP2P/
├── client/          # React 前端应用
├── server/          # Node.js 后端服务
├── package.json     # 根项目配置
└── README.md
```

## API 文档

### 信令事件

- `call:initiate` - 发起通话
- `call:accept` - 接受通话
- `call:reject` - 拒绝通话
- `call:end` - 结束通话
- `webrtc:offer` - WebRTC Offer
- `webrtc:answer` - WebRTC Answer
- `webrtc:ice-candidate` - ICE 候选

## 部署

### 生产环境

```bash
npm run build
npm start
```

### Docker 部署

```bash
docker-compose up -d
```

## 许可证

MIT License
