import { createRouter, createWebHistory } from 'vue-router'
import { authApi } from '../api/client.js'

const routes = [
  {
    path: '/',
    name: 'Resume',
    component: () => import('../views/ResumeView.vue'),
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: () => import('../views/JobsView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authApi.isAuthenticated()) {
    return '/'
  }
})

export default router
