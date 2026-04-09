<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

defineProps({ open: Boolean })
defineEmits(['close'])

const { t } = useI18n()
</script>

<template>
  <aside
    class="sideBar w-64 flex flex-col gap-10 fixed left-0 top-0 h-screen z-50 transition-transform duration-300"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    style="background: #0d0d18; border-right: 1px solid rgba(255,255,255,0.07);"
  >
    <!-- Brand -->
    <div class="px-7 pt-8 pb-2">
      <RouterLink to="/" class="flex items-center gap-3" @click="$emit('close')">
        <img src="../assets/images/dika.png" alt="Tazama" class="w-9 h-9 rounded-xl">
        <span class="font-logo text-2xl font-bold text-white tracking-tight">Tazama</span>
      </RouterLink>
    </div>

    <!-- Nav -->
    <nav class="flex flex-col flex-1 px-4 gap-1">
      <RouterLink
        to="/"
        exact-active-class="sidebar-active"
        class="sidebar-link"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-wand-magic-sparkles text-base w-5 text-center"></i>
        <span>{{ t.navOracle }}</span>
      </RouterLink>

      <RouterLink
        to="/discover"
        active-class="sidebar-active"
        class="sidebar-link"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-compass text-base w-5 text-center"></i>
        <span>{{ t.navDiscover }}</span>
      </RouterLink>

      <RouterLink
        to="/library"
        active-class="sidebar-active"
        class="sidebar-link"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-bookmark text-base w-5 text-center"></i>
        <span>{{ t.navLibrary }}</span>
      </RouterLink>

      <RouterLink
        to="/social"
        active-class="sidebar-active"
        class="sidebar-link"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-users text-base w-5 text-center"></i>
        <span>{{ t.navSocial }}</span>
      </RouterLink>

      <!-- Bottom links -->
      <div class="mt-auto flex flex-col gap-1 pb-6">
        <div class="h-px bg-white/8 mb-3 mx-2"></div>
        <RouterLink
          to="/settings"
          active-class="sidebar-active"
          class="sidebar-link"
          @click="$emit('close')"
        >
          <i class="fa-solid fa-gear text-base w-5 text-center"></i>
          <span>{{ t.navSettings }}</span>
        </RouterLink>
        <RouterLink
          to="/help"
          active-class="sidebar-active"
          class="sidebar-link"
          @click="$emit('close')"
        >
          <i class="fa-solid fa-circle-question text-base w-5 text-center"></i>
          <span>{{ t.navHelp }}</span>
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
}

.sidebar-link:hover {
  background: rgba(124, 58, 237, 0.15);
  color: #ffffff;
}

.sidebar-active {
  background: rgba(124, 58, 237, 0.25) !important;
  color: #ffffff !important;
  border: 1px solid rgba(124, 58, 237, 0.35);
}
</style>
