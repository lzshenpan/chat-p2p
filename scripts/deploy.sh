#!/bin/bash

# ChatP2P 生产环境部署脚本

echo "🚀 开始部署 ChatP2P 到生产环境..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "❌ 请先创建 .env 文件并配置环境变量"
    echo "可以复制 env.example 文件: cp env.example .env"
    exit 1
fi

echo "✅ 环境变量文件检查通过"

# 构建和启动服务
echo "🏗️  构建 Docker 镜像..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo "✅ Docker 镜像构建完成"

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 服务启动失败"
    exit 1
fi

echo "✅ 服务启动成功"

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    echo "✅ 所有服务运行正常"
else
    echo "❌ 部分服务启动失败"
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务信息："
echo "- 前端: http://localhost"
echo "- API: http://localhost/api"
echo "- WebSocket: ws://localhost/socket.io"
echo ""
echo "📊 管理命令："
echo "- 查看日志: docker-compose logs -f"
echo "- 停止服务: docker-compose down"
echo "- 重启服务: docker-compose restart"
echo ""
