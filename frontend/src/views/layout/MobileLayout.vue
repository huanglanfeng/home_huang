<template>
  <div class="mobile-layout">
    <div class="mobile-header">
      <span class="header-title">家庭备餐助手</span>
      <div class="header-icon-wrap" @click="handleBell">
        <van-icon name="bell" size="22" class="header-icon" />
        <van-badge v-if="unreadCount > 0" :content="unreadCount > 99 ? '99+' : unreadCount" class="header-badge" />
      </div>
    </div>
    <div class="mobile-content">
      <router-view />
    </div>
    <van-tabbar :model-value="activeTab" @update:model-value="onTabChange" class="mobile-tabbar">
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="order" icon="apps-o">点单</van-tabbar-item>
      <van-tabbar-item name="orders" icon="orders-o">订单</van-tabbar-item>
      <van-tabbar-item name="profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getToken } from '../../utils/auth'
import { getNotifications, getUnreadCount, markAllRead } from '../../api/notification'

const router = useRouter()
const route = useRoute()
const activeTab = ref('home')

const pathToTab = { '/': 'home', '/order': 'order', '/orders': 'orders', '/profile': 'profile' }
const tabToPath = { home: '/', order: '/order', orders: '/orders', profile: '/profile' }

// 路由变化时同步 TabBar
watch(() => route.path, (path) => {
  const tab = pathToTab[path]
  if (tab && activeTab.value !== tab) {
    activeTab.value = tab
  }
}, { immediate: true })

// TabBar 点击时跳转路由
function onTabChange(name) {
  const targetPath = tabToPath[name]
  if (targetPath && route.path !== targetPath) {
    activeTab.value = name
    router.push(targetPath)
  }
}

const unreadCount = ref(0)

async function loadUnreadCount() {
  if (!getToken()) return
  try {
    const res = await getUnreadCount()
    unreadCount.value = res?.data?.count || res?.count || 0
  } catch (e) {
    // ignore
  }
}

async function handleBell() {
  if (!getToken()) {
    showToast('请先登录后查看通知')
    return
  }
  try {
    const res = await getNotifications()
    const list = res?.data || res || []
    if (list.length === 0) {
      showToast('暂无通知')
      return
    }
    // 标记全部已读
    await markAllRead()
    unreadCount.value = 0

    // 显示通知列表弹窗
    const message = list.slice(0, 10).map(n => {
      const time = n.created_at?.replace('T', ' ').substring(0, 16) || ''
      const readTag = n.is_read ? '' : '[新] '
      return `${readTag}【${n.title}】${n.content}\n  ${time}`
    }).join('\n\n')

    showDialog({
      title: `通知 (${list.length})`,
      message,
      confirmButtonText: '知道了',
      className: 'notification-dialog',
    })
  } catch (e) {
    showToast('获取通知失败')
  }
}

// 监听 token 变化，加载未读数量
watch(() => getToken(), (token) => {
  if (token) {
    loadUnreadCount()
  } else {
    unreadCount.value = 0
  }
}, { immediate: true })

// 每30秒刷新未读数量
setInterval(() => {
  if (getToken()) loadUnreadCount()
}, 30000)
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-icon {
  color: var(--color-text-secondary);
  cursor: pointer;
}

.header-icon-wrap {
  position: relative;
  cursor: pointer;
  padding: 4px;
}

.header-badge {
  position: absolute;
  top: -4px;
  right: -8px;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 50px;
}

.mobile-tabbar :deep(.van-tabbar-item--active) {
  color: var(--color-primary);
}
</style>
