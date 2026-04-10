<template>
  <el-container class="admin-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && !isCollapse"
      class="sidebar-overlay"
      @click="isCollapse = true"
    />

    <!-- 侧边栏 -->
    <el-aside
      :width="isCollapse ? '64px' : '220px'"
      :class="['admin-aside', { 'is-collapse': isCollapse, 'is-mobile': isMobile }]"
    >
      <!-- Logo 区域 -->
      <div class="admin-logo">
        <h2 v-show="!isCollapse">家庭备餐助手</h2>
        <p v-show="!isCollapse">管理后台</p>
        <h2 v-show="isCollapse" class="logo-mini">餐</h2>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse-transition="false"
      >
        <el-menu-item index="/admin">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/admin/categories">
          <el-icon><Menu /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/dishes">
          <el-icon><Dish /></el-icon>
          <template #title>菜品管理</template>
        </el-menu-item>
      </el-menu>

      <!-- 底部返回前台 -->
      <div class="admin-aside-footer">
        <router-link to="/" class="back-link">
          <el-icon><HomeFilled /></el-icon>
          <span v-show="!isCollapse">返回前台</span>
        </router-link>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container :class="['admin-container', { 'is-collapse': isCollapse }]">
      <!-- 顶部栏 -->
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            @click="toggleCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span class="user-name">{{ userStore.userInfo?.nickname || '管理员' }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import {
  DataAnalysis,
  Menu,
  Dish,
  HomeFilled,
  UserFilled,
  ArrowDown,
  Fold,
  Expand
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const isMobile = ref(false)

const activeMenu = computed(() => {
  return route.path
})

const pageTitle = computed(() => {
  return route.meta.title || '管理后台'
})

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isCollapse.value = true
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 尝试获取用户信息
  if (userStore.isLoggedIn && !userStore.userInfo) {
    userStore.fetchProfile().catch(() => {})
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-aside {
  background-color: #304156;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.admin-aside.is-mobile {
  position: fixed;
  z-index: 1002;
}

.admin-aside.is-mobile.is-collapse {
  width: 0 !important;
  overflow: hidden;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.admin-logo {
  padding: 20px;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.admin-logo h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-logo p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
}

.logo-mini {
  font-size: 22px !important;
  margin: 0 !important;
}

.admin-aside .el-menu {
  border-right: none;
  flex: 1;
}

.admin-aside-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
  justify-content: center;
}

.back-link:hover {
  color: #409EFF;
}

.admin-container {
  margin-left: 220px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-container.is-collapse {
  margin-left: 64px;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-white, #fff);
  box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.06));
  padding: 0 20px;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-secondary, #666);
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: var(--color-primary, #00B578);
}

.page-title {
  font-size: var(--font-size-lg, 18px);
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text-secondary, #666);
  font-size: 14px;
}

.user-info:hover {
  color: var(--color-primary, #00B578);
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-main {
  background: var(--color-bg, #F6F7F9);
  padding: var(--spacing-xl, 24px);
  flex: 1;
}

/* 响应式：移动端 */
@media screen and (max-width: 768px) {
  .admin-container {
    margin-left: 0 !important;
  }

  .admin-aside:not(.is-collapse) {
    width: 220px !important;
  }

  .admin-main {
    padding: var(--spacing-md, 12px);
  }

  .page-title {
    font-size: var(--font-size-md, 16px);
  }
}
</style>
