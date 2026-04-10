const express = require('express')
const { auth } = require('../middleware/auth')
const adminAuth = require('../middleware/admin')
const { getDB } = require('../config/database')
const { success } = require('../utils/response')

const router = express.Router()

// GET /api/admin/dashboard/stats - 获取仪表盘统计数据
router.get('/stats', auth, adminAuth, (req, res) => {
  const db = getDB()
  const dishCount = db.prepare('SELECT COUNT(*) as count FROM dishes WHERE enabled = 1').get().count
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE enabled = 1').get().count
  const todayOrderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')").get().count
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count
  success(res, { dishCount, categoryCount, todayOrderCount, userCount })
})

module.exports = router
