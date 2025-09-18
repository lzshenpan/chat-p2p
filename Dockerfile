# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制前端代码
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./
RUN cd client && npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache sqlite

# 复制后端代码
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server/ ./

# 复制前端构建结果
COPY --from=builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server/index.js"]
