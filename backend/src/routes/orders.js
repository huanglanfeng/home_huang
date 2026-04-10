const express = require('express')
const router = express.Router()
const { getDB } = require('../config/database')
const { auth } = require('../middleware/auth')
const { success, error } = require('../utils/response')

// POST /api/orders - 创建订单
router.post('/', auth, (req, res) => {
  const { items, notes } = req.body
  if (!items || !Array.isArray(items) || items.length === 0) {
    return error(res, 400, '请添加至少一个菜品')
  }

  const db = getDB()

  // 计算总营养
  let totalKcal = 0
  let totalProtein = 0
  let totalCarb = 0
  let totalFat = 0
  let totalSodium = 0
  let totalFiber = 0

  const orderItemsData = []

  for (const item of items) {
    const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND enabled = 1').get(item.dish_id)
    if (!dish) {
      return error(res, 400, `菜品 ID ${item.dish_id} 不存在或已下架`)
    }

    const nutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(item.dish_id)
    const qty = item.quantity || 1

    const itemNutrition = nutrition ? {
      per_serving_kcal: nutrition.per_serving_kcal * qty,
      protein: nutrition.protein * qty,
      carb: nutrition.carb * qty,
      fat: nutrition.fat * qty,
      sodium: nutrition.sodium * qty,
      fiber: nutrition.fiber * qty,
    } : {}

    totalKcal += itemNutrition.per_serving_kcal || 0
    totalProtein += itemNutrition.protein || 0
    totalCarb += itemNutrition.carb || 0
    totalFat += itemNutrition.fat || 0
    totalSodium += itemNutrition.sodium || 0
    totalFiber += itemNutrition.fiber || 0

    orderItemsData.push({
      dish_id: item.dish_id,
      specs: item.specs || {},
      quantity: qty,
      nutrition: itemNutrition,
    })
  }

  const totalNutrition = JSON.stringify({
    per_serving_kcal: Math.round(totalKcal),
    protein: Math.round(totalProtein * 10) / 10,
    carb: Math.round(totalCarb * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    sodium: Math.round(totalSodium),
    fiber: Math.round(totalFiber * 10) / 10,
  })

  // 创建订单
  const orderResult = db.prepare(
    'INSERT INTO orders (user_id, status, notes, total_nutrition) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, 'planning', notes || '', totalNutrition)

  const orderId = orderResult.lastInsertRowid

  // 创建订单项
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, dish_id, specs, quantity, nutrition) VALUES (?, ?, ?, ?, ?)'
  )

  for (const itemData of orderItemsData) {
    insertItem.run(
      orderId,
      itemData.dish_id,
      JSON.stringify(itemData.specs),
      itemData.quantity,
      JSON.stringify(itemData.nutrition)
    )
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

  // 通知管理员有新订单
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all()
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, content, type, related_id) VALUES (?, ?, ?, ?, ?)')
  admins.forEach(admin => {
    insertNotif.run(admin.id, '新订单提醒', `用户 ${req.user.nickname || '成员'} 提交了一个新订单`, 'order', orderId)
  })

  success(res, {
    ...order,
    total_nutrition: JSON.parse(order.total_nutrition),
  }, '创建订单成功')
})

// GET /api/orders - 获取订单列表（管理员看所有，普通用户看自己的）
router.get('/', auth, (req, res) => {
  const db = getDB()
  let orders
  if (req.user.role === 'admin') {
    // 管理员看所有订单
    orders = db.prepare(`
      SELECT o.*, u.nickname as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all()
  } else {
    orders = db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.user.id)
  }

  const result = orders.map((order) => ({
    ...order,
    total_nutrition: order.total_nutrition ? JSON.parse(order.total_nutrition) : {},
  }))

  success(res, result)
})

// GET /api/orders/:id - 获取订单详情
router.get('/:id', auth, (req, res) => {
  const db = getDB()
  const { id } = req.params

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id)
  if (!order) {
    return error(res, 404, '订单不存在')
  }

  const items = db.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).all(id)

  const parsedItems = items.map((item) => {
    const dish = db.prepare('SELECT name, cover FROM dishes WHERE id = ?').get(item.dish_id)
    return {
      ...item,
      dish_name: dish ? dish.name : '',
      dish_cover: dish ? dish.cover : '',
      specs: item.specs ? JSON.parse(item.specs) : {},
      nutrition: item.nutrition ? JSON.parse(item.nutrition) : {},
    }
  })

  success(res, {
    ...order,
    total_nutrition: order.total_nutrition ? JSON.parse(order.total_nutrition) : {},
    items: parsedItems,
  })
})

// PATCH /api/orders/:id/status - 更新订单状态
router.patch('/:id/status', auth, (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['planning', 'doing', 'done']
  if (!status || !validStatuses.includes(status)) {
    return error(res, 400, '无效的订单状态')
  }

  const db = getDB()
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id)
  if (!order) {
    return error(res, 404, '订单不存在')
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)

  // 订单完成时通知下单用户
  if (status === 'done') {
    const orderData = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (orderData && orderData.user_id) {
      db.prepare(
        'INSERT INTO notifications (user_id, title, content, type, related_id) VALUES (?, ?, ?, ?, ?)'
      ).run(orderData.user_id, '备餐完成', '您点的餐已经制作完成啦，快来享用吧！', 'done', id)
    }
  }

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  success(res, {
    ...updatedOrder,
    total_nutrition: updatedOrder.total_nutrition ? JSON.parse(updatedOrder.total_nutrition) : {},
  }, '状态更新成功')
})

module.exports = router
