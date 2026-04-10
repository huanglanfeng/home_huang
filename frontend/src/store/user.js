import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken } from '../utils/auth'
import { login as loginApi, getProfile as getProfileApi } from '../api/auth'

const ROLE_KEY = 'make_dinner_role'

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) || ''
}

function setStoredRole(role) {
  localStorage.setItem(ROLE_KEY, role)
}

function removeStoredRole() {
  localStorage.removeItem(ROLE_KEY)
}

// 模块级 init Promise，确保只执行一次
let _initPromise = null

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref('')
  const role = ref('')
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 初始化：从 localStorage 恢复 token，并验证有效性
  // 返回 Promise，路由守卫可以 await
  function init() {
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
      const storedToken = getToken()
      if (storedToken) {
        token.value = storedToken
        role.value = getStoredRole() || ''
        try {
          const res = await getProfileApi()
          const data = res.data || res
          userInfo.value = data
          role.value = data.role || 'user'
          setStoredRole(role.value)
        } catch (e) {
          // token 无效，清除
          logout()
        }
      }
      initialized.value = true
    })()

    return _initPromise
  }

  async function login(credentials) {
    const res = await loginApi(credentials)
    const data = res.data || res
    token.value = data.token
    role.value = data.userInfo?.role || 'user'
    userInfo.value = data.userInfo
    setToken(data.token)
    setStoredRole(role.value)
    return data
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    role.value = ''
    removeToken()
    removeStoredRole()
    _initPromise = null
  }

  async function fetchProfile() {
    const res = await getProfileApi()
    const data = res.data || res
    userInfo.value = data
    role.value = data.role || 'user'
    setStoredRole(role.value)
    return data
  }

  return {
    userInfo,
    token,
    role,
    isLoggedIn,
    initialized,
    init,
    login,
    logout,
    fetchProfile
  }
})
