<script setup>
defineProps({
  profile: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="bg-reddit-gray rounded-md border border-reddit-border overflow-hidden">
    <!-- Banner Area -->
    <div class="h-32 md:h-48 bg-reddit-blue relative">
       <!-- Use a subtle pattern if desired -->
       <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    </div>
    
    <!-- Info Area -->
    <div class="px-4 pb-4 md:px-6 md:pb-6 relative">
      <!-- Avatar (overlapping banner) -->
      <div class="absolute -top-10 md:-top-14 left-4 md:left-6">
        <div class="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full p-1 shadow-md">
           <!-- Robot Avatar Placeholder -->
           <div class="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=resume" alt="avatar" class="w-full h-full object-cover" />
           </div>
        </div>
      </div>

      <!-- Header Actions (Right side) -->
      <div class="flex justify-end pt-3 mb-2 md:mb-0 gap-2">
         <a :href="'mailto:' + profile.email" class="px-6 py-1.5 rounded-full bg-reddit-text text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center">
            Contact Me
         </a>
      </div>

      <!-- Text Info -->
      <div class="mt-4 md:mt-2">
         <h1 class="text-2xl md:text-3xl font-bold text-reddit-text mb-1 flex items-center gap-2">
            {{ profile.name }}
            <span class="text-xs font-normal border border-reddit-text text-reddit-text px-1 rounded">MOD</span>
         </h1>
         <h2 class="text-sm text-reddit-text-secondary font-medium mb-4">
            {{ profile.role }}
         </h2>
         
         <div class="text-sm text-reddit-text space-y-2">
            <p>{{ profile.summary }}</p>
         </div>

         <div class="flex flex-wrap gap-4 mt-6 text-sm font-bold text-reddit-text-secondary">
             <div class="flex flex-col">
                <span class="text-reddit-text">15y</span>
                <span class="font-normal text-xs">Experience</span>
             </div>
             <div class="flex flex-col">
                <span class="text-reddit-text">10+</span>
                <span class="font-normal text-xs">Projects</span>
             </div>
             <div class="flex md:hidden lg:flex flex-col">
                <span class="text-reddit-text">{{ profile.email }}</span>
                <span class="font-normal text-xs">Email</span>
             </div>
         </div>
      </div>
    </div>
  </div>
</template>
