const express = require('express')
const router = express.Router()
const { getDB } = require('../config/database')
const { auth } = require('../middleware/auth')
const admin = require('../middleware/admin')
const { success, error } = require('../utils/response')

// GET /api/categories - 获取所有启用的分类
router.get('/', (req, res) => {
  const db = getDB()
  const { all } = req.query

  let categories
  if (all === 'true' || all === '1') {
    categories = db.prepare(
      'SELECT * FROM categories ORDER BY sort ASC'
    ).all()
  } else {
    categories = db.prepare(
      'SELECT * FROM categories WHERE enabled = 1 ORDER BY sort ASC'
    ).all()
  }
  success(res, categories)
})

// POST /api/categories - 创建分类（管理员）
router.post('/', auth, admin, (req, res) => {
  const { name, icon, sort } = req.body
  if (!name) {
    return error(res, 400, '请输入分类名称')
  }

  const db = getDB()
  const result = db.prepare(
    'INSERT INTO categories (name, icon, sort, enabled) VALUES (?, ?, ?, 1)'
  ).run(name, icon || '', sort || 0)

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
  success(res, category, '创建成功')
})

// PUT /api/categories/:id - 更新分类（管理员）
router.put('/:id', auth, admin, (req, res) => {
  const { id } = req.params
  const { name, icon, sort, enabled } = req.body

  const db = getDB()
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  if (!existing) {
    return error(res, 404, '分类不存在')
  }

  db.prepare(
    'UPDATE categories SET name = ?, icon = ?, sort = ?, enabled = ? WHERE id = ?'
  ).run(
    name !== undefined ? name : existing.name,
    icon !== undefined ? icon : existing.icon,
    sort !== undefined ? sort : existing.sort,
    enabled !== undefined ? enabled : existing.enabled,
    id
  )

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  success(res, category, '更新成功')
})

// DELETE /api/categories/:id - 删除分类（管理员）
router.delete('/:id', auth, admin, (req, res) => {
  const { id } = req.params

  const db = getDB()
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  if (!existing) {
    return error(res, 404, '分类不存在')
  }

  // 检查是否有菜品关联
  const dishCount = db.prepare('SELECT COUNT(*) as count FROM dishes WHERE category_id = ?').get(id)
  if (dishCount.count > 0) {
    return error(res, 400, '该分类下还有菜品，无法删除')
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  success(res, null, '删除成功')
})

module.exports = router
