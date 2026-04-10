<template>
  <div class="home-page">
    <!-- 顶部问候区域 -->
    <div class="greeting-section">
      <div class="greeting-text">
        <span class="greeting-label">{{ greetingLabel }}，{{ displayName }}</span>
        <span class="greeting-sub">今天想吃点什么？</span>
      </div>
      <div class="greeting-icon" @click="showReminder = true">
        <van-icon name="bell" size="22" color="#666" />
      </div>
    </div>

    <!-- Banner 轮播 -->
    <div class="banner-section">
      <van-swipe :autoplay="4000" indicator-color="#fff" :lazy-render="true" class="banner-swipe">
        <van-swipe-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-card" :style="{ background: banner.gradient }">
            <div class="banner-content">
              <div class="banner-title">{{ banner.title }}</div>
              <div class="banner-subtitle">{{ banner.subtitle }}</div>
            </div>
            <div class="banner-decoration">
              <van-icon :name="banner.icon" size="48" color="rgba(255,255,255,0.2)" />
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-entry-section">
      <div class="quick-entry-grid">
        <div
          v-for="(entry, index) in quickEntries"
          :key="index"
          class="quick-entry-item"
          @click="handleQuickEntry(entry)"
        >
          <div class="entry-icon-wrap" :style="{ background: entry.bgColor }">
            <van-icon :name="entry.icon" size="24" color="#fff" />
          </div>
          <span class="entry-label">{{ entry.label }}</span>
        </div>
      </div>
    </div>

    <!-- 今日备餐进度 -->
    <div class="prep-progress-section card">
      <div class="section-header">
        <span class="section-title">今日备餐计划</span>
      </div>
      <template v-if="currentOrder">
        <div class="progress-info">
          <div class="progress-text">
            已完成 <span class="progress-num">{{ completedCount }}</span> / {{ currentOrder.dishes.length }} 道菜
          </div>
          <van-progress
            :percentage="progressPercentage"
            :show-pivot="false"
            color="var(--color-primary)"
            track-color="#E8F5E9"
            stroke-width="8"
          />
        </div>
        <div class="completed-dishes-scroll">
          <div
            v-for="dish in completedDishes"
            :key="dish.id"
            class="completed-dish-card"
          >
            <div class="dish-thumb">
              <img v-if="dish.cover" :src="dish.cover" :alt="dish.name" />
              <div v-else class="dish-thumb-placeholder">
                <van-icon name="photo-o" size="20" color="#ccc" />
              </div>
            </div>
            <span class="dish-name">{{ dish.name }}</span>
            <van-icon name="success" size="16" color="var(--color-primary)" />
          </div>
        </div>
        <van-button
          type="primary"
          size="small"
          round
          block
          color="var(--color-primary)"
          @click="$router.push('/orders')"
        >
          查看详情
        </van-button>
      </template>
      <template v-else>
        <div class="empty-prep">
          <div class="empty-prep-icon">
            <van-icon name="orders-o" size="48" color="#ccc" />
          </div>
          <span class="empty-prep-text">还没有备餐计划</span>
          <van-button
            type="primary"
            size="small"
            round
            color="var(--color-primary)"
            @click="$router.push('/order')"
          >
            开始备餐
          </van-button>
        </div>
      </template>
    </div>

    <!-- 推荐菜品 -->
    <div class="recommend-section">
      <div class="section-header">
        <span class="section-title">为你推荐</span>
        <span class="section-more" @click="$router.push('/order')">查看更多 <van-icon name="arrow" size="12" /></span>
      </div>
      <div class="recommend-scroll">
        <div
          v-for="dish in recommendDishes"
          :key="dish.id"
          class="recommend-card"
          @click="goToDish(dish)"
        >
          <div class="recommend-cover">
            <img v-if="dish.cover" :src="dish.cover" :alt="dish.name" />
            <div v-else class="recommend-cover-placeholder">
              <van-icon name="photo-o" size="32" color="#ddd" />
            </div>
          </div>
          <div class="recommend-info">
            <span class="recommend-name">{{ dish.name }}</span>
            <span class="recommend-calorie" v-if="dish.nutrition">
              {{ dish.nutrition.calories || dish.nutrition.calorie || '--' }} kcal
            </span>
          </div>
        </div>
      </div>
      <div v-if="loadingDishes" class="loading-wrap">
        <van-loading size="24" color="var(--color-primary)" />
      </div>
    </div>

    <!-- 营养小贴士 -->
    <div class="tips-section card">
      <div class="section-header">
        <span class="section-title">每日营养小知识</span>
        <van-icon name="replay" size="16" color="#999" class="tips-refresh" @click="refreshTip" />
      </div>
      <div class="tip-card">
        <div class="tip-icon-wrap">
          <van-icon name="bulb-o" size="20" color="var(--color-primary)" />
        </div>
        <div class="tip-content">
          <p class="tip-text">{{ currentTip }}</p>
        </div>
      </div>
    </div>

    <!-- 营养小贴士弹窗 -->
    <van-dialog
      v-model:show="showTipPopup"
      title="营养小贴士"
      confirm-button-text="我知道了"
    >
      <div class="tip-popup-content">
        <div v-for="(tip, index) in nutritionTips" :key="index" class="tip-popup-item">
          <div class="tip-popup-num">{{ index + 1 }}</div>
          <p>{{ tip }}</p>
        </div>
      </div>
    </van-dialog>

    <!-- 备餐提醒弹窗 -->
    <van-dialog
      v-model:show="showReminder"
      title="备餐提醒"
      confirm-button-text="好的"
    >
      <div class="reminder-content">
        <div v-if="currentOrder" class="reminder-has-order">
          <van-icon name="todo-list-o" size="40" color="var(--color-primary)" />
          <p>您有正在进行的备餐计划</p>
          <p class="reminder-detail">已完成 {{ completedCount }} / {{ currentOrder.dishes.length }} 道菜</p>
        </div>
        <div v-else class="reminder-no-order">
          <van-icon name="clock-o" size="40" color="#FF9800" />
          <p>今天还没有备餐计划</p>
          <p class="reminder-detail">点击下方按钮开始备餐吧</p>
          <van-button
            type="primary"
            size="small"
            round
            color="var(--color-primary)"
            @click="showReminder = false; $router.push('/order')"
          >
            开始备餐
          </van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 我的食谱弹窗 -->
    <van-popup v-model:show="showFavoritesPanel" position="bottom" round :style="{ maxHeight: '70%' }">
      <div class="panel-popup">
        <div class="panel-header">
          <span class="panel-title">我的食谱</span>
          <van-icon name="cross" size="20" @click="showFavoritesPanel = false" />
        </div>
        <div v-if="favorites.length === 0" class="panel-empty">
          <van-icon name="star-o" size="48" color="#ddd" />
          <p>还没有收藏菜品</p>
          <p class="panel-empty-hint">去点单页浏览并收藏喜欢的菜品吧</p>
          <van-button size="small" round color="#00B578" @click="showFavoritesPanel = false; $router.push('/order')">
            去看看
          </van-button>
        </div>
        <div v-else class="panel-list">
          <div v-for="item in favorites" :key="item.dish_id" class="panel-item">
            <van-image v-if="item.cover" :src="item.cover" width="60" height="60" radius="8" fit="cover" />
            <div v-else class="panel-item-placeholder">
              <van-icon name="photo-o" size="24" color="#ccc" />
            </div>
            <div class="panel-item-info">
              <div class="panel-item-name">{{ item.name }}</div>
              <div class="panel-item-kcal" v-if="item.nutrition">{{ item.nutrition.per_serving_kcal }} kcal/份</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 家庭偏好弹窗 -->
    <van-popup v-model:show="showPreferencesPanel" position="bottom" round :style="{ maxHeight: '70%' }">
      <div class="panel-popup">
        <div class="panel-header">
          <span class="panel-title">家庭偏好</span>
          <van-icon name="cross" size="20" @click="showPreferencesPanel = false" />
        </div>
        <div v-if="familyMembers.length === 0" class="panel-empty">
          <van-icon name="friends-o" size="48" color="#ddd" />
          <p>还没有添加家庭成员</p>
          <p class="panel-empty-hint">添加家庭成员后可以更好地推荐菜品</p>
          <van-button size="small" round color="#00B578" @click="showPreferencesPanel = false; $router.push('/profile')">
            去设置
          </van-button>
        </div>
        <div v-else class="panel-list">
          <div v-for="(member, index) in familyMembers" :key="index" class="panel-item member-item">
            <div class="member-avatar">{{ (member.nickname || '?')[0] }}</div>
            <div class="panel-item-info">
              <div class="panel-item-name">{{ member.nickname }}</div>
              <div class="member-tags" v-if="member.preferences && member.preferences.length">
                <van-tag v-for="tag in member.preferences" :key="tag" size="small" plain type="primary" class="member-tag">{{ tag }}</van-tag>
              </div>
              <div class="member-allergy" v-if="member.allergy">{{ member.allergy }}</div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { useUserStore } from '../../store/user'
import { getDishes } from '../../api/dishes'
import { getOrders } from '../../api/orders'

const router = useRouter()
const userStore = useUserStore()

// 问候语
const greetingLabel = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const displayName = computed(() => {
  if (userStore.isLoggedIn && userStore.userInfo) {
    return userStore.userInfo.nickname || userStore.userInfo.username || '用户'
  }
  return '你好'
})

// Banner 数据
const banners = [
  {
    title: '今日家庭套餐推荐',
    subtitle: '营养均衡，全家满意',
    gradient: 'linear-gradient(135deg, #00B578 0%, #43C67A 100%)',
    icon: 'home-o'
  },
  {
    title: '低脂健康食谱',
    subtitle: '轻食主义，健康生活',
    gradient: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
    icon: 'heart-o'
  },
  {
    title: '周末亲子烘焙',
    subtitle: '和孩子一起动手',
    gradient: 'linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)',
    icon: 'smile-o'
  },
  {
    title: '快手15分钟晚餐',
    subtitle: '忙碌也不将就',
    gradient: 'linear-gradient(135deg, #6C9E77 0%, #4A8B5C 100%)',
    icon: 'clock-o'
  }
]

// 快捷入口
const quickEntries = [
  { label: '开始备餐', icon: 'shopping-cart-o', bgColor: '#00B578', action: 'order' },
  { label: '我的食谱', icon: 'star-o', bgColor: '#FF9800', action: 'favorites' },
  { label: '家庭偏好', icon: 'friends-o', bgColor: '#2196F3', action: 'preferences' },
  { label: '营养知识', icon: 'info-o', bgColor: '#9C27B0', action: 'tips' }
]

function handleQuickEntry(entry) {
  switch (entry.action) {
    case 'order':
      router.push('/order')
      break
    case 'favorites':
      // 在首页内展示我的食谱
      showFavoritesPanel.value = true
      break
    case 'preferences':
      // 在首页内展示家庭偏好
      showPreferencesPanel.value = true
      break
    case 'tips':
      showTipPopup.value = true
      break
  }
}

// 今日备餐进度
const currentOrder = ref(null)
const loadingDishes = ref(false)

const completedDishes = computed(() => {
  if (!currentOrder.value) return []
  return currentOrder.value.dishes.filter(d => d.status === 'completed')
})

const completedCount = computed(() => completedDishes.value.length)

const progressPercentage = computed(() => {
  if (!currentOrder.value || !currentOrder.value.dishes.length) return 0
  return Math.round((completedCount.value / currentOrder.value.dishes.length) * 100)
})

async function fetchCurrentOrder() {
  try {
    const res = await getOrders({ status: 'in_progress', limit: 1 })
    if (res && res.data && res.data.length > 0) {
      currentOrder.value = res.data[0]
    } else {
      currentOrder.value = null
    }
  } catch (e) {
    // 静默处理
    currentOrder.value = null
  }
}

// 推荐菜品
const recommendDishes = ref([])

async function fetchRecommendDishes() {
  loadingDishes.value = true
  try {
    const res = await getDishes({ limit: 8 })
    recommendDishes.value = (res && res.data) ? res.data.slice(0, 8) : []
  } catch (e) {
    recommendDishes.value = []
  } finally {
    loadingDishes.value = false
  }
}

function goToDish(dish) {
  router.push({ path: '/order', query: { dish: dish.id } })
}

// 营养小贴士
const nutritionTips = [
  '成年人每日推荐摄入蛋白质 60-75g，约等于 3 个鸡蛋',
  '每天蔬菜摄入量建议 300-500g，深色蔬菜占一半以上',
  '烹饪时少油少盐，每人每天食盐不超过 5g',
  '主食粗细搭配，全谷物和杂豆类占主食总量的三分之一',
  '每天饮水 1500-1700ml，首选白开水'
]

const currentTipIndex = ref(0)
const currentTip = computed(() => nutritionTips[currentTipIndex.value])

function refreshTip() {
  currentTipIndex.value = (currentTipIndex.value + 1) % nutritionTips.length
  showSuccessToast('已刷新')
}

// 弹窗状态
const showTipPopup = ref(false)
const showReminder = ref(false)
const showFavoritesPanel = ref(false)
const showPreferencesPanel = ref(false)

// 收藏数据
const favorites = ref(JSON.parse(localStorage.getItem('make_dinner_favorites') || '[]'))

// 家庭成员数据
const familyMembers = ref(JSON.parse(localStorage.getItem('make_dinner_family_members') || '[]'))

// 初始化
onMounted(() => {
  fetchCurrentOrder()
  fetchRecommendDishes()
  // 随机选择一条小贴士
  currentTipIndex.value = Math.floor(Math.random() * nutritionTips.length)
})
</script>

<style scoped>
.home-page {
  padding: 0 var(--spacing-lg) var(--spacing-xxl);
  min-height: 100vh;
}

/* 顶部问候区域 */
.greeting-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) 0 var(--spacing-md);
}

.greeting-text {
  display: flex;
  flex-direction: column;
}

.greeting-label {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.greeting-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  margin-top: 4px;
}

.greeting-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: 50%;
  cursor: pointer;
}

/* Banner 轮播 */
.banner-section {
  margin-bottom: var(--spacing-lg);
}

.banner-swipe {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.banner-card {
  height: 140px;
  border-radius: var(--radius-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.banner-content {
  flex: 1;
  z-index: 1;
}

.banner-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.banner-subtitle {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.85);
}

.banner-decoration {
  z-index: 0;
  opacity: 0.3;
}

/* 快捷入口 */
.quick-entry-section {
  margin-bottom: var(--spacing-lg);
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.quick-entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.entry-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.quick-entry-item:active .entry-icon-wrap {
  transform: scale(0.92);
}

.entry-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* 通用区块 */
.card {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-more {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 今日备餐进度 */
.prep-progress-section {
  margin-bottom: var(--spacing-lg);
}

.progress-info {
  margin-bottom: var(--spacing-md);
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.progress-num {
  font-weight: 600;
  color: var(--color-primary);
}

.completed-dishes-scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.completed-dishes-scroll::-webkit-scrollbar {
  display: none;
}

.completed-dish-card {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F0FFF4;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

.dish-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.dish-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.dish-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.empty-prep {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl) 0;
  gap: var(--spacing-md);
}

.empty-prep-icon {
  margin-bottom: var(--spacing-xs);
}

.empty-prep-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
}

/* 推荐菜品 */
.recommend-section {
  margin-bottom: var(--spacing-lg);
}

.recommend-scroll {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.recommend-scroll::-webkit-scrollbar {
  display: none;
}

.recommend-card {
  flex-shrink: 0;
  width: 130px;
  cursor: pointer;
  transition: transform 0.2s;
}

.recommend-card:active {
  transform: scale(0.96);
}

.recommend-cover {
  width: 130px;
  height: 130px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 8px;
  background: #f5f5f5;
}

.recommend-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommend-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recommend-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-calorie {
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
}

/* 营养小贴士 */
.tips-section {
  margin-bottom: var(--spacing-lg);
}

.tips-refresh {
  cursor: pointer;
  transition: transform 0.3s;
}

.tips-refresh:active {
  transform: rotate(180deg);
}

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.tip-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.tip-content {
  flex: 1;
}

.tip-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 营养小贴士弹窗 */
.tip-popup-content {
  padding: var(--spacing-lg);
  max-height: 400px;
  overflow-y: auto;
}

.tip-popup-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.tip-popup-item:last-child {
  margin-bottom: 0;
}

.tip-popup-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-popup-item p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 备餐提醒弹窗 */
.reminder-content {
  padding: var(--spacing-xl) var(--spacing-lg);
  text-align: center;
}

.reminder-has-order,
.reminder-no-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.reminder-detail {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  margin: 0;
}

.reminder-content p {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

/* 弹窗面板 */
.panel-popup {
  padding: 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.panel-empty {
  text-align: center;
  padding: 24px 0;
}

.panel-empty p {
  margin: 8px 0 4px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.panel-empty-hint {
  color: var(--color-text-hint) !important;
  font-size: 12px !important;
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
}

.panel-item-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel-item-info {
  flex: 1;
}

.panel-item-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.panel-item-kcal {
  font-size: 12px;
  color: var(--color-text-hint);
}

.member-item {
  padding: 12px;
  background: var(--color-bg);
  border-radius: 12px;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00B578, #009A63);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.member-tag {
  font-size: 11px;
}

.member-allergy {
  font-size: 12px;
  color: #FF4D4F;
}
</style>
