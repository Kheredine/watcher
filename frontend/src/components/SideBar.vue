<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

defineProps({ open: Boolean })
defineEmits(['close'])

const { t } = useI18n()
</script>

<template>
  <aside
    class="sideBar w-64 p-8 pr-0 flex flex-col gap-12 fixed left-0 top-0 h-screen z-50 bg-[#0a0615] border-r border-white/5 transition-transform duration-300"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
  >
    <!-- Brand -->
    <RouterLink to="/" class="flex items-center gap-2" @click="$emit('close')">
      <img src="../assets/images/dika.png" alt="Tazama" class="w-8 h-8">
      <span class="font-logo text-2xl font-bold text-white">Tazama</span>
    </RouterLink>

    <!-- Nav -->
    <ul class="flex flex-col gap-5 flex-1 text-base font-body">
      <li>
        <RouterLink to="/" class="nav-link" active-class="nav-active" exact @click="$emit('close')">
          <i class="fa-solid fa-wand-magic-sparkles w-5"></i> {{ t.navOracle }}
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/discover" class="nav-link" active-class="nav-active" @click="$emit('close')">
          <i class="fa-solid fa-compass w-5"></i> {{ t.navDiscover }}
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/library" class="nav-link" active-class="nav-active" @click="$emit('close')">
          <i class="fa-solid fa-bookmark w-5"></i> {{ t.navLibrary }}
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/social" class="nav-link" active-class="nav-active" @click="$emit('close')">
          <i class="fa-solid fa-users w-5"></i> {{ t.navSocial }}
        </RouterLink>
      </li>

      <div class="bottom flex flex-col gap-5 mt-auto pt-4 relative">
        <div class="w-16 h-px bg-gradient-to-r from-purple-500/60 to-transparent"></div>
        <li>
          <RouterLink to="/settings" class="nav-link" active-class="nav-active" @click="$emit('close')">
            <i class="fa-solid fa-gear w-5"></i> {{ t.navSettings }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/help" class="nav-link" active-class="nav-active" @click="$emit('close')">
            <i class="fa-solid fa-circle-question w-5"></i> {{ t.navHelp }}
          </RouterLink>
        </li>
      </div>
    </ul>
  </aside>
</template>
