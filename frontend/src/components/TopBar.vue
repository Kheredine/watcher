<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import TazamaLogo from '@/components/TazamaLogo.vue'

defineEmits(['toggle-sidebar'])

const { t, lang, toggleLang } = useI18n()
const { user, isPremium } = useAuth()
const router = useRouter()

const scrolled = ref(false)
const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
<header
  class="fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center py-3 px-4 md:px-6 gap-3 font-body text-white transition-all duration-300"
  :class="scrolled ? 'backdrop-blur-2xl bg-[#0a0615]/80 border-b border-white/5' : 'bg-transparent'"
>
  <!-- Left: mobile hamburger + language toggle -->
  <div class="flex items-center gap-2 flex-shrink-0">
    <button
      class="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-[#7C3AED]/20 text-white/70 hover:text-white transition"
      @click="$emit('toggle-sidebar')"
    >
      <i class="fa-solid fa-bars text-base"></i>
    </button>

    <button
      class="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md text-white/70 hover:text-white text-sm font-semibold transition"
      @click="toggleLang"
      :title="lang === 'en' ? 'Passer en français' : 'Switch to English'"
    >
      <i class="fa-solid fa-globe text-xs"></i>
      <span>{{ lang === 'en' ? 'FR' : 'EN' }}</span>
    </button>
  </div>

  <!-- Center: search bar -->
  <div class="flex-1 flex justify-center">
    <div class="flex items-center gap-3 px-5 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner w-full max-w-2xl">
      <i class="fa-solid fa-magnifying-glass text-white/40 text-base flex-shrink-0"></i>
      <input
        type="text"
        :placeholder="t.searchPlaceholder"
        class="bg-transparent focus:outline-none w-full text-base text-white/80 placeholder:text-white/30"
      >
      <i class="fa-solid fa-sliders cursor-pointer text-white/40 hover:text-white transition text-sm flex-shrink-0"></i>
    </div>
  </div>

  <!-- Right: user profile pill → opens /settings -->
  <div
    class="flex items-center gap-2.5 px-3.5 h-11 rounded-xl backdrop-blur-md shadow-inner flex-shrink-0 cursor-pointer transition-all hover:opacity-85 hover:scale-[0.98]"
    :class="isPremium ? 'bg-amber-600/18' : 'bg-[#7C3AED]/20'"
    @click="router.push('/settings')"
    title="My Profile"
  >
    <!-- Avatar initial -->
    <div
      class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      :style="isPremium
        ? 'background: linear-gradient(135deg,#d97706,#f59e0b);'
        : 'background: rgba(124,58,237,0.55);'"
    >
      {{ user?.username?.[0]?.toUpperCase() || '?' }}
    </div>

    <div class="hidden sm:flex flex-col leading-tight">
      <span class="text-sm font-semibold text-white">{{ user?.username || 'Account' }}</span>
      <span v-if="isPremium" class="text-[10px] text-amber-400 flex items-center gap-1">
        <i class="fa-solid fa-crown text-[8px]"></i> Premium
      </span>
      <span v-else class="text-[10px] text-purple-400">Standard</span>
    </div>
    <i class="fa-solid fa-chevron-right text-xs text-white/30"></i>
  </div>
</header>
</template>
