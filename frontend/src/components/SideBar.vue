<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

defineProps({ open: Boolean })
defineEmits(['close'])

const { t } = useI18n()
const { user, isPremium, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  router.push('/auth')
}
</script>

<template>
  <aside
    class="sideBar w-64 flex flex-col fixed left-0 top-0 h-screen z-50 transition-transform duration-300"
    :class="open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    style="background: #0d0d18; border-right: 1px solid rgba(255,255,255,0.07);"
  >
    <!-- Brand -->
    <div class="px-7 pt-7 pb-3">
      <RouterLink to="/" class="flex items-center gap-3" @click="$emit('close')">
        <img src="../assets/images/dika.png" alt="Tazama" class="w-9 h-9 rounded-xl">
        <span class="font-logo text-2xl font-bold text-white tracking-tight">Tazama</span>
      </RouterLink>
    </div>

    <!-- User identity block -->
    <div v-if="user" class="px-4 pb-3">
      <div
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
        style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);"
        @click="router.push('/plan'); $emit('close')"
      >
        <!-- Avatar initial -->
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          :style="isPremium ? 'background: rgba(217,119,6,0.35);' : 'background: rgba(124,58,237,0.35);'"
        >
          {{ user.username?.[0]?.toUpperCase() || '?' }}
        </div>
        <div class="flex flex-col leading-tight min-w-0">
          <span class="text-white text-sm font-semibold truncate">{{ user.username }}</span>
          <span v-if="isPremium" class="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            <i class="fa-solid fa-crown text-[9px]"></i> Premium
          </span>
          <span v-else class="text-[11px] font-medium text-purple-400">Standard</span>
        </div>
        <i class="fa-solid fa-chevron-right text-[10px] text-white/20 ml-auto flex-shrink-0"></i>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex flex-col flex-1 px-4 gap-0.5 overflow-y-auto">

      <!-- Main links -->
      <RouterLink to="/" exact-active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
        <i class="fa-solid fa-wand-magic-sparkles text-base w-5 text-center"></i>
        <span>{{ t.navOracle }}</span>
      </RouterLink>

      <RouterLink to="/discover" active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
        <i class="fa-solid fa-compass text-base w-5 text-center"></i>
        <span>{{ t.navDiscover }}</span>
      </RouterLink>

      <RouterLink to="/library" active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
        <i class="fa-solid fa-bookmark text-base w-5 text-center"></i>
        <span>{{ t.navLibrary }}</span>
      </RouterLink>

      <RouterLink to="/social" active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
        <i class="fa-solid fa-users text-base w-5 text-center"></i>
        <span>{{ t.navSocial }}</span>
      </RouterLink>

      <!-- Divider -->
      <div class="h-px bg-white/6 my-2 mx-1"></div>

      <!-- Premium section label -->
      <div class="px-2 py-1">
        <span class="text-[10px] font-bold uppercase tracking-widest" :class="isPremium ? 'text-amber-400/60' : 'text-white/20'">
          Premium
        </span>
      </div>

      <!-- Oracle Chat -->
      <RouterLink
        to="/oracle-chat"
        active-class="sidebar-active"
        class="sidebar-link"
        :class="!isPremium && 'sidebar-link--locked'"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-comment-dots text-base w-5 text-center"
           :class="isPremium ? 'text-amber-400' : 'text-white/25'"></i>
        <span :class="!isPremium ? 'text-white/35' : ''">Oracle Chat</span>
        <i v-if="!isPremium" class="fa-solid fa-lock text-[10px] text-white/25 ml-auto"></i>
      </RouterLink>

      <!-- Analytics -->
      <RouterLink
        to="/analytics"
        active-class="sidebar-active"
        class="sidebar-link"
        :class="!isPremium && 'sidebar-link--locked'"
        @click="$emit('close')"
      >
        <i class="fa-solid fa-chart-bar text-base w-5 text-center"
           :class="isPremium ? 'text-amber-400' : 'text-white/25'"></i>
        <span :class="!isPremium ? 'text-white/35' : ''">My Analytics</span>
        <i v-if="!isPremium" class="fa-solid fa-lock text-[10px] text-white/25 ml-auto"></i>
      </RouterLink>

      <!-- Bottom links -->
      <div class="mt-auto flex flex-col gap-0.5 pb-5">
        <div class="h-px bg-white/6 mb-2 mx-1"></div>

        <RouterLink to="/settings" active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
          <i class="fa-solid fa-gear text-base w-5 text-center"></i>
          <span>{{ t.navSettings }}</span>
        </RouterLink>

        <RouterLink to="/help" active-class="sidebar-active" class="sidebar-link" @click="$emit('close')">
          <i class="fa-solid fa-circle-question text-base w-5 text-center"></i>
          <span>{{ t.navHelp }}</span>
        </RouterLink>

        <button class="sidebar-link sidebar-link--logout w-full text-left" @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket text-base w-5 text-center"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  border: none;
  background: none;
}

.sidebar-link:hover {
  background: var(--accent-bg, rgba(124,58,237,0.15));
  color: #ffffff;
}

.sidebar-active {
  background: var(--accent-bg, rgba(124,58,237,0.22)) !important;
  color: #ffffff !important;
  border: 1px solid var(--accent-border, rgba(124,58,237,0.35));
}

.sidebar-link--locked {
  cursor: default;
}
.sidebar-link--locked:hover {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.35);
}

.sidebar-link--logout {
  color: rgba(248, 113, 113, 0.55);
}
.sidebar-link--logout:hover {
  background: rgba(239,68,68,0.10);
  color: rgba(248, 113, 113, 0.85);
}
</style>
