<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>

<header 
  class="fixed top-0 left-64 right-0 z-50 flex py-6 mr-6 gap-4 font-body text-white transition-all duration-300"
  :class="scrolled 
    ? 'backdrop-blur-2xl bg-linear-to-r from-[#0B0B0F]/30  to-transparent' 
    : 'bg-transparent'"
>

    <div class="search_box flex flex-1 mx-auto ml-[25%] max-w-2xl items-center gap-3 px-4 py-2 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search titles, people..." class="bg-transparent focus:outline-none w-full">
        <i class="fa-solid fa-sliders cursor-pointer"></i>
    </div>
    
    <div class="user flex items-center gap-3 px-4 py-2 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner ml-auto">
        <img src="../assets/images/avatar.jfif" alt="User Avatar" class="avatar w-10 h-10 rounded-xl">
        <div class="flex flex-col">
            <span>Yuri P.</span>
            <span class="text-xs text-blue-300">Standard</span>
        </div>
        <i class="fa-solid fa-chevron-right"></i>
    </div>

</header>

</template>

<style></style>