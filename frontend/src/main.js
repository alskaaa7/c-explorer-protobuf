import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import FileUpload from './components/FileUpload.vue'
import FileList from './components/FileList.vue'
import FileAnalyzer from './components/FileAnalyzer.vue'

const routes = [
  { path: '/', component: FileUpload },
  { path: '/files', component: FileList },
  { path: '/analyze', component: FileAnalyzer }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)

// Регистрация иконок
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')