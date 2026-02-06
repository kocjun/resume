<script setup>
defineProps({
  profile: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <footer class="text-center py-6 text-xs text-reddit-text-secondary border-t border-reddit-border bg-reddit-gray">
     <p>© {{ new Date().getFullYear() }} {{ profile.name }}. All rights reserved.</p>
  </footer>
</template>
