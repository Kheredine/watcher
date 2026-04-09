<script setup>
import { useI18n } from '@/composables/useI18n'
const { t } = useI18n()
</script>
<template>
  <div class="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
    <i class="fa-solid fa-users text-5xl"></i>
    <h2 class="text-xl font-bold text-white/60">{{ t.navSocial }}</h2>
    <p class="text-sm">Coming soon — share recommendations with friends.</p>
  </div>
</template>
