# 家庭备餐助手

一个面向家庭的备餐/点单式做饭助手应用，帮助家庭轻松管理每日餐食。

## 技术栈

- **前端**: Vue 3 + Vite + JavaScript + Vant + Element Plus + Pinia
- **后端**: Node.js + Express + SQLite + JWT

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 2. 启动后端服务

```bash
cd backend
npm run dev
```

后端服务运行在 http://localhost:3000

### 3. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端开发服务器运行在 http://localhost:5173

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 默认账号

| 角色 | 昵称 | 密码 |
|------|------|------|
| 管理员 | 管理员 | admin123 |

## 功能模块

### 用户端
- 🏠 首页：Banner轮播、快捷入口、今日备餐进度、推荐菜品
- 📋 点单：分类浏览、菜品详情、规格选择、备餐篮
- 📦 订单：备餐清单、历史记录、营养总览
- 👤 我的：家庭成员管理、收藏、厨房设备、主题设置

### 管理后台
- 📊 仪表盘：数据统计概览
- 🏷️ 分类管理：增删改查、排序、启用/禁用
- 🍽️ 菜品管理：增删改查、营养信息、规格管理、图片上传

## 项目结构

```
make-dinner/
├── frontend/          # Vue3 前端
│   ├── src/
│   │   ├── api/       # API 接口
│   │   ├── assets/    # 静态资源
│   │   ├── components/# 公共组件
│   │   ├── router/    # 路由配置
│   │   ├── store/     # Pinia 状态管理
│   │   ├── styles/    # 全局样式
│   │   ├── utils/     # 工具函数
│   │   └── views/     # 页面组件
│   ├── public/images/ # 菜品图片
│   └── vite.config.js
├── backend/           # Node.js 后端
│   ├── src/
│   │   ├── config/    # 数据库配置
│   │   ├── middleware/# 中间件
│   │   ├── routes/    # 路由
│   │   └── utils/     # 工具函数
│   └── uploads/       # 上传文件
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类（管理员） |
| PUT | /api/categories/:id | 更新分类（管理员） |
| DELETE | /api/categories/:id | 删除分类（管理员） |
| GET | /api/dishes | 获取菜品列表 |
| GET | /api/dishes/:id | 获取菜品详情 |
| POST | /api/dishes | 创建菜品（管理员） |
| PUT | /api/dishes/:id | 更新菜品（管理员） |
| DELETE | /api/dishes/:id | 删除菜品（管理员） |
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 获取订单列表 |
| GET | /api/orders/:id | 获取订单详情 |
| PATCH | /api/orders/:id/status | 更新订单状态 |
| POST | /api/upload | 上传图片（管理员） |
