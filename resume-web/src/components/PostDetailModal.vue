<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  experience: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl max-h-[90vh] bg-reddit-gray border border-reddit-border rounded-lg shadow-2xl overflow-y-auto flex flex-col md:flex-row">
        
        <!-- Close Button (Mobile) -->
        <button class="absolute top-2 right-2 p-2 text-reddit-text-secondary hover:text-white md:hidden bg-black/50 rounded-full z-10"
                @click="$emit('close')">
          <XMarkIcon class="w-6 h-6" />
        </button>

        <!-- Main Content -->
        <div class="flex-1 p-6 md:p-8 bg-reddit-gray">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
             <div>
                <h2 class="text-2xl md:text-3xl font-medium text-reddit-text mb-2">
                   {{ experience.project }}
                </h2>
                <div class="flex flex-wrap items-center gap-2 text-sm text-reddit-text-secondary">
                   <span class="font-bold text-reddit-text">{{ experience.company }}</span>
                   <span>•</span>
                   <span class="px-2 py-0.5 rounded bg-[#272729] border border-reddit-border/50 text-reddit-text text-xs">
                     {{ experience.position }}
                   </span>
                   <span>•</span>
                   <span>{{ experience.period }}</span>
                </div>
             </div>
             
             <!-- Close Button (Desktop) -->
             <button class="hidden md:block p-2 text-reddit-text-secondary hover:text-white hover:bg-[#272729] rounded transition-colors"
                     @click="$emit('close')">
                <XMarkIcon class="w-6 h-6" />
                <span class="sr-only">Close</span>
             </button>
          </div>

          <!-- Body -->
          <div class="prose prose-invert max-w-none mb-8">
             <p class="text-reddit-text leading-relaxed whitespace-pre-line text-lg">
               {{ experience.description }}
             </p>
          </div>

          <!-- Tech Stack -->
          <div>
             <h3 class="text-sm font-bold text-reddit-text-secondary uppercase mb-3 tracking-wide">Tech Stack</h3>
             <div class="flex flex-wrap gap-2">
                <span v-for="tech in experience.techStack" :key="tech"
                      class="px-3 py-1.5 rounded-full text-sm font-medium bg-[#272729] text-reddit-text border border-transparent hover:border-reddit-border transition-colors cursor-default">
                   {{ tech }}
                </span>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
