<script setup>
import { 
  CommandLineIcon, 
  ComputerDesktopIcon, 
  CircleStackIcon, 
  WrenchScrewdriverIcon 
} from '@heroicons/vue/24/outline'

const props = defineProps({
  skills: {
    type: Array,
    required: true
  },
  activeTag: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select-tag'])

const getIcon = (category) => {
  if (category.includes('Backend')) return CommandLineIcon
  if (category.includes('Frontend')) return ComputerDesktopIcon
  if (category.includes('Database')) return CircleStackIcon
  return WrenchScrewdriverIcon
}

const getGradientClass = (index) => {
  const gradients = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-amber-400'
  ]
  return gradients[index % gradients.length]
}
</script>

<template>
  <div class="bg-reddit-gray rounded-md border border-reddit-border overflow-hidden">
    <div class="bg-reddit-gray p-3 border-b border-reddit-border flex items-center justify-between">
       <h2 class="text-sm font-bold text-reddit-text uppercase tracking-wide">About Skills</h2>
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-text-secondary">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
       </svg>
    </div>
    
    <div class="p-4 space-y-6">
      <div v-for="(category, index) in skills" :key="index">
         <div class="flex items-center gap-2 mb-2">
            <!-- Simple colored dot instead of full icon for cleaner sidebar look, or keep small icon -->
            <div class="w-2 h-2 rounded-full bg-reddit-text-secondary"></div>
            <h3 class="text-sm font-bold text-reddit-text">{{ category.category }}</h3>
         </div>
         <div class="flex flex-wrap gap-1.5">
           <span v-for="item in category.items" :key="item"
                 @click="emit('select-tag', item)"
                 class="px-2 py-1 text-xs rounded-full transition-colors cursor-pointer border"
                 :class="activeTag.toLowerCase() === item.toLowerCase()
                   ? 'bg-reddit-orange/20 text-reddit-orange border-reddit-orange/50'
                   : 'bg-[#272729] hover:bg-[#343536] text-reddit-text border-transparent hover:border-reddit-border'">
             {{ item }}
           </span>
         </div>
      </div>
      

    </div>
  </div>
</template>
