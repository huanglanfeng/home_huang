<template>
  <div class="admin-dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row" v-loading="loading">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-card--blue">
          <div class="stat-card__content">
            <div class="stat-card__info">
              <p class="stat-card__label">菜品总数</p>
              <h3 class="stat-card__value">{{ stats.dishCount }}</h3>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="36"><Dish /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-card--green">
          <div class="stat-card__content">
            <div class="stat-card__info">
              <p class="stat-card__label">分类总数</p>
              <h3 class="stat-card__value">{{ stats.categoryCount }}</h3>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="36"><Menu /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-card--orange">
          <div class="stat-card__content">
            <div class="stat-card__info">
              <p class="stat-card__label">今日订单</p>
              <h3 class="stat-card__value">{{ stats.todayOrderCount }}</h3>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="36"><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-card--purple">
          <div class="stat-card__content">
            <div class="stat-card__info">
              <p class="stat-card__label">总用户数</p>
              <h3 class="stat-card__value">{{ stats.userCount }}</h3>
            </div>
            <div class="stat-card__icon">
              <el-icon :size="36"><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="action-row">
      <el-col :span="24">
        <el-card shadow="never" class="action-card">
          <div class="action-card__header">
            <span class="action-card__title">快捷操作</span>
          </div>
          <div class="action-card__buttons">
            <el-button type="primary" @click="$router.push('/admin/dishes/edit')">
              <el-icon><Plus /></el-icon>
              添加菜品
            </el-button>
            <el-button type="success" @click="$router.push('/admin/categories')">
              <el-icon><Plus /></el-icon>
              添加分类
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近订单 -->
    <el-row :gutter="20" class="order-row">
      <el-col :span="24">
        <el-card shadow="never" class="order-card">
          <template #header>
            <div class="order-card__header">
              <span class="order-card__title">最近订单</span>
              <el-button text type="primary" @click="$router.push('/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table
            :data="recentOrders"
            v-loading="loadingOrders"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="id" label="订单号" width="80" />
            <el-table-column prop="user_name" label="用户" width="120" />
            <el-table-column prop="total_amount" label="金额" width="100">
              <template #default="{ row }">
                <span style="color: var(--color-danger, #FF4D4F); font-weight: 600;">
                  ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="下单时间" min-width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingOrders && recentOrders.length === 0" description="暂无订单数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Dish, Menu, Document, User, Plus } from '@element-plus/icons-vue'
import { getDashboardStats, getAdminOrders, getDishes, getCategories } from '../../api/admin'

const loading = ref(false)
const loadingOrders = ref(false)

const stats = reactive({
  dishCount: 0,
  categoryCount: 0,
  todayOrderCount: 0,
  userCount: 0
})

const recentOrders = ref([])

function getStatusType(status) {
  const map = {
    pending: 'warning',
    confirmed: 'primary',
    preparing: '',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    preparing: '制作中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchStats() {
  loading.value = true
  try {
    // 尝试从仪表盘统计接口获取
    const res = await getDashboardStats().catch(() => null)
    if (res && res.data) {
      stats.dishCount = res.data.dishCount || 0
      stats.categoryCount = res.data.categoryCount || 0
      stats.todayOrderCount = res.data.todayOrderCount || 0
      stats.userCount = res.data.userCount || 0
    } else {
      // 回退：分别获取各数据
      const [dishesRes, categoriesRes] = await Promise.all([
        getDishes().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] }))
      ])
      stats.dishCount = dishesRes.data?.length || dishesRes.data?.total || 0
      stats.categoryCount = categoriesRes.data?.length || categoriesRes.data?.total || 0
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

async function fetchRecentOrders() {
  loadingOrders.value = true
  try {
    const res = await getAdminOrders({ limit: 5 }).catch(() => null)
    if (res && res.data) {
      recentOrders.value = Array.isArray(res.data) ? res.data.slice(0, 5) : (res.data.list || res.data.orders || []).slice(0, 5)
    }
  } catch (err) {
    console.error('获取订单数据失败:', err)
  } finally {
    loadingOrders.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentOrders()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 12px;
  border: none;
  border-radius: var(--radius-md, 12px);
}

.stat-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__info {
  flex: 1;
}

.stat-card__label {
  font-size: var(--font-size-sm, 14px);
  color: var(--color-text-secondary, #666);
  margin: 0 0 8px 0;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.stat-card__icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card--blue .stat-card__value { color: #409EFF; }
.stat-card--blue .stat-card__icon { background: rgba(64, 158, 255, 0.1); color: #409EFF; }

.stat-card--green .stat-card__value { color: #00B578; }
.stat-card--green .stat-card__icon { background: rgba(0, 181, 120, 0.1); color: #00B578; }

.stat-card--orange .stat-card__value { color: #FF9800; }
.stat-card--orange .stat-card__icon { background: rgba(255, 152, 0, 0.1); color: #FF9800; }

.stat-card--purple .stat-card__value { color: #7C4DFF; }
.stat-card--purple .stat-card__icon { background: rgba(124, 77, 255, 0.1); color: #7C4DFF; }

.action-row {
  margin-bottom: 20px;
}

.action-card {
  border-radius: var(--radius-md, 12px);
  border: none;
}

.action-card__header {
  margin-bottom: 16px;
}

.action-card__title {
  font-size: var(--font-size-lg, 18px);
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.action-card__buttons {
  display: flex;
  gap: 12px;
}

.order-row {
  margin-bottom: 20px;
}

.order-card {
  border-radius: var(--radius-md, 12px);
  border: none;
}

.order-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-card__title {
  font-size: var(--font-size-lg, 18px);
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

@media screen and (max-width: 768px) {
  .stat-card__value {
    font-size: 22px;
  }

  .stat-card__icon {
    width: 48px;
    height: 48px;
  }

  .stat-card__icon .el-icon {
    font-size: 24px !important;
  }

  .action-card__buttons {
    flex-wrap: wrap;
  }
}
</style>
