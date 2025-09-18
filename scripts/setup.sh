#!/bin/bash

# ChatP2P 项目设置脚本

echo "🚀 开始设置 ChatP2P 项目..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+ 版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要 Node.js 18+ 版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 安装依赖
echo "📦 安装项目依赖..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 创建环境配置文件
if [ ! -f "server/.env" ]; then
    echo "📝 创建环境配置文件..."
    cp server/env.example server/.env
    echo "✅ 环境配置文件已创建: server/.env"
    echo "⚠️  请编辑 server/.env 文件配置您的环境变量"
else
    echo "✅ 环境配置文件已存在"
fi

# 创建数据目录
mkdir -p data
echo "✅ 数据目录已创建"

# 检查权限
echo "🔐 检查文件权限..."
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "🎉 项目设置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 server/.env 文件配置环境变量"
echo "2. 运行 'npm run dev' 启动开发服务器"
echo "3. 访问 http://localhost:3000 开始使用"
echo ""
echo "🔧 可选配置："
echo "- 配置 TURN 服务器用于 NAT 穿透"
echo "- 设置生产环境的 JWT_SECRET"
echo ""
