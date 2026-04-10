const express = require('express')
const { getDB } = require('../config/database')
const { auth } = require('../middleware/auth')
const { success, error } = require('../utils/response')

const router = express.Router()

// GET /api/notifications - 获取当前用户的通知列表
router.get('/', auth, (req, res) => {
  const db = getDB()
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id)
  success(res, notifications)
})

// GET /api/notifications/unread-count - 获取未读数量
router.get('/unread-count', auth, (req, res) => {
  const db = getDB()
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id)
  success(res, { count: row.count })
})

// PUT /api/notifications/read-all - 全部标为已读
router.put('/read-all', auth, (req, res) => {
  const db = getDB()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id)
  success(res, null, '已全部标记为已读')
})

// PUT /api/notifications/:id/read - 单个标为已读
router.put('/:id/read', auth, (req, res) => {
  const db = getDB()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  success(res, null)
})

module.exports = router
