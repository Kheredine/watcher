<script setup>
import { useI18n } from '@/composables/useI18n'
const { t } = useI18n()
</script>
<template>
  <div class="flex flex-col gap-6 pb-12 max-w-2xl">
    <h1 class="text-2xl font-bold text-white">{{ t.navHelp }}</h1>
    <div class="flex flex-col gap-4">
      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2">How does The Oracle work?</h3>
        <p class="text-white/60 text-sm leading-relaxed">Select your mood, submood, available time, content type, and era. The Oracle uses AI to find titles that match your exact emotional state.</p>
      </div>
      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2">How does the app learn my preferences?</h3>
        <p class="text-white/60 text-sm leading-relaxed">Every time you like, add to watchlist, or mark as watched, Tazama remembers your taste. The Discover page uses this to surface personalized recommendations.</p>
      </div>
      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2">Where does the streaming data come from?</h3>
        <p class="text-white/60 text-sm leading-relaxed">Streaming availability is powered by TMDB (The Movie Database). Links go directly to the official platform page.</p>
      </div>
    </div>
  </div>
</template>
