<template>
  <div class="orders-page">
    <!-- 顶部 Tab -->
    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="今日备餐" name="today" />
      <van-tab title="历史记录" name="history" />
    </van-tabs>

    <!-- 订单列表 -->
    <div class="orders-list" v-if="orders.length > 0">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <!-- 订单头部 -->
        <div class="order-card-header">
          <div class="order-status-wrap">
            <van-tag
              :type="statusTagType(order.status)"
              size="medium"
              round
            >{{ statusLabel(order.status) }}</van-tag>
          </div>
          <div class="order-time">{{ formatTime(order.created_at) }}</div>
        </div>

        <!-- 菜品列表 -->
        <div class="order-dishes">
          <div
            v-for="(item, idx) in (order.items || [])"
            :key="idx"
            class="order-dish-item"
          >
            <span class="order-dish-name">{{ item.name }}</span>
            <span class="order-dish-qty">x{{ item.quantity }}</span>
          </div>
        </div>

        <!-- 营养总览 -->
        <div class="order-nutrition" v-if="order.total_nutrition">
          <div class="order-nutrition-item">
            <span class="order-nutrition-label">热量</span>
            <span class="order-nutrition-value">{{ Math.round(order.total_nutrition.per_serving_kcal || 0) }} kcal</span>
          </div>
          <div class="order-nutrition-item">
            <span class="order-nutrition-label">蛋白质</span>
            <span class="order-nutrition-value">{{ (order.total_nutrition.protein || 0).toFixed(1) }} g</span>
          </div>
          <div class="order-nutrition-item">
            <span class="order-nutrition-label">碳水</span>
            <span class="order-nutrition-value">{{ (order.total_nutrition.carb || 0).toFixed(1) }} g</span>
          </div>
          <div class="order-nutrition-item">
            <span class="order-nutrition-label">脂肪</span>
            <span class="order-nutrition-value">{{ (order.total_nutrition.fat || 0).toFixed(1) }} g</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="order-actions">
          <van-button
            size="small"
            round
            plain
            type="primary"
            @click="goToPrepList(order.id)"
          >查看备餐清单</van-button>
          <van-button
            v-if="order.status === 'planning' && userStore.role === 'admin'"
            size="small"
            round
            type="primary"
            @click="updateStatus(order.id, 'doing')"
          >开始制作</van-button>
          <van-button
            v-if="order.status === 'doing' && userStore.role === 'admin'"
            size="small"
            round
            type="success"
            @click="updateStatus(order.id, 'done')"
          >完成</van-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <!-- 未登录提示（内联，不阻挡TabBar） -->
    <div v-if="showLoginPrompt" class="login-prompt-inline">
      <van-icon name="warning-o" size="40" color="#FF9800" />
      <p>登录后查看订单记录</p>
      <van-button type="primary" color="#00B578" size="small" round @click="goLogin">去登录</van-button>
    </div>

    <!-- 已登录但无订单 -->
    <van-empty v-else-if="orders.length === 0" description="暂无订单记录" class="orders-empty" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getOrders, updateOrderStatus } from '../../api/orders'
import { formatDate } from '../../utils/format'
import { getToken } from '../../utils/auth'
import { useUserStore } from '../../store/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('today')
const orders = ref([])
const loading = ref(false)
const showLoginPrompt = ref(false)

const statusMap = {
  planning: '备餐中',
  doing: '制作中',
  done: '已完成'
}

function statusLabel(status) {
  return statusMap[status] || status
}

function statusTagType(status) {
  const map = {
    planning: 'primary',
    doing: 'warning',
    done: 'success'
  }
  return map[status] || 'default'
}

function formatTime(date) {
  if (!date) return ''
  return formatDate(date, 'MM-DD HH:mm')
}

async function loadOrders() {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value === 'today') {
      params.status = 'planning,doing'
    } else {
      params.status = 'done'
    }
    const res = await getOrders(params)
    orders.value = res.data || res || []
  } catch (e) {
    console.error('加载订单失败:', e)
    orders.value = []
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  loadOrders()
}

function goToPrepList(orderId) {
  router.push(`/orders/prep/${orderId}`)
}

async function updateStatus(orderId, status) {
  try {
    showLoadingToast({ message: '更新中...', forbidClick: true, duration: 0 })
    await updateOrderStatus(orderId, status)
    closeToast()
    showToast({ message: '状态已更新', icon: 'success', duration: 800 })
    loadOrders()
  } catch (e) {
    closeToast()
    console.error('更新状态失败:', e)
    showToast({ message: '操作失败，请重试', icon: 'fail' })
  }
}

onMounted(() => {
  if (!getToken()) {
    showLoginPrompt.value = true
  }
  loadOrders()
})

function goLogin() {
  showLoginPrompt.value = false
  router.push('/login')
}
</script>

<style scoped>
.orders-page {
  min-height: 100%;
  background: var(--color-bg);
  padding-bottom: 16px;
}

.orders-list {
  padding: 12px;
}

.order-card {
  background: var(--color-bg-white);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-time {
  font-size: 12px;
  color: var(--color-text-hint);
}

.order-dishes {
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 8px 0;
  margin-bottom: 10px;
}

.order-dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.order-dish-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.order-dish-qty {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.order-nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.order-nutrition-item {
  text-align: center;
  padding: 6px 0;
  background: var(--color-bg);
  border-radius: 6px;
}

.order-nutrition-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-hint);
  margin-bottom: 2px;
}

.order-nutrition-value {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.order-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.orders-empty {
  padding-top: 60px;
}

.login-prompt-inline {
  text-align: center;
  padding: 48px 20px;
}

.login-prompt-inline p {
  margin: 12px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
