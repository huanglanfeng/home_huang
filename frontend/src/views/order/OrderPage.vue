<template>
  <div class="order-page">
    <!-- 顶部搜索栏 -->
    <van-search
      v-model="searchText"
      placeholder="搜索菜品名称"
      shape="round"
      class="order-search"
    />

    <!-- 主体区域：左右分栏 -->
    <div class="order-body">
      <!-- 左侧分类列表 -->
      <div class="category-sidebar">
        <van-sticky :offset-top="54">
          <div
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="category-item"
            :class="{ active: activeCategoryId === cat.id }"
            @click="selectCategory(cat.id)"
          >
            <van-icon :name="cat.icon || 'label-o'" size="18" />
            <span class="category-name">{{ cat.name }}</span>
          </div>
        </van-sticky>
      </div>

      <!-- 右侧菜品列表 -->
      <div class="dish-list" ref="dishListRef">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          :id="'cat-' + cat.id"
          class="dish-group"
        >
          <div class="group-header">
            <span class="group-title">{{ cat.name }}</span>
            <span class="group-desc" v-if="cat.description">{{ cat.description }}</span>
          </div>
          <div
            v-for="dish in getDishesByCategory(cat.id)"
            :key="dish.id"
            class="dish-card"
            @click="openDetail(dish)"
          >
            <div class="dish-cover">
              <van-image
                v-if="dish.cover"
                :src="dish.cover"
                width="80"
                height="80"
                radius="8"
                fit="cover"
                lazy-load
              />
              <div v-else class="dish-cover-placeholder">
                <van-icon name="photo-o" size="28" color="#ccc" />
              </div>
            </div>
            <div class="dish-info">
              <div class="dish-name">{{ dish.name }}</div>
              <div class="dish-desc" v-if="dish.description">{{ dish.description }}</div>
              <div class="dish-nutrition-badges">
                <span class="nutrition-badge" v-if="dish.nutrition && dish.nutrition.per_serving_kcal">
                  {{ dish.nutrition.per_serving_kcal }}kcal
                </span>
                <span class="nutrition-badge" v-if="dish.nutrition && dish.nutrition.protein">
                  蛋白{{ dish.nutrition.protein }}g
                </span>
              </div>
              <div class="dish-tags" v-if="dish.tags && dish.tags.length">
                <van-tag
                  v-for="tag in dish.tags"
                  :key="tag"
                  size="small"
                  plain
                  type="success"
                  class="dish-tag"
                >{{ tag }}</van-tag>
              </div>
            </div>
            <div class="dish-action" @click.stop="quickAdd(dish)">
              <van-icon name="plus" size="22" color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部备餐篮浮动栏 -->
    <transition name="slide-up">
      <div class="cart-bar" v-if="cartStore.totalCount > 0">
        <div class="cart-bar-left" @click="showCartPopup = true">
          <div class="cart-icon-wrap">
            <van-icon name="shopping-cart-o" size="22" color="#fff" />
            <span class="cart-badge" v-if="cartStore.totalCount > 0">{{ cartStore.totalCount }}</span>
          </div>
          <div class="cart-summary">
            <span class="cart-total-kcal">{{ Math.round(cartStore.totalNutrition.per_serving_kcal || 0) }} kcal</span>
          </div>
        </div>
        <van-button
          type="primary"
          size="small"
          round
          class="cart-bar-btn"
          @click="showCartPopup = true"
        >查看备餐篮</van-button>
      </div>
    </transition>

    <!-- 菜品详情弹层 -->
    <van-popup
      v-model:show="showDetailPopup"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="detail-popup" v-if="currentDish">
        <div class="detail-scroll">
          <!-- 菜品大图 -->
          <div class="detail-cover">
            <van-image
              v-if="currentDish.cover"
              :src="currentDish.cover"
              width="100%"
              height="200"
              fit="cover"
            />
            <div v-else class="detail-cover-placeholder">
              <van-icon name="photo-o" size="48" color="#ccc" />
            </div>
          </div>

          <!-- 菜品名称 + 描述 -->
          <div class="detail-header">
            <div class="detail-name">{{ currentDish.name }}</div>
            <div class="detail-desc" v-if="currentDish.description">{{ currentDish.description }}</div>
          </div>

          <!-- 营养信息卡片 -->
          <div class="detail-nutrition" v-if="currentDish.nutrition">
            <div class="nutrition-title">营养信息 <span class="nutrition-unit">/ 每份</span></div>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <div class="nutrition-value">{{ currentDish.nutrition.per_serving_kcal || '-' }}</div>
                <div class="nutrition-label">热量(kcal)</div>
              </div>
              <div class="nutrition-item">
                <div class="nutrition-value">{{ currentDish.nutrition.protein || '-' }}</div>
                <div class="nutrition-label">蛋白质(g)</div>
              </div>
              <div class="nutrition-item">
                <div class="nutrition-value">{{ currentDish.nutrition.carb || '-' }}</div>
                <div class="nutrition-label">碳水(g)</div>
              </div>
              <div class="nutrition-item">
                <div class="nutrition-value">{{ currentDish.nutrition.fat || '-' }}</div>
                <div class="nutrition-label">脂肪(g)</div>
              </div>
              <div class="nutrition-item">
                <div class="nutrition-value">{{ currentDish.nutrition.fiber || '-' }}</div>
                <div class="nutrition-label">纤维(g)</div>
              </div>
            </div>
          </div>

          <!-- 烹饪过程 -->
          <div class="cooking-steps-section">
            <div class="detail-section-title">烹饪步骤</div>
            <div class="cooking-steps-list">
              <div v-for="(step, index) in cookingSteps" :key="index" class="cooking-step-item">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-text">{{ step }}</div>
              </div>
            </div>
          </div>

          <!-- 规格选择区 -->
          <div class="detail-specs" v-if="currentDish.spec_groups && currentDish.spec_groups.length">
            <div
              v-for="group in currentDish.spec_groups"
              :key="group.name"
              class="spec-group"
            >
              <div class="spec-group-title">{{ group.name }}</div>
              <van-radio-group
                v-model="selectedSpecs[group.name]"
                direction="horizontal"
                class="spec-options"
              >
                <van-radio
                  v-for="opt in group.options"
                  :key="opt"
                  :name="opt"
                  class="spec-radio"
                >{{ opt }}</van-radio>
              </van-radio-group>
            </div>
          </div>

          <!-- 份数选择 -->
          <div class="detail-quantity">
            <span class="quantity-label">份数</span>
            <van-stepper v-model="detailQuantity" min="1" max="20" theme="round" />
          </div>

          <!-- 备注输入 -->
          <div class="detail-notes">
            <van-field
              v-model="detailNotes"
              type="textarea"
              placeholder="忌口、过敏等备注"
              rows="2"
              autosize
              maxlength="200"
              show-word-limit
            />
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="detail-footer">
          <div class="detail-footer-left">
            <span class="detail-total-kcal">
              {{ Math.round((currentDish.nutrition && currentDish.nutrition.per_serving_kcal || 0) * detailQuantity) }} kcal
            </span>
          </div>
          <van-button
            type="primary"
            round
            block
            class="detail-add-btn"
            @click="addToCart"
          >加入备餐篮</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 备餐篮弹层 -->
    <van-popup
      v-model:show="showCartPopup"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <div class="cart-popup">
        <div class="cart-popup-header">
          <span class="cart-popup-title">备餐篮</span>
          <van-icon name="cross" size="20" @click="showCartPopup = false" />
        </div>
        <div class="cart-popup-body">
          <div
            v-for="(item, index) in cartStore.items"
            :key="index"
            class="cart-item"
          >
            <div class="cart-item-info">
              <div class="cart-item-cover">
                <van-image
                  v-if="item.cover"
                  :src="item.cover"
                  width="48"
                  height="48"
                  radius="6"
                  fit="cover"
                />
                <div v-else class="cart-item-cover-placeholder">
                  <van-icon name="photo-o" size="18" color="#ccc" />
                </div>
              </div>
              <div class="cart-item-detail">
                <div class="cart-item-name">{{ item.name }}</div>
                <div class="cart-item-specs" v-if="Object.keys(item.specs).length">
                  {{ formatSpecs(item.specs) }}
                </div>
                <div class="cart-item-kcal">
                  {{ Math.round((item.nutrition && item.nutrition.per_serving_kcal || 0) * item.quantity) }} kcal
                </div>
              </div>
            </div>
            <div class="cart-item-actions">
              <van-stepper
                :model-value="item.quantity"
                @update:model-value="(val) => cartStore.updateQuantity(index, val)"
                min="1"
                max="20"
                theme="round"
                size="small"
              />
              <van-icon
                name="delete-o"
                size="20"
                color="#FF4D4F"
                class="cart-item-delete"
                @click="cartStore.removeItem(index)"
              />
            </div>
          </div>
          <van-empty v-if="cartStore.items.length === 0" description="备餐篮是空的" />
        </div>
        <div class="cart-popup-footer" v-if="cartStore.items.length > 0">
          <div class="cart-nutrition-summary">
            <div class="cart-nutrition-row">
              <span>总热量</span>
              <span class="cart-nutrition-val">{{ Math.round(cartStore.totalNutrition.per_serving_kcal || 0) }} kcal</span>
            </div>
            <div class="cart-nutrition-row">
              <span>蛋白质</span>
              <span class="cart-nutrition-val">{{ (cartStore.totalNutrition.protein || 0).toFixed(1) }} g</span>
            </div>
            <div class="cart-nutrition-row">
              <span>碳水</span>
              <span class="cart-nutrition-val">{{ (cartStore.totalNutrition.carb || 0).toFixed(1) }} g</span>
            </div>
            <div class="cart-nutrition-row">
              <span>脂肪</span>
              <span class="cart-nutrition-val">{{ (cartStore.totalNutrition.fat || 0).toFixed(1) }} g</span>
            </div>
          </div>
          <van-button
            type="primary"
            round
            block
            class="cart-submit-btn"
            @click="submitOrder"
          >生成备餐清单</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useCartStore } from '../../store/cart'
import { getCategories, getDishes, getDishDetail } from '../../api/dishes'
import { createOrder } from '../../api/orders'
import { getToken } from '../../utils/auth'

const router = useRouter()
const cartStore = useCartStore()

// 搜索
const searchText = ref('')

// 分类与菜品数据
const categories = ref([])
const dishesMap = ref({}) // { categoryId: [dishes] }
const activeCategoryId = ref(null)
const dishListRef = ref(null)

// 菜品详情弹层
const showDetailPopup = ref(false)
const currentDish = ref(null)
const selectedSpecs = ref({})
const detailQuantity = ref(1)
const detailNotes = ref('')
const cookingSteps = ref([])

// 备餐篮弹层
const showCartPopup = ref(false)

// 加载数据
async function loadData() {
  try {
    showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 })
    const [catRes, dishRes] = await Promise.all([
      getCategories(),
      getDishes()
    ])
    closeToast()
    // 后端返回 { code: 200, message, data: [...] }，axios 拦截器已返回 res.data
    const catList = catRes.data || catRes || []
    const dishList = dishRes.data || dishRes || []
    console.log('分类数据:', catList)
    console.log('菜品数据:', dishList)
    categories.value = catList
    // 按分类分组菜品
    const map = {}
    dishList.forEach(dish => {
      const cid = dish.category_id
      if (!map[cid]) map[cid] = []
      map[cid].push(dish)
    })
    dishesMap.value = map
    console.log('分组后的菜品:', map)
    if (catList.length > 0) {
      activeCategoryId.value = catList[0].id
    }
  } catch (e) {
    closeToast()
    console.error('加载数据失败:', e)
    showToast('加载数据失败')
  }
}

async function loadDishes(categoryId) {
  // 已一次性加载，无需再次请求
}

// 搜索过滤
const filteredCategories = computed(() => {
  if (!searchText.value.trim()) return categories.value
  const keyword = searchText.value.trim().toLowerCase()
  return categories.value.filter(cat => {
    const dishes = dishesMap.value[cat.id] || []
    return dishes.some(d => d.name && d.name.toLowerCase().includes(keyword))
  })
})

// 获取分类下的菜品（带搜索过滤）
function getDishesByCategoryFiltered(categoryId) {
  const dishes = dishesMap.value[categoryId] || []
  if (!searchText.value.trim()) return dishes
  const keyword = searchText.value.trim().toLowerCase()
  return dishes.filter(d => d.name && d.name.toLowerCase().includes(keyword))
}

// 兼容模板中的方法名
function getDishesByCategory(catId) {
  return getDishesByCategoryFiltered(catId)
}

// 选择分类
async function selectCategory(catId) {
  activeCategoryId.value = catId
  await loadDishes(catId)
  // 滚动到对应分组
  nextTick(() => {
    const el = document.getElementById('cat-' + catId)
    if (el && dishListRef.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 快速添加
function quickAdd(dish) {
  cartStore.addItem(dish, {}, 1, '')
  showToast({ message: '已添加', icon: 'success', duration: 800 })
}

// 打开详情
async function openDetail(dish) {
  currentDish.value = dish
  selectedSpecs.value = {}
  detailQuantity.value = 1
  detailNotes.value = ''

  // 如果有规格组，初始化默认选中
  if (dish.spec_groups && dish.spec_groups.length) {
    dish.spec_groups.forEach(group => {
      if (group.options && group.options.length) {
        selectedSpecs.value[group.name] = group.options[0]
      }
    })
  }

  // 尝试获取详情
  try {
    const res = await getDishDetail(dish.id)
    const detail = res.data || res
    if (detail) {
      currentDish.value = detail
      if (detail.spec_groups && detail.spec_groups.length) {
        detail.spec_groups.forEach(group => {
          if (group.options && group.options.length && !selectedSpecs.value[group.name]) {
            selectedSpecs.value[group.name] = group.options[0]
          }
        })
      }
    }
  } catch (e) {
    console.error('获取菜品详情失败:', e)
  }

  cookingSteps.value = getCookingSteps(currentDish.value)
  showDetailPopup.value = true
}

// 生成烹饪步骤
function getCookingSteps(dish) {
  const stepsMap = {
    '番茄炒蛋': [
      '番茄洗净切块，鸡蛋打散加少许盐搅匀',
      '锅中热油，倒入蛋液炒至凝固盛出',
      '锅中再加少许油，放入番茄块翻炒出汁',
      '加入炒好的鸡蛋，加盐和少许糖调味',
      '翻炒均匀即可出锅装盘'
    ],
    '红烧肉': [
      '五花肉切块，冷水下锅焯水去血沫',
      '锅中放少许油，加入冰糖小火炒至焦糖色',
      '放入肉块翻炒上色',
      '加入生抽、老抽、料酒和适量热水',
      '大火烧开后转小火炖40分钟',
      '大火收汁，汤汁浓稠即可出锅'
    ],
    '宫保鸡丁': [
      '鸡胸肉切丁，加料酒、淀粉腌制15分钟',
      '花生米炒熟备用，干辣椒切段',
      '调碗汁：醋、酱油、糖、淀粉水混合',
      '锅中热油爆香干辣椒和花椒',
      '放入鸡丁翻炒变色，倒入碗汁',
      '加入花生米快速翻炒均匀出锅'
    ],
    '清炒时蔬': [
      '蔬菜洗净切段或切块',
      '锅中烧开水，蔬菜焯水30秒捞出',
      '锅中热油，放入蒜末爆香',
      '放入蔬菜大火快炒',
      '加盐和少许鸡精调味即可'
    ],
    '鱼香肉丝': [
      '猪里脊切丝，加料酒和淀粉腌制',
      '木耳泡发切丝，胡萝卜和青椒切丝',
      '调鱼香汁：醋、酱油、糖、豆瓣酱、淀粉水',
      '锅中热油炒肉丝变色盛出',
      '锅中爆香蒜末，放入配菜翻炒',
      '倒入肉丝和鱼香汁翻炒均匀出锅'
    ]
  }

  // 通用烹饪步骤（没有特定步骤的菜品使用）
  const defaultSteps = [
    `准备${dish.name}的食材和调料`,
    '将主要食材清洗干净，切成适当大小',
    '锅中热油，放入主料翻炒',
    '加入调味料，翻炒均匀',
    '调整火候，继续烹饪至熟透',
    '出锅装盘，即可享用'
  ]

  return stepsMap[dish.name] || defaultSteps
}

// 加入备餐篮
function addToCart() {
  if (!getToken()) {
    showToast('请先登录后再添加菜品')
    return
  }
  if (!currentDish.value) return
  cartStore.addItem(
    currentDish.value,
    { ...selectedSpecs.value },
    detailQuantity.value,
    detailNotes.value
  )
  showToast({ message: '已加入备餐篮', icon: 'success', duration: 800 })
  showDetailPopup.value = false
}

// 格式化规格
function formatSpecs(specs) {
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(' / ')
}

// 提交订单
async function submitOrder() {
  if (!getToken()) {
    showToast('请先登录后再提交订单')
    router.push('/login')
    return
  }
  if (cartStore.items.length === 0) return
  try {
    showLoadingToast({ message: '生成中...', forbidClick: true, duration: 0 })
    const cartItems = cartStore.items.map(item => ({
      dish_id: item.dish_id,
      name: item.name,
      specs: item.specs,
      quantity: item.quantity,
      nutrition: item.nutrition,
      notes: item.notes
    }))
    const notes = cartItems.map(item => item.notes).filter(Boolean).join('; ')
    await createOrder({ items: cartItems, notes: notes })
    closeToast()
    cartStore.clearCart()
    showCartPopup.value = false
    showToast({ message: '备餐清单已生成', icon: 'success', duration: 1000 })
    setTimeout(() => {
      router.push('/orders')
    }, 1000)
  } catch (e) {
    closeToast()
    console.error('创建订单失败:', e)
    showToast({ message: '创建失败，请重试', icon: 'fail' })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.order-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 104px);
  background: var(--color-bg);
}

.order-search {
  flex-shrink: 0;
  padding: 4px 0;
}

/* 主体区域 */
.order-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* 左侧分类 */
.category-sidebar {
  width: 80px;
  flex-shrink: 0;
  background: var(--color-bg);
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.category-item.active {
  background: var(--color-primary);
  color: #fff;
  border-left-color: var(--color-primary);
}

.category-item .van-icon {
  margin-bottom: 4px;
}

.category-name {
  text-align: center;
  line-height: 1.2;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧菜品列表 */
.dish-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.dish-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 0 8px 0;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.group-desc {
  font-size: 12px;
  color: var(--color-text-hint);
}

/* 菜品卡片 */
.dish-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: var(--color-bg-white);
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
}

.dish-cover {
  flex-shrink: 0;
}

.dish-cover-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dish-info {
  flex: 1;
  min-width: 0;
  padding-right: 28px;
}

.dish-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-desc {
  font-size: 12px;
  color: var(--color-text-hint);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-nutrition-badges {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.nutrition-badge {
  font-size: 11px;
  color: var(--color-primary);
  background: rgba(0, 181, 120, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

.dish-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.dish-tag {
  font-size: 10px;
}

.dish-action {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

/* 底部备餐篮浮动栏 */
.cart-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  height: 48px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 90;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
}

.cart-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.cart-icon-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -10px;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 10px;
  color: #fff;
  background: var(--color-danger);
  border-radius: 8px;
  padding: 0 4px;
}

.cart-summary {
  display: flex;
  flex-direction: column;
}

.cart-total-kcal {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.cart-bar-btn {
  width: auto;
  padding: 0 16px;
  height: 32px;
}

/* 菜品详情弹层 */
.detail-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.detail-cover {
  width: 100%;
  overflow: hidden;
}

.detail-cover-placeholder {
  width: 100%;
  height: 200px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  padding: 12px 16px;
}

.detail-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  line-height: 1.5;
}

/* 营养信息 */
.detail-nutrition {
  margin: 0 16px 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 8px;
}

.nutrition-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.nutrition-unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-hint);
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.nutrition-item {
  text-align: center;
  padding: 8px 4px;
  background: var(--color-bg-white);
  border-radius: 6px;
}

.nutrition-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.nutrition-label {
  font-size: 11px;
  color: var(--color-text-hint);
  margin-top: 2px;
}

/* 烹饪步骤 */
.cooking-steps-section {
  padding: 12px 16px;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.cooking-steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cooking-step-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary, #00B578);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-text {
  font-size: 13px;
  color: var(--color-text-primary, #1A1A1A);
  line-height: 22px;
}

/* 规格选择 */
.detail-specs {
  padding: 0 16px;
  margin-bottom: 12px;
}

.spec-group {
  margin-bottom: 12px;
}

.spec-group-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-radio {
  margin-right: 0;
}

.spec-radio :deep(.van-radio__label) {
  font-size: 13px;
}

/* 份数选择 */
.detail-quantity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.quantity-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* 备注 */
.detail-notes {
  padding: 0 16px;
  margin-bottom: 12px;
}

.detail-notes :deep(.van-field) {
  background: var(--color-bg);
  border-radius: 8px;
}

/* 详情底部操作栏 */
.detail-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-bg-white);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.detail-footer-left {
  flex: 1;
}

.detail-total-kcal {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.detail-add-btn {
  width: 140px;
  flex-shrink: 0;
}

/* 备餐篮弹层 */
.cart-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.cart-popup-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.cart-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cart-item-cover-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-item-detail {
  flex: 1;
  min-width: 0;
}

.cart-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-specs {
  font-size: 12px;
  color: var(--color-text-hint);
  margin-top: 2px;
}

.cart-item-kcal {
  font-size: 12px;
  color: var(--color-primary);
  margin-top: 2px;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cart-item-delete {
  cursor: pointer;
}

/* 备餐篮底部 */
.cart-popup-footer {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  background: var(--color-bg-white);
}

.cart-nutrition-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 16px;
  margin-bottom: 12px;
}

.cart-nutrition-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.cart-nutrition-val {
  font-weight: 500;
  color: var(--color-text-primary);
}

.cart-submit-btn {
  height: 40px;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
