FROM node:20-alpine

WORKDIR /app

# 复制所有文件
COPY . .

# 安装前端依赖并构建
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 安装后端依赖
WORKDIR /app/backend
RUN npm install

# 设置环境变量（不硬编码 PORT，让 Railway 动态分配）
ENV NODE_ENV=production

# 启动后端
CMD ["node", "src/app.js"]
