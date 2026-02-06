<script setup>
import { CodeBracketIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

defineProps({
  projects: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="bg-reddit-gray rounded-md border border-reddit-border overflow-hidden mt-4">
    <div class="bg-reddit-gray p-3 border-b border-reddit-border flex items-center justify-between">
       <h2 class="text-sm font-bold text-reddit-text uppercase tracking-wide">Personal Projects</h2>
       <CodeBracketIcon class="w-5 h-5 text-reddit-text-secondary" />
    </div>
    
    <div class="p-4 space-y-4">
      <div v-for="(project, index) in projects" :key="index" class="group">
         <a :href="project.link" target="_blank" class="block">
           <div class="flex items-start justify-between">
             <h3 class="text-sm font-bold text-reddit-text group-hover:underline decoration-reddit-text">{{ project.name }}</h3>
             <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5 text-reddit-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>
           <p class="text-xs text-reddit-text-secondary mt-1 leading-relaxed">{{ project.description }}</p>
         </a>
      </div>
    </div>
  </div>
</template>
