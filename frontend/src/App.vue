<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './store/user'

const userStore = useUserStore()

// 后台静默初始化：验证 token 有效性，不阻塞页面渲染
onMounted(() => {
  userStore.init()
})
</script>
