<script setup>
import { ref } from 'vue'
import JobCard from './JobCard.vue'

defineProps({
  site: {
    type: Object,
    required: true
  }
})

const expanded = ref(false)
</script>

<template>
  <div class="mb-8">
    <!-- Site Header -->
    <button
      v-if="site.status === 'ok' && site.jobs?.length"
      @click="expanded = !expanded"
      class="w-full flex items-center gap-3 mb-4 px-2 py-2 hover:bg-reddit-gray-dark/50 rounded-md transition-colors cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
           class="w-5 h-5 text-reddit-text-secondary transition-transform"
           :class="{ 'rotate-90': expanded }">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
      <h2 class="text-xl font-bold text-white">{{ site.displayName || site.source }}</h2>
      <span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
        {{ site.jobs.length }}건
      </span>
    </button>
    <div v-else class="flex items-center gap-3 mb-4">
      <h2 class="text-xl font-bold text-white">{{ site.displayName || site.source }}</h2>
      <span v-if="site.status === 'link_only'"
            class="text-xs bg-reddit-blue/20 text-reddit-blue px-2 py-0.5 rounded-full font-bold">
        외부 링크
      </span>
      <span v-else-if="site.status === 'error'"
            class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
        오류
      </span>
      <span v-else-if="site.status === 'disabled'"
            class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
        API 미설정
      </span>
    </div>

    <!-- Link Only Card -->
    <a v-if="site.status === 'link_only'"
       :href="site.searchUrl" target="_blank" rel="noopener noreferrer"
       class="block bg-reddit-gray border border-reddit-border rounded-md p-6 hover:border-reddit-orange transition-colors group">
      <p class="text-reddit-text-secondary text-sm mb-3">{{ site.description }}</p>
      <span class="inline-flex items-center gap-2 text-reddit-orange font-bold text-sm group-hover:underline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        {{ site.displayName }}에서 검색하기
      </span>
    </a>

    <!-- Job List -->
    <div v-else-if="site.status === 'ok' && site.jobs?.length" v-show="expanded" class="space-y-3">
      <JobCard v-for="(job, i) in site.jobs" :key="i" :job="job" />
    </div>

    <!-- OK but no results -->
    <div v-else-if="site.status === 'ok' && (!site.jobs || site.jobs.length === 0)"
         class="bg-reddit-gray border border-reddit-border rounded-md p-6 text-center">
      <p class="text-reddit-text-secondary text-sm">검색 결과가 없습니다</p>
    </div>

    <!-- Error State -->
    <div v-else-if="site.status === 'error'"
         class="bg-reddit-gray border border-red-500/30 rounded-md p-4 text-sm text-red-400">
      {{ site.message }}
    </div>

    <!-- Disabled State -->
    <div v-else-if="site.status === 'disabled'"
         class="bg-reddit-gray border border-yellow-500/30 rounded-md p-4 text-sm text-yellow-400">
      {{ site.message }}
    </div>
  </div>
</template>
