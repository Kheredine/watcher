import { createRouter, createWebHistory } from 'vue-router'
import TheOracleView from '@/views/TheOracleView.vue'

const routes = [
  { path: '/', name: 'oracle', component: TheOracleView },
  { path: '/discover', name: 'discover', component: () => import('@/views/DiscoverView.vue') },
  { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
  { path: '/social', name: 'social', component: () => import('@/views/SocialView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/help', name: 'help', component: () => import('@/views/HelpView.vue') },
  { path: '/detail/:type/:id', name: 'detail', component: () => import('@/views/DetailView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
