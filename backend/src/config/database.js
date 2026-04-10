const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const dbPath = path.join(__dirname, '../../data.db')
let db

function getDB() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

function initDB() {
  const db = getDB()

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      preferences TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      cover TEXT DEFAULT '',
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS dish_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dish_nutrition (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL UNIQUE,
      per_serving_kcal REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carb REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      fiber REAL DEFAULT 0,
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'doing', 'done')),
      notes TEXT DEFAULT '',
      total_nutrition TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      specs TEXT DEFAULT '{}',
      quantity INTEGER DEFAULT 1,
      nutrition TEXT DEFAULT '{}',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      dish_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, dish_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      related_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 插入默认管理员
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(
      'INSERT INTO users (id, nickname, role, avatar) VALUES (?, ?, ?, ?)'
    ).run('admin-001', '管理员', 'admin', '')
    // 存储密码到单独字段 - 我们需要添加 password 字段
    // 由于表已创建，使用 ALTER 添加
    try {
      db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''")
    } catch (e) {
      // 字段已存在
    }
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, 'admin-001')
  } else {
    // 确保 password 字段存在
    try {
      db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''")
    } catch (e) {
      // 字段已存在
    }
  }

  // 插入默认普通用户（家庭成员）
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get('user-001')
  if (!userExists) {
    const hash = bcrypt.hashSync('123456', 10)
    db.prepare(
      'INSERT INTO users (id, nickname, role, avatar, password) VALUES (?, ?, ?, ?, ?)'
    ).run('user-001', '小明', 'user', '', hash)
  }

  // 插入默认分类
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, icon, sort, enabled) VALUES (?, ?, ?, ?)'
    )
    const categories = [
      { name: '家常菜', icon: '🍳', sort: 1 },
      { name: '汤品', icon: '🍲', sort: 2 },
      { name: '凉菜', icon: '🥗', sort: 3 },
      { name: '主食', icon: '🍚', sort: 4 },
      { name: '小吃', icon: '🥟', sort: 5 },
      { name: '甜品', icon: '🍮', sort: 6 },
      { name: '饮品', icon: '🥤', sort: 7 },
      { name: '烘焙', icon: '🧁', sort: 8 },
    ]
    const insertMany = db.transaction((cats) => {
      for (const cat of cats) {
        insertCategory.run(cat.name, cat.icon, cat.sort, 1)
      }
    })
    insertMany(categories)
  }

  // 插入示例菜品数据
  const dishCount = db.prepare('SELECT COUNT(*) as count FROM dishes').get()
  if (dishCount.count === 0) {
    const insertDish = db.prepare(
      'INSERT INTO dishes (category_id, name, cover, description, tags, enabled) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const insertSpec = db.prepare(
      'INSERT INTO dish_specs (dish_id, name, options) VALUES (?, ?, ?)'
    )
    const insertNutrition = db.prepare(
      'INSERT INTO dish_nutrition (dish_id, per_serving_kcal, protein, carb, fat, sodium, fiber) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    // 获取分类 ID
    const cats = db.prepare('SELECT id, name FROM categories ORDER BY sort').all()
    const catMap = {}
    cats.forEach((c) => (catMap[c.name] = c.id))

    const dishes = [
      // 家常菜
      { cat: '家常菜', name: '番茄炒蛋', cover: '/images/dish_1.png', desc: '经典家常菜，酸甜可口', tags: '["快手菜","下饭"]', kcal: 150, protein: 9, carb: 8, fat: 10, sodium: 400, fiber: 1.5 },
      { cat: '家常菜', name: '红烧肉', cover: '/images/dish_2.png', desc: '肥而不腻，入口即化', tags: '["硬菜","下饭"]', kcal: 450, protein: 25, carb: 15, fat: 35, sodium: 800, fiber: 0.5 },
      { cat: '家常菜', name: '宫保鸡丁', cover: '/images/dish_3.png', desc: '麻辣鲜香，花生酥脆', tags: '["川菜","下饭"]', kcal: 280, protein: 22, carb: 12, fat: 16, sodium: 900, fiber: 1.2 },
      { cat: '家常菜', name: '清炒时蔬', cover: '/images/dish_4.png', desc: '清爽健康，营养丰富', tags: '["清淡","健康"]', kcal: 80, protein: 3, carb: 8, fat: 4, sodium: 300, fiber: 3.0 },
      { cat: '家常菜', name: '鱼香肉丝', cover: '/images/dish_5.png', desc: '酸甜微辣，经典川菜', tags: '["川菜","下饭"]', kcal: 260, protein: 18, carb: 14, fat: 15, sodium: 850, fiber: 1.0 },

      // 汤品
      { cat: '汤品', name: '紫菜蛋花汤', cover: '/images/dish_6.png', desc: '简单快手，鲜美可口', tags: '["快手汤","清淡"]', kcal: 60, protein: 5, carb: 4, fat: 3, sodium: 500, fiber: 0.5 },
      { cat: '汤品', name: '排骨玉米汤', cover: '/images/dish_7.png', desc: '营养丰富，汤鲜味美', tags: '["滋补","炖汤"]', kcal: 220, protein: 15, carb: 18, fat: 10, sodium: 600, fiber: 1.5 },
      { cat: '汤品', name: '番茄牛腩汤', cover: '/images/dish_8.png', desc: '酸甜浓郁，牛肉软烂', tags: '["炖汤","暖胃"]', kcal: 280, protein: 22, carb: 12, fat: 16, sodium: 700, fiber: 1.0 },

      // 凉菜
      { cat: '凉菜', name: '凉拌黄瓜', cover: '/images/dish_9.png', desc: '清脆爽口，开胃小菜', tags: '["开胃","低卡"]', kcal: 45, protein: 1, carb: 5, fat: 2, sodium: 400, fiber: 1.5 },
      { cat: '凉菜', name: '皮蛋豆腐', cover: '/images/dish_10.png', desc: '口感嫩滑，经典凉菜', tags: '["经典","凉菜"]', kcal: 130, protein: 8, carb: 5, fat: 9, sodium: 600, fiber: 0.5 },
      { cat: '凉菜', name: '蒜泥白肉', cover: '/images/dish_11.png', desc: '蒜香浓郁，肥瘦相间', tags: '["川菜","下酒"]', kcal: 320, protein: 20, carb: 3, fat: 26, sodium: 700, fiber: 0.3 },

      // 主食
      { cat: '主食', name: '蛋炒饭', cover: '/images/dish_12.png', desc: '粒粒分明，蛋香四溢', tags: '["快手","主食"]', kcal: 380, protein: 10, carb: 55, fat: 14, sodium: 500, fiber: 1.0 },
      { cat: '主食', name: '手工水饺', cover: '/images/dish_13.png', desc: '皮薄馅大，鲜香多汁', tags: '["面食","传统"]', kcal: 350, protein: 14, carb: 42, fat: 14, sodium: 800, fiber: 1.5 },
      { cat: '主食', name: '葱油拌面', cover: '/images/dish_14.png', desc: '葱香浓郁，简单美味', tags: '["面食","快手"]', kcal: 420, protein: 10, carb: 60, fat: 16, sodium: 600, fiber: 1.0 },

      // 小吃
      { cat: '小吃', name: '煎饺', cover: '/images/dish_15.png', desc: '底部金黄酥脆，馅料鲜美', tags: '["面食","煎炸"]', kcal: 300, protein: 10, carb: 35, fat: 14, sodium: 700, fiber: 1.0 },
      { cat: '小吃', name: '春卷', cover: '/images/dish_16.png', desc: '外皮酥脆，馅料丰富', tags: '["炸物","传统"]', kcal: 280, protein: 8, carb: 30, fat: 15, sodium: 600, fiber: 1.5 },
      { cat: '小吃', name: '炸鸡翅', cover: '/images/dish_17.png', desc: '外酥里嫩，香气四溢', tags: '["炸物","小吃"]', kcal: 350, protein: 22, carb: 12, fat: 25, sodium: 700, fiber: 0.3 },

      // 甜品
      { cat: '甜品', name: '红豆沙', cover: '/images/dish_18.png', desc: '甜蜜细腻，暖身甜品', tags: '["甜品","暖身"]', kcal: 180, protein: 5, carb: 35, fat: 2, sodium: 10, fiber: 4.0 },
      { cat: '甜品', name: '芒果西米露', cover: '/images/dish_19.png', desc: '清甜爽滑，热带风味', tags: '["甜品","清爽"]', kcal: 150, protein: 2, carb: 32, fat: 2, sodium: 15, fiber: 1.0 },
      { cat: '甜品', name: '双皮奶', cover: '/images/dish_20.png', desc: '口感嫩滑，奶香浓郁', tags: '["甜品","粤式"]', kcal: 200, protein: 7, carb: 25, fat: 8, sodium: 80, fiber: 0 },

      // 饮品
      { cat: '饮品', name: '柠檬蜂蜜水', cover: '/images/dish_21.png', desc: '清新酸甜，补充维C', tags: '["饮品","健康"]', kcal: 50, protein: 0, carb: 13, fat: 0, sodium: 5, fiber: 0.2 },
      { cat: '饮品', name: '绿豆汤', cover: '/images/dish_22.png', desc: '清热解暑，消暑佳品', tags: '["饮品","解暑"]', kcal: 70, protein: 3, carb: 14, fat: 0.5, sodium: 5, fiber: 1.5 },
      { cat: '饮品', name: '酸梅汤', cover: '/images/dish_23.png', desc: '酸甜可口，生津止渴', tags: '["饮品","传统"]', kcal: 60, protein: 0, carb: 15, fat: 0, sodium: 10, fiber: 0.3 },

      // 烘焙
      { cat: '烘焙', name: '蛋挞', cover: '/images/dish_24.png', desc: '外皮酥脆，蛋液嫩滑', tags: '["烘焙","甜点"]', kcal: 250, protein: 5, carb: 28, fat: 14, sodium: 150, fiber: 0.3 },
      { cat: '烘焙', name: '戚风蛋糕', cover: '/images/dish_25.png', desc: '松软细腻，入口即化', tags: '["烘焙","蛋糕"]', kcal: 300, protein: 6, carb: 38, fat: 15, sodium: 200, fiber: 0.5 },
      { cat: '烘焙', name: '曲奇饼干', cover: '/images/dish_26.png', desc: '酥脆香甜，奶味十足', tags: '["烘焙","饼干"]', kcal: 180, protein: 2, carb: 22, fat: 10, sodium: 120, fiber: 0.3 },
    ]

    const insertAll = db.transaction((items) => {
      for (const d of items) {
        const result = insertDish.run(
          catMap[d.cat],
          d.name,
          d.cover,
          d.desc,
          d.tags,
          1
        )
        const dishId = result.lastInsertRowid

        // 插入默认规格
        insertSpec.run(dishId, '份量', JSON.stringify([
          { label: '小份', value: 'small' },
          { label: '中份', value: 'medium' },
          { label: '大份', value: 'large' },
        ]))

        // 插入营养信息
        insertNutrition.run(dishId, d.kcal, d.protein, d.carb, d.fat, d.sodium, d.fiber)
      }
    })

    insertAll(dishes)
  }

  console.log('数据库初始化完成')
}

module.exports = { getDB, initDB }
