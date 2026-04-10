const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const router = express.Router()
const { getDB } = require('../config/database')
const { auth, JWT_SECRET } = require('../middleware/auth')
const { success, error } = require('../utils/response')

// POST /api/auth/login - 登录
router.post('/login', (req, res) => {
  const { nickname, password } = req.body
  if (!nickname || !password) {
    return error(res, 400, '请输入昵称和密码')
  }

  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname)
  if (!user) {
    return error(res, 400, '用户不存在')
  }

  // 兼容没有 password 字段的旧数据
  if (!user.password) {
    return error(res, 400, '该用户未设置密码，请使用其他方式登录')
  }

  const isMatch = bcrypt.compareSync(password, user.password)
  if (!isMatch) {
    return error(res, 400, '密码错误')
  }

  const token = jwt.sign(
    { id: user.id, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  success(res, {
    token,
    userInfo: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
    },
  }, '登录成功')
})

// GET /api/auth/me - 获取当前用户信息
router.get('/me', auth, (req, res) => {
  const db = getDB()
  const user = db.prepare('SELECT id, nickname, avatar, role, preferences, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return error(res, 404, '用户不存在')
  }

  success(res, {
    ...user,
    preferences: user.preferences ? JSON.parse(user.preferences) : {},
  })
})

// POST /api/auth/register - 注册新用户
router.post('/register', (req, res) => {
  const { nickname, password } = req.body
  if (!nickname || !password) {
    return error(res, 400, '请输入昵称和密码')
  }
  if (password.length < 6) {
    return error(res, 400, '密码长度不能少于6位')
  }

  const db = getDB()
  const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname)
  if (existing) {
    return error(res, 400, '该昵称已被注册')
  }

  const id = crypto.randomUUID()
  const hash = bcrypt.hashSync(password, 10)

  db.prepare(
    'INSERT INTO users (id, nickname, password, role, avatar) VALUES (?, ?, ?, ?, ?)'
  ).run(id, nickname, hash, 'user', '')

  const token = jwt.sign(
    { id, nickname, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  success(res, {
    token,
    userInfo: {
      id,
      nickname,
      avatar: '',
      role: 'user',
      preferences: {},
    },
  }, '注册成功')
})

// ===== 管理员管理家庭成员 =====

// GET /api/auth/members - 获取家庭成员列表（管理员）
router.get('/members', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return error(res, 403, '仅管理员可查看成员列表')
  }
  const db = getDB()
  const members = db.prepare('SELECT id, nickname, avatar, role, preferences, created_at FROM users ORDER BY role DESC, created_at ASC').all()
  const result = members.map(m => ({
    ...m,
    preferences: m.preferences ? JSON.parse(m.preferences) : {},
  }))
  success(res, result)
})

// POST /api/auth/members - 管理员添加家庭成员
router.post('/members', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return error(res, 403, '仅管理员可添加成员')
  }
  const { nickname, password } = req.body
  if (!nickname || !password) {
    return error(res, 400, '请输入昵称和密码')
  }
  if (password.length < 6) {
    return error(res, 400, '密码长度不能少于6位')
  }

  const db = getDB()
  const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname)
  if (existing) {
    return error(res, 400, '该昵称已存在')
  }

  const id = crypto.randomUUID()
  const hash = bcrypt.hashSync(password, 10)
  db.prepare(
    'INSERT INTO users (id, nickname, password, role, avatar) VALUES (?, ?, ?, ?, ?)'
  ).run(id, nickname, hash, 'user', '')

  success(res, { id, nickname, role: 'user' }, '添加成功')
})

// PUT /api/auth/members/:id - 管理员编辑成员信息
router.put('/members/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return error(res, 403, '仅管理员可编辑成员')
  }
  const { nickname, password } = req.body
  const db = getDB()
  const member = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id)
  if (!member) {
    return error(res, 404, '成员不存在')
  }
  if (member.role === 'admin') {
    return error(res, 400, '不能编辑管理员账号')
  }

  if (nickname) {
    const existing = db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?').get(nickname, req.params.id)
    if (existing) {
      return error(res, 400, '该昵称已存在')
    }
    db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, req.params.id)
  }
  if (password) {
    if (password.length < 6) {
      return error(res, 400, '密码长度不能少于6位')
    }
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.params.id)
  }

  success(res, null, '修改成功')
})

// DELETE /api/auth/members/:id - 管理员删除成员
router.delete('/members/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return error(res, 403, '仅管理员可删除成员')
  }
  const db = getDB()
  const member = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id)
  if (!member) {
    return error(res, 404, '成员不存在')
  }
  if (member.role === 'admin') {
    return error(res, 400, '不能删除管理员账号')
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  success(res, null, '删除成功')
})

module.exports = router
