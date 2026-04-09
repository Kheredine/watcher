<script setup>
import { RouterLink } from 'vue-router'

defineProps({ open: Boolean })
defineEmits(['close'])
</script>

<template>
    <aside :class="[
        'sideBar w-64 p-10 pr-0 flex flex-col gap-14 fixed left-0 top-0 h-screen z-50 bg-[#0a0615] transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]">

        <h2 class="flex items-center text-2xl font-bold text-[#fbffff]">
            <img src="../assets/images/dika.png" alt="Tazama Logo" class="logo w-8 h-8 mr-2">
            <span class="font-logo">Tazama</span>
        </h2>

        <ul class="flex flex-col gap-7 flex-1 text-lg font-body list-none">

            <li>
                <RouterLink to="/" class="nav-link" active-class="nav-active" exact-active-class="nav-active" @click="$emit('close')">
                    <i class="fa-solid fa-house"></i> The Oracle
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/discover" class="nav-link" active-class="nav-active" @click="$emit('close')">
                    <i class="fa-solid fa-compass"></i> Discover
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/social" class="nav-link" active-class="nav-active" @click="$emit('close')">
                    <i class="fa-solid fa-film"></i> Social
                </RouterLink>
            </li>
            <li>
                <RouterLink to="/watchlist" class="nav-link" active-class="nav-active" @click="$emit('close')">
                    <i class="fa-solid fa-clock"></i> Watchlist
                </RouterLink>
            </li>

            <div class="bottom flex flex-col gap-7 mt-auto pt-4 relative">
                <div class="w-16 h-0.5 rounded-full bg-linear-to-r from-purple-500/60 to-transparent"></div>

                <li>
                    <RouterLink to="/settings" class="nav-link" active-class="nav-active" @click="$emit('close')">
                        <i class="fa-solid fa-gear"></i> Settings
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="/help" class="nav-link" active-class="nav-active" @click="$emit('close')">
                        <i class="fa-solid fa-question-circle"></i> Help
                    </RouterLink>
                </li>
            </div>

        </ul>

    </aside>
</template>
