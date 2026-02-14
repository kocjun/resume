<script setup>
defineProps({
  job: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="flex bg-reddit-gray border border-reddit-border rounded-md overflow-hidden hover:border-reddit-text-secondary transition-colors p-4 md:p-5">
    <div class="flex-1">
      <!-- Meta -->
      <div class="flex items-center gap-1.5 text-xs text-reddit-text-secondary mb-2">
        <span class="font-bold text-reddit-text">{{ job.company }}</span>
        <span v-if="job.location">•</span>
        <span v-if="job.location">{{ job.location }}</span>
        <span v-if="job.deadline" class="ml-auto">~{{ job.deadline }}</span>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-medium text-reddit-text mb-2 leading-snug">
        {{ job.title }}
      </h3>

      <!-- Salary -->
      <div v-if="job.salary" class="text-sm text-reddit-text-secondary mb-3">
        {{ job.salary }}
      </div>

      <!-- Link -->
      <a :href="job.url" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-1 text-reddit-blue hover:underline text-sm font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        상세보기
      </a>
    </div>
  </div>
</template>
