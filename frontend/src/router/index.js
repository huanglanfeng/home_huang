import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'
import { getStoredRole, useUserStore } from '../store/user'

const routes = [
  {
    path: '/',
    component: () => import('../views/layout/MobileLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('../views/home/HomePage.vue'), meta: { title: '首页' } },
      { path: 'order', name: 'Order', component: () => import('../views/order/OrderPage.vue'), meta: { title: '点单' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/orders/OrdersPage.vue'), meta: { title: '订单' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/profile/ProfilePage.vue'), meta: { title: '我的' } },
      { path: 'orders/prep/:id', name: 'PrepList', component: () => import('../views/orders/PrepListPage.vue'), meta: { title: '备餐清单' } },
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginPage.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/admin',
    component: () => import('../views/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { title: '管理后台' } },
      { path: 'categories', name: 'CategoryManage', component: () => import('../views/admin/CategoryManage.vue'), meta: { title: '分类管理' } },
      { path: 'dishes', name: 'DishManage', component: () => import('../views/admin/DishManage.vue'), meta: { title: '菜品管理' } },
      { path: 'dishes/edit/:id?', name: 'DishEdit', component: () => import('../views/admin/DishEdit.vue'), meta: { title: '编辑菜品' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫（同步，不阻塞渲染）
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 家庭备餐助手`
  }

  const token = getToken()

  // 需要认证的页面：同步检查 localStorage 中的 token
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // 管理员页面：检查角色
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      const userRole = getStoredRole()
      if (userRole && userRole !== 'admin') {
        next({ path: '/' })
        return
      }
    }

    next()
    return
  }

  // 已登录用户访问登录页：重定向到首页或管理后台
  if (to.path === '/login' && token) {
    const userRole = getStoredRole()
    if (userRole === 'admin') {
      next({ path: '/admin' })
    } else {
      next({ path: '/' })
    }
    return
  }

  next()
})

export default router
