<script setup>
import { ref } from 'vue'
import ExperienceItem from './ExperienceItem.vue'
import PostDetailModal from './PostDetailModal.vue'

defineProps({
  experiences: {
    type: Array,
    required: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

defineEmits(['create', 'edit', 'delete'])

const selectedExperience = ref(null)
const isModalOpen = ref(false)

const openModal = (exp) => {
  selectedExperience.value = exp
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  setTimeout(() => {
    selectedExperience.value = null
  }, 200)
}
</script>

<template>
  <section class="space-y-4">
    <!-- Create Post Bar (Only visible when authenticated) -->
    <div v-if="isAuthenticated" class="bg-reddit-gray border border-reddit-border rounded-md p-2 flex items-center gap-2 mb-4">
      <div class="w-8 h-8 rounded-full bg-reddit-text-secondary/20 flex-shrink-0"></div>
      <input type="text" 
             placeholder="Create Post" 
             class="flex-1 bg-[#272729] border border-reddit-border hover:border-white rounded px-4 py-2 text-sm text-reddit-text focus:outline-none transition-colors cursor-pointer"
             @click="$emit('create')"
             readonly>
      <div class="flex items-center gap-2 px-2 text-reddit-text-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
    </div>

    <div v-if="experiences.length === 0" class="bg-reddit-gray border border-reddit-border rounded-md p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-reddit-text-secondary mb-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <p class="text-reddit-text-secondary text-sm">검색 결과가 없습니다.</p>
      <p class="text-reddit-text-secondary/60 text-xs mt-1">다른 태그로 검색해 보세요.</p>
    </div>

    <div v-else class="space-y-4">
      <ExperienceItem
        v-for="(exp, index) in experiences"
        :key="exp.id"
        :experience="exp"
        :index="index"
        :isAuthenticated="isAuthenticated"
        @click="openModal(exp)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <PostDetailModal 
      v-if="selectedExperience"
      :experience="selectedExperience"
      :is-open="isModalOpen"
      @close="closeModal"
    />
  </section>
</template>
