const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./config/database')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/dishes', require('./routes/dishes'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/upload', require('./routes/upload'))

// 管理员路由（复用现有路由，挂载到 /api/admin 前缀下）
app.use('/api/admin/categories', require('./routes/categories'))
app.use('/api/admin/dishes', require('./routes/dishes'))
app.use('/api/admin/orders', require('./routes/orders'))
app.use('/api/admin/dashboard', require('./routes/dashboard'))

// 托管前端构建产物（生产环境）
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))
  // SPA fallback: 所有非 API 请求返回 index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'))
    }
  })
}

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: 500, message: '服务器错误' })
})

// 初始化数据库并启动
initDB()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`)
})

module.exports = app
