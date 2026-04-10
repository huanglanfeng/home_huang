#!/bin/bash
echo "=== 家庭备餐助手 - 启动脚本 ==="
echo ""

# 检查依赖
if [ ! -d "frontend/node_modules" ]; then
  echo "正在安装前端依赖..."
  cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
  echo "正在安装后端依赖..."
  cd backend && npm install && cd ..
fi

echo "启动后端服务..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "启动前端开发服务器..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== 启动完成 ==="
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "管理员: 管理员 / admin123"
echo ""
echo "按 Ctrl+C 停止所有服务"

wait
