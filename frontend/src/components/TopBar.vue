<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

defineEmits(['toggle-sidebar'])

const { t, lang, toggleLang } = useI18n()
const { user, isPremium, apiFetch } = useAuth()
const router = useRouter()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w92'

// ── Scroll shadow ─────────────────────────────────────────────────────────────
const scrolled = ref(false)
const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// ── Search state ──────────────────────────────────────────────────────────────
const query        = ref('')
const searchFocus  = ref(false)
const searchMode   = ref('all')  // 'all' | 'titles' | 'people'
const movieResults = ref([])
const userResults  = ref([])
const searching    = ref(false)
let   debounceTimer = null
let   isMounted     = true

const showDropdown = computed(() =>
  searchFocus.value && query.value.trim().length >= 2
)

const filteredMovies = computed(() =>
  searchMode.value === 'people' ? [] : movieResults.value
)
const filteredUsers = computed(() =>
  searchMode.value === 'titles' ? [] : userResults.value
)

watch(query, (q) => {
  clearTimeout(debounceTimer)
  if (q.trim().length < 2) {
    movieResults.value = []
    userResults.value  = []
    return
  }
  debounceTimer = setTimeout(() => runSearch(q.trim()), 350)
})

// Re-run search when mode changes (only if query already typed)
watch(searchMode, () => {
  if (query.value.trim().length >= 2) runSearch(query.value.trim())
})

const runSearch = async (q) => {
  if (!isMounted) return
  searching.value = true
  try {
    const promises = []

    if (searchMode.value !== 'people') {
      promises.push(
        fetch(`${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&page=1`)
          .then(r => r.json())
          .catch(() => ({ results: [] }))
      )
    } else {
      promises.push(Promise.resolve(null))
    }

    if (searchMode.value !== 'titles') {
      promises.push(
        apiFetch(`/api/social/search?q=${encodeURIComponent(q)}`).catch(() => ({ users: [] }))
      )
    } else {
      promises.push(Promise.resolve(null))
    }

    const [tmdbData, userRes] = await Promise.all(promises)

    if (!isMounted) return

    if (tmdbData) {
      movieResults.value = (tmdbData.results || [])
        .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 6)
        .map(r => ({
          id:     r.id,
          type:   r.media_type,
          title:  r.title || r.name,
          year:   (r.release_date || r.first_air_date || '').split('-')[0],
          poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
        }))
    } else {
      movieResults.value = []
    }

    userResults.value = userRes ? (userRes.users || []) : []
  } catch {
    // silently fail
  } finally {
    if (isMounted) searching.value = false
  }
}

const closeSearch = () => {
  query.value       = ''
  searchFocus.value = false
  movieResults.value = []
  userResults.value  = []
}

const goToTitle = (item) => {
  closeSearch()
  router.push({ name: 'detail', params: { type: item.type, id: item.id } })
}

const goToUser = (u) => {
  closeSearch()
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
onUnmounted(() => {
  isMounted = false
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(debounceTimer)
})

// ── Notification unread count ─────────────────────────────────────────────────
const unreadCount = ref(0)
let unreadTimer   = null

const loadUnread = async () => {
  if (!isMounted) return
  try {
    const data = await apiFetch('/api/social/unread-count')
    if (isMounted) unreadCount.value = data.count || 0
  } catch { /* ignore */ }
}

onMounted(() => {
  if (user.value) {
    loadUnread()
    unreadTimer = setInterval(() => { if (isMounted && user.value) loadUnread() }, 60000)
  }
})
onUnmounted(() => clearInterval(unreadTimer))

// ── Search mode labels ────────────────────────────────────────────────────────
const MODE_LABELS = computed(() => ({
  all:    lang.value === 'fr' ? 'Tout'     : 'All',
  titles: lang.value === 'fr' ? 'Titres'   : 'Titles',
  people: lang.value === 'fr' ? 'Personnes': 'People',
}))
</script>

<template>
<header
  class="fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center py-3 px-4 md:px-6 gap-3 font-body text-white transition-all duration-300"
  :class="scrolled ? 'backdrop-blur-2xl bg-[#0a0615]/80 border-b border-white/5' : 'bg-transparent'"
>
  <!-- Left: mobile hamburger + language toggle -->
  <div class="flex items-center gap-2 flex-shrink-0">
    <button
      type="button"
      class="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-[#7C3AED]/20 text-white/70 hover:text-white transition"
      @click="$emit('toggle-sidebar')"
    >
      <i class="fa-solid fa-bars text-base"></i>
    </button>

    <button
      type="button"
      class="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md text-white/70 hover:text-white text-sm font-semibold transition"
      @click="toggleLang"
      :title="lang === 'en' ? 'Passer en français' : 'Switch to English'"
    >
      <i class="fa-solid fa-globe text-xs"></i>
      <span>{{ lang === 'en' ? 'FR' : 'EN' }}</span>
    </button>
  </div>

  <!-- Center: search bar -->
  <div ref="searchRef" class="flex-1 flex justify-center relative">
    <div class="w-full max-w-2xl">

      <!-- Search input row -->
      <div class="flex items-center gap-2 px-4 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md">

        <!-- Search icon / spinner -->
        <i v-if="!searching" class="fa-solid fa-magnifying-glass text-white/40 text-sm flex-shrink-0"></i>
        <i v-else class="fa-solid fa-circle-notch fa-spin text-white/40 text-xs flex-shrink-0"></i>

        <!-- Filter mode pills — shown once the search is focused -->
        <div v-if="searchFocus" class="flex items-center gap-1 flex-shrink-0">
          <button
            v-for="mode in ['all','titles','people']"
            :key="mode"
            type="button"
            class="px-2 py-0.5 rounded-md text-[10px] font-semibold transition border"
            :class="searchMode === mode
              ? 'bg-purple-600/70 text-white border-purple-500/60'
              : 'text-white/35 border-white/10 hover:text-white/60 hover:border-white/20'"
            @click.stop="searchMode = mode"
          >
            {{ MODE_LABELS[mode] }}
          </button>
          <div class="w-px h-4 bg-white/15 mx-1"></div>
        </div>

        <!-- Text input — autocomplete OFF prevents browser from injecting saved emails -->
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          name="tazama-search"
          :placeholder="searchFocus
            ? (searchMode === 'people'
                ? (lang === 'fr' ? 'Chercher un utilisateur…' : 'Search a user…')
                : searchMode === 'titles'
                  ? (lang === 'fr' ? 'Chercher un film, une série…' : 'Search a title…')
                  : t.searchPlaceholder)
            : t.searchPlaceholder"
          class="bg-transparent focus:outline-none w-full text-sm text-white/80 placeholder:text-white/30"
          @focus="searchFocus = true"
          @keydown.escape="closeSearch"
        >

        <!-- Clear button -->
        <button
          v-if="query"
          type="button"
          class="text-white/30 hover:text-white/70 transition text-sm flex-shrink-0"
          @click="closeSearch"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Dropdown — plain v-if, no <Transition> (avoids insertBefore null crash) -->
      <div
        v-if="showDropdown"
        class="absolute top-full mt-2 left-0 right-0 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
        style="background: #13111f; max-height: 440px; overflow-y: auto;"
      >
        <!-- Searching indicator -->
        <div v-if="searching" class="p-4 flex items-center justify-center gap-2 text-white/35 text-sm">
          <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
          {{ lang === 'fr' ? 'Recherche…' : 'Searching…' }}
        </div>

        <!-- No results -->
        <div
          v-else-if="!filteredMovies.length && !filteredUsers.length"
          class="p-6 text-center text-white/30 text-sm"
        >
          <i class="fa-solid fa-face-frown text-lg mb-2 block opacity-40"></i>
          {{ t.searchNoResults }}
        </div>

        <template v-else>
          <!-- Titles section -->
          <div v-if="filteredMovies.length">
            <div class="px-4 pt-3 pb-1.5 flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/25">{{ t.searchMovies }}</span>
              <span class="text-[10px] text-white/20">{{ filteredMovies.length }}</span>
            </div>
            <button
              v-for="item in filteredMovies"
              :key="`m-${item.type}-${item.id}`"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
              @click="goToTitle(item)"
            >
              <div class="w-9 h-[52px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                <img v-if="item.poster" :src="item.poster" :alt="item.title" class="w-full h-full object-cover" />
                <i v-else class="fa-solid fa-film text-white/20 text-xs"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ item.title }}</p>
                <p class="text-white/35 text-xs mt-0.5">
                  {{ item.year }}
                  <span class="mx-1 text-white/20">·</span>
                  <span :class="item.type === 'movie' ? 'text-purple-400/70' : 'text-blue-400/70'">
                    {{ item.type === 'movie' ? (lang === 'fr' ? 'Film' : 'Movie') : (lang === 'fr' ? 'Série' : 'Series') }}
                  </span>
                </p>
              </div>
              <i class="fa-solid fa-arrow-right text-[10px] text-white/20"></i>
            </button>
          </div>

          <!-- Divider between sections -->
          <div v-if="filteredMovies.length && filteredUsers.length" class="h-px bg-white/6 mx-4"></div>

          <!-- People section -->
          <div v-if="filteredUsers.length">
            <div class="px-4 pt-3 pb-1.5 flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/25">{{ t.searchUsers }}</span>
              <span class="text-[10px] text-white/20">{{ filteredUsers.length }}</span>
            </div>
            <button
              v-for="u in filteredUsers"
              :key="`u-${u.id}`"
              type="button"
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
                <p class="text-white/35 text-xs mt-0.5">
                  {{ u.plan === 'premium' ? '✦ Premium' : 'Standard' }}
                  <span v-if="u.bio" class="mx-1 text-white/20">·</span>
                  <span v-if="u.bio" class="text-white/30 truncate">{{ u.bio.slice(0, 30) }}</span>
                </p>
              </div>
              <i class="fa-solid fa-arrow-right text-[10px] text-white/20"></i>
            </button>
          </div>

          <div class="h-2"></div>
        </template>
      </div>

    </div>
  </div>

  <!-- Right: notification bell + user profile pill -->
  <div class="flex items-center gap-2 flex-shrink-0">

    <!-- Notification bell -->
    <button
      type="button"
      class="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#7C3AED]/20 text-white/60 hover:text-white transition"
      @click="router.push('/notifications')"
      title="Notifications"
    >
      <i class="fa-solid fa-bell text-base"></i>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
        style="background: #ef4444; color: white;"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- User profile pill → opens /settings -->
    <button
      type="button"
      class="flex items-center gap-2.5 px-3.5 h-11 rounded-xl backdrop-blur-md shadow-inner cursor-pointer transition-all hover:opacity-85 hover:scale-[0.98]"
      :class="isPremium ? 'bg-amber-600/20' : 'bg-[#7C3AED]/20'"
      @click="router.push('/settings')"
      title="My Profile"
    >
      <!-- Avatar -->
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        :style="isPremium
          ? 'background: linear-gradient(135deg,#d97706,#f59e0b);'
          : 'background: rgba(124,58,237,0.55);'"
      >
        <span v-if="user?.avatar && user.avatar.length <= 2">{{ user.avatar }}</span>
        <span v-else class="text-white">{{ user?.username?.[0]?.toUpperCase() || '?' }}</span>
      </div>

      <div class="hidden sm:flex flex-col leading-tight">
        <span class="text-sm font-semibold text-white">{{ user?.username || 'Account' }}</span>
        <span v-if="isPremium" class="text-[10px] text-amber-400 flex items-center gap-1">
          <i class="fa-solid fa-crown text-[8px]"></i> Premium
        </span>
        <span v-else class="text-[10px] text-purple-400">Standard</span>
      </div>
      <i class="fa-solid fa-chevron-right text-xs text-white/30 hidden sm:block"></i>
    </button>

  </div>
</header>
</template>
