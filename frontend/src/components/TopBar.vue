<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'
import { useRouter, useRoute } from 'vue-router'

defineEmits(['toggle-sidebar'])

const { t, lang, toggleLang } = useI18n()
const { user, isPremium, apiFetch } = useAuth()
const router = useRouter()
const route  = useRoute()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w92'

let isMounted = true
onUnmounted(() => { isMounted = false })

// ── Scroll shadow ─────────────────────────────────────────────────────────────
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// ── Search state ──────────────────────────────────────────────────────────────
const query        = ref('')
const searchActive = ref(false)   // true when the bar is focused
const searchMode   = ref('all')   // 'all' | 'titles' | 'people'
const movieResults = ref([])
const userResults  = ref([])
const searching    = ref(false)
const inputRef     = ref(null)
const wrapperRef   = ref(null)

// v-show instead of v-if — no DOM insertion so no insertBefore crash
const dropdownVisible = computed(
  () => searchActive.value && query.value.trim().length >= 2
)

const filteredMovies = computed(() =>
  searchMode.value === 'people' ? [] : movieResults.value
)
const filteredUsers = computed(() =>
  searchMode.value === 'titles' ? [] : userResults.value
)

const hasResults = computed(() => filteredMovies.value.length || filteredUsers.value.length)

// ── Debounced search ──────────────────────────────────────────────────────────
let debounceTimer = null

watch(query, (q) => {
  clearTimeout(debounceTimer)
  if (q.trim().length < 2) {
    movieResults.value = []
    userResults.value  = []
    return
  }
  debounceTimer = setTimeout(() => runSearch(q.trim()), 380)
})

watch(searchMode, () => {
  if (query.value.trim().length >= 2) runSearch(query.value.trim())
})

const runSearch = async (q) => {
  if (!isMounted) return
  searching.value = true
  try {
    const doTitles  = searchMode.value !== 'people'
    const doPeople  = searchMode.value !== 'titles'

    const [tmdbData, userRes] = await Promise.all([
      doTitles
        ? fetch(`${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&page=1`)
            .then(r => r.json()).catch(() => ({ results: [] }))
        : Promise.resolve(null),
      doPeople
        ? apiFetch(`/api/social/search?q=${encodeURIComponent(q)}`).catch(() => ({ users: [] }))
        : Promise.resolve(null),
    ])

    if (!isMounted) return

    movieResults.value = tmdbData
      ? (tmdbData.results || [])
          .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 6)
          .map(r => ({
            id:     r.id,
            type:   r.media_type,
            title:  r.title || r.name,
            year:   (r.release_date || r.first_air_date || '').split('-')[0],
            poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
          }))
      : []

    userResults.value = userRes ? (userRes.users || []) : []
  } catch { /* fail silently */ }
  finally { if (isMounted) searching.value = false }
}

// ── Open / close helpers ──────────────────────────────────────────────────────
const openSearch = () => { searchActive.value = true }

// closeSearch is called explicitly (Escape, x-button, result click)
const closeSearch = () => {
  searchActive.value = false
  query.value        = ''
  movieResults.value = []
  userResults.value  = []
}

// Click outside: use 'pointerdown' so it fires before focus events
// We use a slight delay so a result-click can finish its own handler first
let closeTimer = null
const onPointerDown = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      if (isMounted) searchActive.value = false
    }, 80)
  }
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onUnmounted(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  clearTimeout(closeTimer)
  clearTimeout(debounceTimer)
})

// Close dropdown when navigating to a new page
watch(() => route.path, () => { searchActive.value = false })

// ── Navigate to result ────────────────────────────────────────────────────────
const goToTitle = (item) => {
  closeSearch()
  nextTick(() => router.push({ name: 'detail', params: { type: item.type, id: item.id } }))
}
const goToUser = (u) => {
  closeSearch()
  nextTick(() => router.push({ name: 'user-profile', params: { id: u.id } }))
}

// ── Mode labels ───────────────────────────────────────────────────────────────
const MODE_LABELS = computed(() => ({
  all:    lang.value === 'fr' ? 'Tout'      : 'All',
  titles: lang.value === 'fr' ? 'Titres'    : 'Titles',
  people: lang.value === 'fr' ? 'Personnes' : 'People',
}))

// ── Notification count ────────────────────────────────────────────────────────
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
</script>

<template>
<header
  class="fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center py-3 px-4 md:px-6 gap-3 font-body text-white transition-all duration-300"
  :class="scrolled ? 'backdrop-blur-2xl bg-[#0a0615]/80 border-b border-white/5' : 'bg-transparent'"
>
  <!-- Left: hamburger (mobile) + language toggle -->
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

  <!-- Center: search -->
  <div ref="wrapperRef" class="flex-1 flex justify-center">
    <div class="w-full max-w-2xl relative">

      <!-- Search bar -->
      <div
        class="flex items-center gap-2 px-4 h-11 rounded-xl bg-[#7C3AED]/20 backdrop-blur-md transition-all duration-200"
        :class="searchActive ? 'ring-1 ring-purple-500/40' : ''"
      >
        <!-- Icon / spinner -->
        <i
          class="flex-shrink-0 text-sm"
          :class="searching
            ? 'fa-solid fa-circle-notch fa-spin text-white/40'
            : 'fa-solid fa-magnifying-glass text-white/35'"
        ></i>

        <!-- Mode filter pills — only when active -->
        <div v-if="searchActive" class="flex items-center gap-1 flex-shrink-0">
          <button
            v-for="m in ['all','titles','people']"
            :key="m"
            type="button"
            class="px-2 py-0.5 rounded-md text-[10px] font-semibold transition border"
            :class="searchMode === m
              ? 'bg-purple-600/70 text-white border-purple-500/50'
              : 'text-white/35 border-transparent hover:text-white/55 hover:border-white/15'"
            @pointerdown.stop
            @click.stop="searchMode = m"
          >{{ MODE_LABELS[m] }}</button>
          <span class="text-white/15 text-xs mx-0.5">|</span>
        </div>

        <!-- Input -->
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          name="tazama-search-x"
          :placeholder="searchActive
            ? searchMode === 'people'
              ? (lang === 'fr' ? 'Nom d\'utilisateur…' : 'Username…')
              : searchMode === 'titles'
                ? (lang === 'fr' ? 'Film, série…' : 'Movie, series…')
                : t.searchPlaceholder
            : t.searchPlaceholder"
          class="bg-transparent focus:outline-none w-full text-sm text-white/80 placeholder:text-white/30"
          @focus="openSearch"
          @keydown.escape.stop="closeSearch"
        >

        <!-- Clear -->
        <button
          v-if="query"
          type="button"
          class="flex-shrink-0 text-white/30 hover:text-white/70 transition"
          @pointerdown.stop
          @click.stop="closeSearch"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- ── Dropdown ──────────────────────────────────────────────────────────
           v-show keeps the DOM node alive → no insertBefore(null) crash.
           The node is rendered once and just hidden with display:none when not needed.
      -->
      <div
        v-show="dropdownVisible"
        class="absolute top-full mt-2 left-0 right-0 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style="background: #13111f; max-height: 440px; overflow-y: auto; z-index: 9999;"
        @pointerdown.stop
      >
        <!-- Searching indicator -->
        <div v-if="searching" class="p-4 flex items-center justify-center gap-2 text-white/30 text-sm">
          <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
          {{ lang === 'fr' ? 'Recherche…' : 'Searching…' }}
        </div>

        <!-- No results -->
        <div
          v-else-if="!hasResults && query.trim().length >= 2"
          class="p-6 text-center"
        >
          <i class="fa-solid fa-face-frown-open text-white/15 text-2xl mb-2 block"></i>
          <p class="text-white/30 text-sm">{{ t.searchNoResults }}</p>
        </div>

        <template v-else>
          <!-- ── Titles section ── -->
          <div v-if="filteredMovies.length">
            <div class="px-4 pt-3 pb-1 flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/25">
                <i class="fa-solid fa-film mr-1 text-purple-400/50"></i>{{ t.searchMovies }}
              </span>
            </div>
            <button
              v-for="item in filteredMovies"
              :key="`m-${item.type}-${item.id}`"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
              @click.stop="goToTitle(item)"
            >
              <div class="w-9 h-[52px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                <img v-if="item.poster" :src="item.poster" :alt="item.title" class="w-full h-full object-cover" />
                <i v-else class="fa-solid fa-film text-white/15 text-xs"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ item.title }}</p>
                <p class="text-white/35 text-xs mt-0.5">
                  {{ item.year }}
                  <span class="mx-1 opacity-40">·</span>
                  <span :class="item.type === 'movie' ? 'text-purple-400/60' : 'text-blue-400/60'">
                    {{ item.type === 'movie'
                        ? (lang === 'fr' ? 'Film' : 'Movie')
                        : (lang === 'fr' ? 'Série' : 'Series') }}
                  </span>
                </p>
              </div>
              <i class="fa-solid fa-arrow-right text-[10px] text-white/15 flex-shrink-0"></i>
            </button>
          </div>

          <!-- divider -->
          <div v-if="filteredMovies.length && filteredUsers.length" class="h-px bg-white/6 mx-4 my-1"></div>

          <!-- ── People section ── -->
          <div v-if="filteredUsers.length">
            <div class="px-4 pt-3 pb-1 flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-white/25">
                <i class="fa-solid fa-users mr-1 text-purple-400/50"></i>{{ t.searchUsers }}
              </span>
            </div>
            <button
              v-for="u in filteredUsers"
              :key="`u-${u.id}`"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
              @click.stop="goToUser(u)"
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
                  <template v-if="u.bio">
                    <span class="mx-1 opacity-30">·</span>
                    <span class="text-white/25 truncate">{{ u.bio.slice(0, 28) }}</span>
                  </template>
                </p>
              </div>
              <i class="fa-solid fa-arrow-right text-[10px] text-white/15 flex-shrink-0"></i>
            </button>
          </div>

          <div class="h-2"></div>
        </template>
      </div>

    </div>
  </div>

  <!-- Right: notification bell + profile pill -->
  <div class="flex items-center gap-2 flex-shrink-0">

    <!-- Bell -->
    <button
      type="button"
      class="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#7C3AED]/20 text-white/60 hover:text-white transition"
      @click="router.push('/notifications')"
    >
      <i class="fa-solid fa-bell text-base"></i>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1"
        style="background:#ef4444; color:white;"
      >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- Profile pill -->
    <button
      type="button"
      class="flex items-center gap-2.5 px-3.5 h-11 rounded-xl backdrop-blur-md cursor-pointer transition-all hover:opacity-85"
      :class="isPremium ? 'bg-amber-500/20' : 'bg-[#7C3AED]/20'"
      @click="router.push('/settings')"
    >
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        :style="isPremium
          ? 'background:linear-gradient(135deg,#d97706,#f59e0b);'
          : 'background:rgba(124,58,237,0.55);'"
      >
        <span v-if="user?.avatar">{{ user.avatar }}</span>
        <span v-else class="text-white font-bold">{{ user?.username?.[0]?.toUpperCase() || '?' }}</span>
      </div>

      <div class="hidden sm:flex flex-col leading-tight">
        <span class="text-sm font-semibold text-white">{{ user?.username || 'Account' }}</span>
        <span v-if="isPremium" class="text-[10px] text-amber-400 flex items-center gap-1">
          <i class="fa-solid fa-crown text-[8px]"></i>Premium
        </span>
        <span v-else class="text-[10px] text-purple-400">Standard</span>
      </div>
      <i class="fa-solid fa-chevron-right text-xs text-white/25 hidden sm:block"></i>
    </button>

  </div>
</header>
</template>
