import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import 'material-icons/iconfont/material-icons.css' // 本地打包 Material Icons，避免 Google Fonts 被墙
import App from './App.vue'
import router from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
