<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="login-logo">
        <div class="logo-icon">
          <van-icon name="fire-o" size="36" color="#fff" />
        </div>
        <h1 class="login-title">家庭备餐助手</h1>
        <p class="login-subtitle">登录后享受更多功能</p>
      </div>

      <!-- 登录表单 -->
      <van-form @submit="handleLogin" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="loginForm.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名/昵称"
            :rules="[{ required: true, message: '请输入用户名' }]"
            left-icon="manager-o"
          />
          <van-field
            v-model="loginForm.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            left-icon="lock"
          />
        </van-cell-group>
        <div class="login-btn-wrap">
          <van-button round block type="primary" native-type="submit" :loading="loading" color="#00B578" size="large">
            登 录
          </van-button>
        </div>
      </van-form>

      <!-- 注册入口 -->
      <div class="login-footer">
        <span>还没有账号？</span>
        <span class="link" @click="showRegister = true">立即注册</span>
      </div>

      <!-- 提示 -->
      <div class="login-tip">
        <van-icon name="info-o" size="14" color="#999" />
        <span>新用户可点击"立即注册"创建账号</span>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <van-popup v-model:show="showRegister" position="bottom" round :style="{ maxHeight: '70%' }">
      <div class="register-popup">
        <div class="register-header">
          <span class="register-title">注册新账号</span>
          <van-icon name="cross" size="20" @click="showRegister = false" />
        </div>
        <van-form @submit="handleRegister" class="register-form">
          <van-cell-group inset>
            <van-field
              v-model="registerForm.username"
              label="昵称"
              placeholder="请输入昵称"
              :rules="[{ required: true, message: '请输入昵称' }]"
            />
            <van-field
              v-model="registerForm.password"
              type="password"
              label="密码"
              placeholder="请输入密码（至少6位）"
              :rules="[{ required: true, message: '请输入密码' }, { pattern: /^.{6,}$/, message: '密码至少6位' }]"
            />
            <van-field
              v-model="registerForm.confirmPassword"
              type="password"
              label="确认密码"
              placeholder="请再次输入密码"
              :rules="[{ required: true, message: '请确认密码' }, { validator: val => val === registerForm.password, message: '两次密码不一致' }]"
            />
          </van-cell-group>
          <div class="register-btn-wrap">
            <van-button round block type="primary" native-type="submit" :loading="registerLoading" color="#00B578" size="large">
              注 册
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '../../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const showRegister = ref(false)
const registerLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

async function handleLogin() {
  loading.value = true
  try {
    const data = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    // 跳转：优先跳转到 redirect 指定的页面，否则根据角色跳转
    const redirectPath = route.query.redirect
    if (redirectPath) {
      router.push(redirectPath)
    } else if (data.userInfo?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
    showSuccessToast('登录成功')
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '登录失败，请检查用户名和密码'
    showToast(msg)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  registerLoading.value = true
  try {
    const { register } = await import('../../api/auth')
    await register({
      username: registerForm.username,
      password: registerForm.password
    })
    showSuccessToast('注册成功，请登录')
    showRegister.value = false
    loginForm.username = registerForm.username
    loginForm.password = ''
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  } catch (err) {
    const msg = err?.response?.data?.message || '注册失败'
    showToast(msg)
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 36px 24px 24px;
  box-shadow: 0 8px 32px rgba(0, 181, 120, 0.15);
}

.login-logo {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 14px;
  background: linear-gradient(135deg, #00B578, #009A63);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 181, 120, 0.3);
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 6px 0;
}

.login-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.login-form {
  margin-bottom: 12px;
}

.login-btn-wrap {
  padding: 16px;
}

.login-footer {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.login-footer .link {
  color: #00B578;
  font-weight: 500;
  margin-left: 4px;
}

.login-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  font-size: 12px;
  color: #999;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.register-popup {
  padding: 20px;
}

.register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.register-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.register-btn-wrap {
  padding: 16px;
}
</style>
