<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineEmits(['toggle-sidebar'])

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
<header
  class="fixed top-0 left-0 lg:left-64 right-0 z-30 flex items-center py-4 px-4 md:py-6 md:pr-6 gap-3 font-body text-white transition-all duration-300"
  :class="scrolled
    ? 'backdrop-blur-2xl bg-linear-to-r from-[#0B0B0F]/30 to-transparent'
    : 'bg-transparent'"
>

    <!-- Hamburger (mobile only) -->
    <button
        class="lg:hidden text-white/70 hover:text-white p-2 rounded-lg bg-[#7C3AED]/20 shrink-0"
        @click="$emit('toggle-sidebar')"
    >
        <i class="fa-solid fa-bars text-lg"></i>
    </button>

    <div class="search_box flex flex-1 items-center gap-3 px-4 py-2 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner min-w-0">
        <i class="fa-solid fa-magnifying-glass shrink-0"></i>
        <input type="text" placeholder="Search titles, people..." class="bg-transparent focus:outline-none w-full min-w-0 text-sm md:text-base">
        <i class="fa-solid fa-sliders cursor-pointer shrink-0 hidden sm:block"></i>
    </div>

    <div class="user flex items-center gap-2 px-3 py-2 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner shrink-0">
        <img src="../assets/images/avatar.jfif" alt="User Avatar" class="avatar w-8 h-8 md:w-10 md:h-10 rounded-xl">
        <div class="flex-col hidden md:flex">
            <span class="text-sm">Yuri P.</span>
            <span class="text-xs text-blue-300">Standard</span>
        </div>
        <i class="fa-solid fa-chevron-right hidden md:block text-sm"></i>
    </div>

</header>
</template>
