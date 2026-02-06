<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ChatBubbleLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShareIcon,
  PencilSquareIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  experience: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'edit'])

const itemRef = ref(null)
const isVisible = ref(false)

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isVisible.value = true
      observer.disconnect() // 한 번 보이면 관찰 중단
    }
  }, { threshold: 0.2 })

  if (itemRef.value) {
    observer.observe(itemRef.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div ref="itemRef" 
       class="flex bg-reddit-gray border border-reddit-border rounded-md overflow-hidden hover:border-reddit-text-secondary transition-colors cursor-pointer p-4 md:p-5"
       :class="[isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 transition-all duration-500']">
    
    <!-- Main Content -->
    <div class="flex-1">
       <!-- Post Meta -->
       <div class="flex items-center gap-1.5 text-xs text-reddit-text-secondary mb-2">
          <!-- Icon -->
          <div class="w-5 h-5 rounded-full bg-reddit-text-secondary/20 flex items-center justify-center shrink-0">
             <BriefcaseIcon class="w-3 h-3 text-reddit-text" />
          </div>
          <span class="font-bold text-reddit-text hover:underline">{{ experience.period }}</span>
          <span class="text-xs">•</span>
          <span class="hover:underline">{{ experience.company }}</span>
          
          <!-- Action Buttons -->
          <div class="flex items-center ml-auto">
            <div class="flex items-center gap-1 hover:bg-[#272729] px-2 py-1 rounded text-reddit-text-secondary hover:text-reddit-text transition-colors">
              <ShareIcon class="w-5 h-5" />
              <span class="text-xs font-bold">Share</span>
            </div>
            
            <!-- Edit Button (Only visible when authenticated) -->
            <button v-if="isAuthenticated" 
                    @click.stop="$emit('edit', experience)"
                    class="flex items-center gap-1 hover:bg-[#272729] px-2 py-1 rounded text-reddit-text-secondary hover:text-reddit-text transition-colors">
              <PencilSquareIcon class="w-5 h-5" />
              <span class="text-xs font-bold">Edit</span>
            </button>
          </div>
       </div>

       <!-- Title -->
       <h3 class="text-xl md:text-2xl font-medium text-reddit-text mb-3 leading-snug">
          {{ experience.project }} <span class="text-sm font-normal text-reddit-text-secondary ml-2 border border-reddit-border px-2 py-0.5 rounded align-middle">{{ experience.position }}</span>
       </h3>

       <!-- Body -->
       <div class="text-sm md:text-base text-reddit-text mb-4 leading-relaxed font-light whitespace-pre-line">
         {{ experience.description }}
       </div>

       <!-- Flair / Chips -->
       <div class="flex flex-wrap gap-2">
          <span v-for="tech in experience.techStack" :key="tech"
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#272729] text-reddit-text-secondary">
             {{ tech }}
          </span>
       </div>
    </div>
  </div>
</template>
