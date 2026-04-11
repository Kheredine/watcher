<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import TazamaLogo from '@/components/TazamaLogo.vue'

defineEmits(['toggle-sidebar'])

const { t, lang, toggleLang } = useI18n()
const { user, isPremium, apiFetch } = useAuth()
const router = useRouter()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w92'

// ── Scroll shadow ────────────────────────────────────────────────────────────
const scrolled = ref(false)
const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// ── Search ──────────────────────────────────────────────────────────────────
const query        = ref('')
const searchOpen   = ref(false)
const searchFocus  = ref(false)
const movieResults = ref([])
const userResults  = ref([])
const searching    = ref(false)
let   debounce     = null

const showDropdown = computed(() => searchFocus.value && query.value.trim().length >= 2)

watch(query, (q) => {
  clearTimeout(debounce)
  if (q.trim().length < 2) {
    movieResults.value = []
    userResults.value  = []
    return
  }
  debounce = setTimeout(() => runSearch(q.trim()), 350)
})

const runSearch = async (q) => {
  searching.value = true
  try {
    // Run TMDB multi-search + user search in parallel
    const [tmdbRes, userRes] = await Promise.all([
      fetch(`${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&page=1`),
      apiFetch(`/api/social/search?q=${encodeURIComponent(q)}`).catch(() => ({ users: [] })),
    ])
    const tmdbData = await tmdbRes.json()

    movieResults.value = (tmdbData.results || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 5)
      .map(r => ({
        id:     r.id,
        type:   r.media_type,
        title:  r.title || r.name,
        year:   (r.release_date || r.first_air_date || '').split('-')[0],
        poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
      }))

    userResults.value = userRes.users || []
  } catch {
    // silently fail
  } finally {
    searching.value = false
  }
}

const goToTitle = (item) => {
  query.value   = ''
  searchFocus.value = false
  router.push({ name: 'detail', params: { type: item.type, id: item.id } })
}

const goToUser = (u) => {
  query.value   = ''
  searchFocus.value = false
  router.push({ name: 'user-profile', params: { id: u.id } })
}

// Close dropdown on outside click
const searchRef = ref(null)
const handleClickOutside = (e) => {
  if (searchRef.value && !searchRef.value.contains(e.target)) {
    searchFocus.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

// ── Notification badge ───────────────────────────────────────────────────────
const unreadCount = ref(0)
const loadUnread = async () => {
  try {
    const data = await apiFetch('/api/social/unread-count')
    unreadCount.value = data.count || 0
  } catch { /* ignore */ }
}
onMounted(() => {
  if (user.value) loadUnread()
})
// Refresh every 60s
let unreadInterval = null
onMounted(() => { unreadInterval = setInterval(() => { if (user.value) loadUnread() }, 60000) })
onUnmounted(() => clearInterval(unreadInterval))
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

  <!-- Center: search bar with dropdown -->
  <div ref="searchRef" class="flex-1 flex justify-center relative">
    <div class="w-full max-w-2xl">
      <!-- Input -->
      <div class="flex items-center gap-3 px-5 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md shadow-inner">
        <i v-if="!searching" class="fa-solid fa-magnifying-glass text-white/40 text-base flex-shrink-0"></i>
        <i v-else class="fa-solid fa-circle-notch fa-spin text-white/40 text-sm flex-shrink-0"></i>
        <input
          v-model="query"
          type="text"
          :placeholder="t.searchPlaceholder"
          class="bg-transparent focus:outline-none w-full text-base text-white/80 placeholder:text-white/30"
          @focus="searchFocus = true"
          @keydown.escape="searchFocus = false; query = ''"
        >
        <button
          v-if="query"
          class="text-white/30 hover:text-white/70 transition text-sm flex-shrink-0"
          @click="query = ''; movieResults = []; userResults = []"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showDropdown"
          class="absolute top-full mt-2 left-0 right-0 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
          style="background: #13111f; max-height: 420px; overflow-y: auto;"
        >
          <!-- No results -->
          <div v-if="!searching && !movieResults.length && !userResults.length"
               class="p-5 text-center text-white/35 text-sm">
            {{ t.searchNoResults }}
          </div>

          <!-- Movie / Series results -->
          <div v-if="movieResults.length">
            <div class="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
              {{ t.searchMovies }}
            </div>
            <button
              v-for="item in movieResults"
              :key="`m-${item.type}-${item.id}`"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
              @click="goToTitle(item)"
            >
              <div class="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <img v-if="item.poster" :src="item.poster" :alt="item.title" class="w-full h-full object-cover" />
                <i v-else class="fa-solid fa-film text-white/20 text-xs flex items-center justify-center w-full h-full"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ item.title }}</p>
                <p class="text-white/35 text-xs">{{ item.year }} · {{ item.type === 'movie' ? 'Film' : 'Series' }}</p>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-white/20"></i>
            </button>
          </div>

          <!-- User results -->
          <div v-if="userResults.length">
            <div class="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
              {{ t.searchUsers }}
            </div>
            <button
              v-for="u in userResults"
              :key="`u-${u.id}`"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
              @click="goToUser(u)"
            >
              <div
                class="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                :style="u.plan === 'premium'
                  ? 'background: linear-gradient(135deg,#d97706,#f59e0b);'
                  : 'background: rgba(124,58,237,0.4);'"
              >
                {{ u.avatar || '🎬' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ u.username }}</p>
                <p class="text-white/35 text-xs">{{ u.plan === 'premium' ? '✦ Premium' : 'Standard' }}</p>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-white/20"></i>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Right: notification bell + user profile pill -->
  <div class="flex items-center gap-2 flex-shrink-0">
    <!-- Notification bell -->
    <button
      class="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#7C3AED]/20 text-white/60 hover:text-white transition"
      @click="router.push('/notifications')"
      title="Notifications"
    >
      <i class="fa-solid fa-bell text-base"></i>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
        style="background: #ef4444; color: white;"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- User profile pill → opens /settings -->
    <div
      class="flex items-center gap-2.5 px-3.5 h-11 rounded-xl backdrop-blur-md shadow-inner cursor-pointer transition-all hover:opacity-85 hover:scale-[0.98]"
      :class="isPremium ? 'bg-amber-600/18' : 'bg-[#7C3AED]/20'"
      @click="router.push('/settings')"
      title="My Profile"
    >
      <!-- Avatar -->
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        :style="isPremium
          ? 'background: linear-gradient(135deg,#d97706,#f59e0b);'
          : 'background: rgba(124,58,237,0.55);'"
      >
        {{ user?.avatar || user?.username?.[0]?.toUpperCase() || '?' }}
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
  </div>
</header>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
