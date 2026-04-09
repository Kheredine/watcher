<script setup>
import { useI18n } from '@/composables/useI18n'
const { t, lang, setLang } = useI18n()
</script>
<template>
  <div class="flex flex-col gap-8 pb-12 max-w-lg">
    <h1 class="text-2xl font-bold text-white">{{ t.navSettings }}</h1>

    <div class="flex flex-col gap-4 p-6 rounded-xl bg-white/5 border border-white/10">
      <h2 class="text-sm font-semibold text-white/60 uppercase tracking-widest">Language</h2>
      <div class="flex gap-3">
        <button
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="lang === 'en' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
          @click="setLang('en')"
        >English</button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="lang === 'fr' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
          @click="setLang('fr')"
        >Français</button>
      </div>
    </div>
  </div>
</template>
