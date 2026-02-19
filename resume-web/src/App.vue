<script setup>
import { ref, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authApi } from './api/client.js'
import LoginModal from './components/LoginModal.vue'

const route = useRoute()

const isAuthenticated = ref(false)
const showLoginModal = ref(false)

// 자식 컴포넌트에 auth 상태 제공
provide('isAuthenticated', isAuthenticated)

onMounted(() => {
  isAuthenticated.value = authApi.isAuthenticated()
  if (isAuthenticated.value) {
    userEmail.value = parseEmailFromToken()
  }
})

const handleLogin = () => {
  showLoginModal.value = true
}

const userEmail = ref('')

const handleLoginSuccess = () => {
  isAuthenticated.value = true
  userEmail.value = parseEmailFromToken()
}

function parseEmailFromToken() {
  const token = localStorage.getItem('token')
  if (!token) return ''
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email || ''
  } catch {
    return ''
  }
}

const handleLogout = () => {
  authApi.logout()
  isAuthenticated.value = false
}
</script>

<template>
  <div class="min-h-screen bg-reddit-dark font-sans text-reddit-text antialiased selection:bg-reddit-orange selection:text-white">
    <!-- Navbar (Global Header) -->
    <div class="sticky top-0 z-50 bg-reddit-gray border-b border-reddit-border px-4 py-2 flex items-center justify-between shadow-md">
       <div class="flex items-center gap-2">
         <router-link to="/" class="flex items-center gap-2">
           <div class="w-8 h-8 rounded-full bg-reddit-orange flex items-center justify-center text-white font-bold">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
               <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-4.75a.75.75 0 011.5 0v.75a.75.75 0 01-1.5 0v-.75zm3 0a.75.75 0 011.5 0v.75a.75.75 0 01-1.5 0v-.75zm-6.07-3.957a.75.75 0 111.14-1.006 5.5 5.5 0 017.86 0 .75.75 0 11-1.14 1.006 4 4 0 00-5.72 0zM7 9a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
             </svg>
           </div>
           <span class="font-display font-bold text-lg hidden sm:block">resume</span>
         </router-link>

         <!-- Navigation Links -->
         <div class="flex items-center gap-1 ml-2">
           <router-link to="/"
             class="px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
             :class="route.path === '/' ? 'bg-reddit-orange/20 text-reddit-orange' : 'text-reddit-text-secondary hover:text-white hover:bg-[#272729]'">
             Resume
           </router-link>
           <router-link v-if="isAuthenticated" to="/jobs"
             class="px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
             :class="route.path === '/jobs' ? 'bg-reddit-orange/20 text-reddit-orange' : 'text-reddit-text-secondary hover:text-white hover:bg-[#272729]'">
             Jobs
           </router-link>
         </div>
       </div>

       <div class="flex items-center gap-4">
         <button
           v-if="!isAuthenticated"
           @click="handleLogin"
           class="bg-reddit-orange hover:opacity-90 text-white rounded-full px-5 py-1.5 font-bold text-sm transition-opacity">
           Log In
         </button>
         <div v-else class="flex items-center gap-3">
           <span class="text-reddit-text-secondary text-sm hidden sm:inline">{{ userEmail }}</span>
           <button
             @click="handleLogout"
             class="text-reddit-text-secondary hover:text-white text-sm transition-colors">
             Logout
           </button>
         </div>
       </div>
    </div>

    <!-- Router View -->
    <router-view />

    <!-- Login Modal -->
    <LoginModal
      :isOpen="showLoginModal"
      @close="showLoginModal = false"
      @login-success="handleLoginSuccess" />
  </div>
</template>
