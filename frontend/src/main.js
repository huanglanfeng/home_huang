import { createApp } from 'vue'
import pinia from './store'
import router from './router'
import App from './App.vue'
import { Lazyload } from 'vant'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 引入样式
import './styles/common.css'

// 引入 Vant 基础样式
import 'vant/lib/index.css'

// 引入 Element Plus 样式
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(Lazyload, {
  lazyComponent: true,
})

app.mount('#app')
