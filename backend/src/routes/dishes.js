const express = require('express')
const router = express.Router()
const { getDB } = require('../config/database')
const { auth } = require('../middleware/auth')
const admin = require('../middleware/admin')
const { success, error } = require('../utils/response')

// GET /api/dishes - 获取菜品列表
router.get('/', (req, res) => {
  const db = getDB()
  const { category_id, keyword, all } = req.query

  let where = 'WHERE d.enabled = 1'
  if (all === 'true' || all === '1') {
    where = ''  // 管理员查看全部
  }

  let dishes
  if (category_id) {
    dishes = db.prepare(
      `SELECT d.* FROM dishes d ${where} AND d.category_id = ? ORDER BY d.id ASC`
    ).all(category_id)
  } else {
    dishes = db.prepare(
      `SELECT d.* FROM dishes d ${where} ORDER BY d.id ASC`
    ).all()
  }

  // 为每个菜品附加分类名称和营养数据
  const result = dishes.map((dish) => {
    const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(dish.category_id)
    const nutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(dish.id)
    return {
      ...dish,
      tags: dish.tags ? JSON.parse(dish.tags) : [],
      category_name: category ? category.name : '',
      nutrition: nutrition || null,
    }
  })

  success(res, result)
})

// GET /api/dishes/:id - 获取菜品详情
router.get('/:id', (req, res) => {
  const db = getDB()
  const { id } = req.params

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id)
  if (!dish) {
    return error(res, 404, '菜品不存在')
  }

  const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(dish.category_id)
  const specs = db.prepare('SELECT * FROM dish_specs WHERE dish_id = ?').all(id)
  const nutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(id)

  // 解析 JSON 字段
  const parsedSpecs = specs.map((s) => ({
    ...s,
    options: s.options ? JSON.parse(s.options) : [],
  }))

  success(res, {
    ...dish,
    tags: dish.tags ? JSON.parse(dish.tags) : [],
    category_name: category ? category.name : '',
    specs: parsedSpecs,
    nutrition: nutrition || null,
  })
})

// POST /api/dishes - 创建菜品（管理员）
router.post('/', auth, admin, (req, res) => {
  const { category_id, name, cover, description, tags, specs, nutrition } = req.body
  if (!category_id || !name) {
    return error(res, 400, '请输入分类ID和菜品名称')
  }

  const db = getDB()
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id)
  if (!category) {
    return error(res, 400, '分类不存在')
  }

  const result = db.prepare(
    'INSERT INTO dishes (category_id, name, cover, description, tags, enabled) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(
    category_id,
    name,
    cover || '',
    description || '',
    tags ? JSON.stringify(tags) : '[]'
  )

  const dishId = result.lastInsertRowid

  // 插入规格
  if (specs && specs.length > 0) {
    const insertSpec = db.prepare(
      'INSERT INTO dish_specs (dish_id, name, options) VALUES (?, ?, ?)'
    )
    for (const spec of specs) {
      insertSpec.run(dishId, spec.name, JSON.stringify(spec.options || []))
    }
  } else {
    // 默认规格
    db.prepare(
      'INSERT INTO dish_specs (dish_id, name, options) VALUES (?, ?, ?)'
    ).run(dishId, '份量', JSON.stringify([
      { label: '小份', value: 'small' },
      { label: '中份', value: 'medium' },
      { label: '大份', value: 'large' },
    ]))
  }

  // 插入营养信息
  if (nutrition) {
    db.prepare(
      'INSERT INTO dish_nutrition (dish_id, per_serving_kcal, protein, carb, fat, sodium, fiber) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      dishId,
      nutrition.per_serving_kcal || 0,
      nutrition.protein || 0,
      nutrition.carb || 0,
      nutrition.fat || 0,
      nutrition.sodium || 0,
      nutrition.fiber || 0
    )
  }

  // 返回完整菜品信息
  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(dishId)
  const dishSpecs = db.prepare('SELECT * FROM dish_specs WHERE dish_id = ?').all(dishId)
  const dishNutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(dishId)

  success(res, {
    ...dish,
    tags: dish.tags ? JSON.parse(dish.tags) : [],
    specs: dishSpecs.map((s) => ({ ...s, options: JSON.parse(s.options) })),
    nutrition: dishNutrition || null,
  }, '创建成功')
})

// PUT /api/dishes/:id - 更新菜品（管理员）
router.put('/:id', auth, admin, (req, res) => {
  const { id } = req.params
  const { category_id, name, cover, description, tags, nutrition, enabled } = req.body

  const db = getDB()
  const existing = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id)
  if (!existing) {
    return error(res, 404, '菜品不存在')
  }

  const updates = []
  const values = []
  if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id) }
  if (name !== undefined) { updates.push('name = ?'); values.push(name) }
  if (cover !== undefined) { updates.push('cover = ?'); values.push(cover) }
  if (description !== undefined) { updates.push('description = ?'); values.push(description) }
  if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)) }
  if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0) }

  if (updates.length > 0) {
    values.push(id)
    db.prepare(`UPDATE dishes SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  // 更新规格
  if (req.body.specs !== undefined) {
    db.prepare('DELETE FROM dish_specs WHERE dish_id = ?').run(id)
    const specs = req.body.specs
    if (Array.isArray(specs) && specs.length > 0) {
      const insertSpec = db.prepare('INSERT INTO dish_specs (dish_id, name, options) VALUES (?, ?, ?)')
      specs.forEach(spec => {
        const specName = spec.label || spec.name || '默认'
        // 支持两种格式：{options: [{label,value}]} 或直接 [{label,value,price}]
        let options = []
        if (spec.options && Array.isArray(spec.options)) {
          options = spec.options
        } else if (spec.label || spec.value) {
          options = [{ label: spec.label || '默认', value: spec.value || 'default', price: spec.price || 0 }]
        }
        insertSpec.run(id, specName, JSON.stringify(options))
      })
    }
  }

  // 更新营养信息
  if (nutrition) {
    const existingNutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(id)
    if (existingNutrition) {
      db.prepare(
        'UPDATE dish_nutrition SET per_serving_kcal = ?, protein = ?, carb = ?, fat = ?, sodium = ?, fiber = ? WHERE dish_id = ?'
      ).run(
        nutrition.per_serving_kcal || 0,
        nutrition.protein || 0,
        nutrition.carb || 0,
        nutrition.fat || 0,
        nutrition.sodium || 0,
        nutrition.fiber || 0,
        id
      )
    } else {
      db.prepare(
        'INSERT INTO dish_nutrition (dish_id, per_serving_kcal, protein, carb, fat, sodium, fiber) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        nutrition.per_serving_kcal || 0,
        nutrition.protein || 0,
        nutrition.carb || 0,
        nutrition.fat || 0,
        nutrition.sodium || 0,
        nutrition.fiber || 0
      )
    }
  }

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id)
  const specs = db.prepare('SELECT * FROM dish_specs WHERE dish_id = ?').all(id)
  const dishNutrition = db.prepare('SELECT * FROM dish_nutrition WHERE dish_id = ?').get(id)

  success(res, {
    ...dish,
    tags: dish.tags ? JSON.parse(dish.tags) : [],
    specs: specs.map((s) => ({ ...s, options: JSON.parse(s.options) })),
    nutrition: dishNutrition || null,
  }, '更新成功')
})

// DELETE /api/dishes/:id - 软删除菜品（管理员）
router.delete('/:id', auth, admin, (req, res) => {
  const { id } = req.params

  const db = getDB()
  const existing = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id)
  if (!existing) {
    return error(res, 404, '菜品不存在')
  }

  db.prepare('UPDATE dishes SET enabled = 0 WHERE id = ?').run(id)
  success(res, null, '删除成功')
})

module.exports = router
