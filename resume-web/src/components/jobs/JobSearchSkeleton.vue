<template>
  <div class="space-y-8">
    <div v-for="i in 3" :key="i" class="animate-pulse">
      <!-- Site Header Skeleton -->
      <div class="flex items-center gap-3 mb-4">
        <div class="h-6 w-24 bg-[#272729] rounded"></div>
        <div class="h-5 w-12 bg-[#272729] rounded-full"></div>
      </div>
      <!-- Card Skeletons -->
      <div class="space-y-3">
        <div v-for="j in 3" :key="j" class="bg-reddit-gray border border-reddit-border rounded-md p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="h-3 w-20 bg-[#272729] rounded"></div>
            <div class="h-3 w-2 bg-[#272729] rounded"></div>
            <div class="h-3 w-16 bg-[#272729] rounded"></div>
          </div>
          <div class="h-5 w-3/4 bg-[#272729] rounded mb-3"></div>
          <div class="h-3 w-16 bg-[#272729] rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template>
