<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click.self="closeModal">
    <div class="bg-reddit-gray border border-reddit-border rounded-md p-6 w-full max-w-md mx-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">Log In</h2>
        <button @click="closeModal" class="text-reddit-text-secondary hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-500 bg-opacity-10 border border-red-500 rounded-md p-3 mb-4">
        <p class="text-red-400 text-sm">{{ error }}</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-reddit-text-secondary text-sm mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@example.com"
            class="w-full bg-reddit-dark border border-reddit-border rounded-md px-4 py-2 text-white focus:outline-none focus:border-reddit-orange transition-colors"
          />
        </div>

        <div class="mb-6">
          <label class="block text-reddit-text-secondary text-sm mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full bg-reddit-dark border border-reddit-border rounded-md px-4 py-2 text-white focus:outline-none focus:border-reddit-orange transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-reddit-orange hover:opacity-90 text-white rounded-full px-5 py-2.5 font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <!-- Hint -->
      <div class="mt-6 p-3 bg-reddit-dark border border-reddit-border rounded-md">
        <p class="text-xs text-reddit-text-secondary">
          <strong class="text-white">Demo credentials:</strong><br>
          시드 데이터로 생성된 계정을 사용하세요
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authApi } from '../api/client.js'

const props = defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['close', 'login-success'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const closeModal = () => {
  emit('close')
  error.value = null
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    await authApi.login(email.value, password.value)
    emit('login-success')
    closeModal()
  } catch (err) {
    error.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
