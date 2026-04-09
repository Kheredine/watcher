<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

defineEmits(['toggle-sidebar'])

const { t, lang, toggleLang } = useI18n()

const scrolled = ref(false)
const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
<header
  class="fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center py-4 px-4 md:px-6 gap-3 font-body text-white transition-all duration-300"
  :class="scrolled ? 'backdrop-blur-2xl bg-[#0a0615]/60' : 'bg-transparent'"
>
  <!-- Mobile hamburger -->
  <button
    class="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#7C3AED]/20 text-white/70 hover:text-white transition flex-shrink-0"
    @click="$emit('toggle-sidebar')"
  >
    <i class="fa-solid fa-bars"></i>
  </button>

  <!-- Language toggle -->
  <button
    class="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md text-white/70 hover:text-white text-sm font-medium transition flex-shrink-0"
    @click="toggleLang"
    :title="lang === 'en' ? 'Passer en français' : 'Switch to English'"
  >
    <i class="fa-solid fa-globe text-xs"></i>
    <span>{{ lang === 'en' ? 'FR' : 'EN' }}</span>
  </button>

  <!-- Search bar — fixed max-width on desktop, full on mobile -->
  <div class="search-bar flex flex-1 md:flex-none md:w-full md:max-w-md items-center gap-3 px-4 h-10 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner">
    <i class="fa-solid fa-magnifying-glass text-white/50 text-sm"></i>
    <input
      type="text"
      :placeholder="t.searchPlaceholder"
      class="bg-transparent focus:outline-none w-full text-sm text-white/80 placeholder:text-white/40"
    >
    <i class="fa-solid fa-sliders cursor-pointer text-white/50 hover:text-white transition text-sm"></i>
  </div>

  <!-- User profile pill -->
  <div class="user flex items-center gap-3 px-4 h-10 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner ml-auto flex-shrink-0">
    <img src="../assets/images/avatar.jfif" alt="User Avatar" class="w-6 h-6 rounded-lg object-cover">
    <div class="hidden sm:flex flex-col leading-tight">
      <span class="text-sm font-medium">Yuri P.</span>
      <span class="text-[10px] text-blue-300">Standard</span>
    </div>
    <i class="fa-solid fa-chevron-right text-xs text-white/50"></i>
  </div>
</header>
</template>
