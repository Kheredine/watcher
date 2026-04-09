<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserLibrary } from '@/composables/useUserLibrary'
import { useI18n } from '@/composables/useI18n'

const route  = useRoute()
const router = useRouter()
const { isInWatchlist, isWatched, isLiked, toggleWatchlist, toggleWatched, toggleLike } = useUserLibrary()
const { t } = useI18n()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/'

const media    = ref(null)
const loading  = ref(true)
const error    = ref(null)
const activeTab = ref('stream')

const type = route.params.type   // 'movie' | 'tv'
const id   = route.params.id

// Direct platform URLs by TMDB provider_id
const PLATFORM_URLS = {
  8:   (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  9:   (title) => `https://www.amazon.com/gp/video/search?phrase=${encodeURIComponent(title)}`,
  10:  (title) => `https://www.amazon.com/gp/video/search?phrase=${encodeURIComponent(title)}`,
  337: (title) => `https://www.disneyplus.com/search/${encodeURIComponent(title)}`,
  283: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
  384: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`,
  350: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  531: (title) => `https://www.paramountplus.com/search/?query=${encodeURIComponent(title)}`,
  386: (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
  387: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
}

const getPlatformUrl = (provider, title, fallbackLink) => {
  const fn = PLATFORM_URLS[provider.provider_id]
  return fn ? fn(title) : (fallbackLink || `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`)
}

onMounted(async () => {
  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,videos,watch/providers`
    )
    if (!res.ok) throw new Error('Not found')
    media.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const title      = computed(() => media.value?.title || media.value?.name || '')
const year       = computed(() => (media.value?.release_date || media.value?.first_air_date || '').split('-')[0])
const overview   = computed(() => media.value?.overview || '')
const backdrop   = computed(() => media.value?.backdrop_path ? `${IMG_BASE}w1280${media.value.backdrop_path}` : null)
const poster     = computed(() => media.value?.poster_path   ? `${IMG_BASE}w500${media.value.poster_path}`   : null)
const rating     = computed(() => media.value?.vote_average?.toFixed(1))
const runtime    = computed(() => {
  if (type === 'movie') {
    const m = media.value?.runtime
    return m ? `${Math.floor(m/60)}h ${m%60}m` : ''
  }
  return media.value?.number_of_seasons ? `${media.value.number_of_seasons} season(s)` : ''
})

const director   = computed(() => {
  if (type === 'movie') return media.value?.credits?.crew?.find(c => c.job === 'Director')?.name
  return null
})
const creators   = computed(() => media.value?.created_by?.map(c => c.name).join(', '))
const cast       = computed(() => media.value?.credits?.cast?.slice(0, 8) || [])

const trailer    = computed(() => {
  const vids = media.value?.videos?.results || []
  return vids.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || vids.find(v => v.site === 'YouTube')
})

const providers  = computed(() => media.value?.['watch/providers']?.results?.US || {})
const streamList = computed(() => providers.value?.flatrate || [])
const rentList   = computed(() => providers.value?.rent     || [])
const buyList    = computed(() => providers.value?.buy      || [])
const jwLink     = computed(() => providers.value?.link     || '')

const libItem    = computed(() => ({ id: Number(id), type, title: title.value, poster: poster.value, year: year.value }))
</script>

<template>
  <div class="min-h-screen text-white">

    <!-- Back button — fixed top-left, prominent -->
    <button
      @click="router.back()"
      class="fixed top-20 left-4 md:left-72 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a0615]/80 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:border-purple-500/60 transition font-medium text-sm"
    >
      <i class="fa-solid fa-arrow-left"></i>
      <span class="hidden sm:inline">{{ t.backBtn }}</span>
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-32">
      <div class="w-10 h-10 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-red-400 p-8">{{ error }}</div>

    <!-- Content -->
    <template v-else-if="media">

      <!-- Backdrop hero -->
      <div class="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-8">
        <img v-if="backdrop" :src="backdrop" :alt="title" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-purple-900/40"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#0a0615] via-[#0a0615]/40 to-transparent"></div>
      </div>

      <!-- Main info row -->
      <div class="flex flex-col md:flex-row gap-8 mb-10 -mt-24 relative px-2">
        <!-- Poster -->
        <div class="flex-shrink-0 w-36 md:w-48 mx-auto md:mx-0">
          <img v-if="poster" :src="poster" :alt="title" class="w-full rounded-xl shadow-2xl" />
        </div>

        <!-- Details -->
        <div class="flex flex-col gap-4 justify-end pb-2">
          <h1 class="text-2xl md:text-4xl font-bold">{{ title }}</h1>

          <div class="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span v-if="year">{{ year }}</span>
            <span v-if="rating" class="text-yellow-400 font-medium">⭐ {{ rating }}</span>
            <span v-if="runtime">{{ runtime }}</span>
            <span
              v-for="genre in (media.genres || []).slice(0, 3)"
              :key="genre.id"
              class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
            >{{ genre.name }}</span>
          </div>

          <p v-if="director" class="text-sm text-white/50">
            {{ t.director }}: <span class="text-white/80">{{ director }}</span>
          </p>
          <p v-if="creators" class="text-sm text-white/50">
            {{ t.creator }}: <span class="text-white/80">{{ creators }}</span>
          </p>

          <!-- Action buttons -->
          <div class="flex flex-wrap gap-3 mt-2">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              :class="isLiked(libItem) ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/5 text-white/60 border border-white/10 hover:border-red-500/40 hover:text-red-400'"
              @click="toggleLike(libItem)"
            >
              <i class="fa-solid fa-heart"></i>
              {{ isLiked(libItem) ? t.liked : t.like }}
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              :class="isInWatchlist(libItem) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-white/5 text-white/60 border border-white/10 hover:border-blue-500/40 hover:text-blue-400'"
              @click="toggleWatchlist(libItem)"
            >
              <i class="fa-solid fa-bookmark"></i>
              {{ isInWatchlist(libItem) ? t.inWatchlist : t.addWatchlist }}
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              :class="isWatched(libItem) ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-white/5 text-white/60 border border-white/10 hover:border-green-500/40 hover:text-green-400'"
              @click="toggleWatched(libItem)"
            >
              <i class="fa-solid fa-check"></i>
              {{ isWatched(libItem) ? t.alreadyWatched : t.markWatched }}
            </button>
          </div>
        </div>
      </div>

      <!-- Overview -->
      <div v-if="overview" class="mb-10">
        <p class="text-white/70 leading-relaxed max-w-3xl">{{ overview }}</p>
      </div>

      <!-- Cast -->
      <div v-if="cast.length" class="mb-10">
        <h2 class="text-xs uppercase tracking-widest text-white/40 mb-4 font-medium">{{ t.cast }}</h2>
        <div class="flex gap-4 overflow-x-auto pb-2">
          <div
            v-for="actor in cast"
            :key="actor.id"
            class="flex-shrink-0 flex flex-col items-center gap-2 w-20"
          >
            <img
              v-if="actor.profile_path"
              :src="`${IMG_BASE}w185${actor.profile_path}`"
              :alt="actor.name"
              class="w-16 h-16 rounded-full object-cover border border-white/10"
            />
            <div v-else class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <i class="fa-solid fa-user text-white/30"></i>
            </div>
            <p class="text-white/70 text-[11px] text-center leading-tight">{{ actor.name }}</p>
          </div>
        </div>
      </div>

      <!-- Where to Watch -->
      <div class="mb-10">
        <h2 class="text-xs uppercase tracking-widest text-white/40 mb-4 font-medium">{{ t.whereToWatch }}</h2>

        <!-- Tabs -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="tab in ['stream','rent','buy']"
            :key="tab"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition"
            :class="activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
            @click="activeTab = tab"
          >
            {{ tab === 'stream' ? t.stream : tab === 'rent' ? t.rent : t.buy }}
          </button>
        </div>

        <!-- Stream -->
        <div v-if="activeTab === 'stream'">
          <div v-if="streamList.length" class="flex flex-wrap gap-3">
            <a
              v-for="p in streamList"
              :key="p.provider_id"
              :href="getPlatformUrl(p, title, jwLink)"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition"
            >
              <img :src="`${IMG_BASE}w45${p.logo_path}`" :alt="p.provider_name" class="w-7 h-7 rounded-lg" />
              <span class="text-sm text-white/80">{{ p.provider_name }}</span>
            </a>
          </div>
          <p v-else class="text-white/40 text-sm">{{ t.notAvailable }}</p>
        </div>

        <!-- Rent -->
        <div v-if="activeTab === 'rent'">
          <div v-if="rentList.length" class="flex flex-wrap gap-3">
            <a
              v-for="p in rentList"
              :key="p.provider_id"
              :href="getPlatformUrl(p, title, jwLink)"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition"
            >
              <img :src="`${IMG_BASE}w45${p.logo_path}`" :alt="p.provider_name" class="w-7 h-7 rounded-lg" />
              <span class="text-sm text-white/80">{{ p.provider_name }}</span>
            </a>
          </div>
          <p v-else class="text-white/40 text-sm">{{ t.notAvailable }}</p>
        </div>

        <!-- Buy -->
        <div v-if="activeTab === 'buy'">
          <div v-if="buyList.length" class="flex flex-wrap gap-3">
            <a
              v-for="p in buyList"
              :key="p.provider_id"
              :href="getPlatformUrl(p, title, jwLink)"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition"
            >
              <img :src="`${IMG_BASE}w45${p.logo_path}`" :alt="p.provider_name" class="w-7 h-7 rounded-lg" />
              <span class="text-sm text-white/80">{{ p.provider_name }}</span>
            </a>
          </div>
          <p v-else class="text-white/40 text-sm">{{ t.notAvailable }}</p>
        </div>
      </div>

      <!-- Trailer -->
      <div v-if="trailer" class="mb-10">
        <h2 class="text-xs uppercase tracking-widest text-white/40 mb-4 font-medium">{{ t.trailer }}</h2>
        <div class="relative w-full max-w-2xl" style="padding-top: 56.25%">
          <iframe
            class="absolute inset-0 w-full h-full rounded-xl"
            :src="`https://www.youtube.com/embed/${trailer.key}`"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
          ></iframe>
        </div>
      </div>

    </template>
  </div>
</template>
