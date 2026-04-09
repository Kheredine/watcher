<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserLibrary } from '@/composables/useUserLibrary'
import { useUserPreferences } from '@/composables/useUserPreferences'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { liked, watchlist } = useUserLibrary()
const { getTopMoods, getMoodForHour } = useUserPreferences()
const { t } = useI18n()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500'

// Tabs for trending and top10
const trendingPeriod = ref('week')
const top10Period    = ref('week')
const top10Category  = ref('movie')

// Categories for top 10
const categories = [
  { id: 'movie',         label: 'Films' },
  { id: 'tv',            label: 'Series' },
  { id: 'anime',         label: 'Anime' },
  { id: 'reality',       label: 'Reality TV' },
  { id: 'documentary',   label: 'Docs' },
]

const trending          = ref([])
const top10             = ref([])
const personalized      = ref([])
const loadingTrending   = ref(false)
const loadingTop10      = ref(false)
const loadingPersonal   = ref(false)

// ---- TMDB fetch helpers ----
const tmdb = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', TMDB_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  return res.json()
}

const fetchTrending = async () => {
  loadingTrending.value = true
  try {
    const data = await tmdb(`/trending/all/${trendingPeriod.value}`)
    trending.value = data.results?.slice(0, 10) || []
  } finally {
    loadingTrending.value = false
  }
}

const ANIME_GENRE_ID = 16  // Animation (proxy for anime via with_original_language=ja)

const fetchTop10 = async () => {
  loadingTop10.value = true
  try {
    let data
    if (top10Category.value === 'anime') {
      data = await tmdb('/discover/tv', {
        sort_by: 'popularity.desc',
        with_genres: ANIME_GENRE_ID,
        with_original_language: 'ja',
        'vote_count.gte': 100,
      })
    } else if (top10Category.value === 'reality') {
      data = await tmdb('/discover/tv', {
        sort_by: 'popularity.desc',
        with_genres: 10764,  // Reality genre ID
      })
    } else if (top10Category.value === 'documentary') {
      const mediaType = 'movie'
      data = await tmdb(`/discover/${mediaType}`, {
        sort_by: 'popularity.desc',
        with_genres: 99,  // Documentary
      })
    } else {
      const timeParam = top10Period.value === 'week' ? 'week' : 'day'
      data = await tmdb(`/trending/${top10Category.value}/${timeParam}`)
    }
    top10.value = (data.results || []).slice(0, 10)
  } finally {
    loadingTop10.value = false
  }
}

const fetchPersonalized = async () => {
  loadingPersonal.value = true
  try {
    const topMoods   = getTopMoods(3)
    const hour       = new Date().getHours()
    const moodForNow = getMoodForHour(hour)
    const likedTitles = liked.value.slice(0, 10).map(i => i.title).filter(Boolean)

    const res = await fetch('http://localhost:3001/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topMoods: moodForNow ? [moodForNow, ...topMoods] : topMoods, currentHour: hour, likedTitles }),
    })

    if (!res.ok) throw new Error('Server error')
    const suggestions = await res.json()

    // Verify each in TMDB
    const results = await Promise.all(
      suggestions.map(async (s) => {
        const type = s.mediaType === 'tv' ? 'tv' : 'movie'
        const r = await tmdb(`/search/${type}`, { query: s.title, year: s.year })
        const item = r.results?.[0]
        if (!item) return null
        return {
          id:     item.id,
          type,
          title:  item.title || item.name,
          year:   (item.release_date || item.first_air_date || '').split('-')[0],
          poster: item.poster_path ? `${IMG_BASE}${item.poster_path}` : null,
          rating: item.vote_average?.toFixed(1),
          reason: s.reason,
        }
      })
    )
    personalized.value = results.filter(Boolean)
  } catch {
    personalized.value = []
  } finally {
    loadingPersonal.value = false
  }
}

const goDetail = (item) => {
  const type = item.media_type || item.type || 'movie'
  const normalType = type === 'movie' ? 'movie' : 'tv'
  router.push({ name: 'detail', params: { type: normalType, id: item.id } })
}

const posterUrl = (item) =>
  item.poster_path ? `${IMG_BASE}${item.poster_path}` : (item.poster || null)

const itemTitle = (item) => item.title || item.name || ''
const itemYear  = (item) => ((item.release_date || item.first_air_date || '')).split('-')[0]

onMounted(() => {
  fetchTrending()
  fetchTop10()
  fetchPersonalized()
})

// Refetch when period or category changes
import { watch } from 'vue'
watch(trendingPeriod, fetchTrending)
watch([top10Period, top10Category], fetchTop10)
</script>

<template>
  <div class="flex flex-col gap-16 pb-12">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-1">{{ t.discoverTitle }}</h1>
      <p class="text-white/40 text-sm">Explore what's out there</p>
    </div>

    <!-- For You (Personalized) -->
    <section>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-sm font-semibold text-white uppercase tracking-widest">{{ t.forYou }}</h2>
        <span class="text-white/30 text-xs">Based on your taste</span>
      </div>

      <div v-if="loadingPersonal" class="flex gap-2 items-center text-white/40 text-sm">
        <div class="w-4 h-4 border border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
        Loading...
      </div>

      <div v-else-if="personalized.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          v-for="item in personalized"
          :key="`${item.type}-${item.id}`"
          class="group cursor-pointer"
          @click="goDetail(item)"
        >
          <div class="relative w-full h-44 rounded-xl overflow-hidden bg-white/5 mb-2">
            <img v-if="item.poster" :src="item.poster" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center text-white/20"><i class="fa-solid fa-film text-2xl"></i></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          </div>
          <p class="text-white/80 text-xs font-medium line-clamp-2">{{ item.title }}</p>
          <p v-if="item.reason" class="text-white/40 text-[10px] mt-0.5 line-clamp-2">{{ item.reason }}</p>
        </div>
      </div>

      <p v-else class="text-white/30 text-sm">Use The Oracle and like some recommendations to personalize this section.</p>
    </section>

    <!-- Trending -->
    <section>
      <div class="flex flex-wrap items-center gap-4 mb-5">
        <h2 class="text-sm font-semibold text-white uppercase tracking-widest">{{ t.trending }}</h2>
        <div class="flex gap-2 ml-auto">
          <button
            v-for="period in ['week','day']"
            :key="period"
            class="px-3 py-1 rounded-lg text-xs font-medium transition"
            :class="trendingPeriod === period ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
            @click="trendingPeriod = period"
          >
            {{ period === 'week' ? t.thisWeek : 'Today' }}
          </button>
        </div>
      </div>

      <div v-if="loadingTrending" class="flex gap-2 items-center text-white/40 text-sm">
        <div class="w-4 h-4 border border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
        Loading...
      </div>

      <div v-else class="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
        <div
          v-for="(item, i) in trending"
          :key="item.id"
          class="flex-shrink-0 w-36 cursor-pointer group"
          @click="goDetail(item)"
        >
          <div class="relative w-full h-52 rounded-xl overflow-hidden bg-white/5 mb-2">
            <img v-if="posterUrl(item)" :src="posterUrl(item)" :alt="itemTitle(item)" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center text-white/20"><i class="fa-solid fa-film text-2xl"></i></div>
            <!-- rank -->
            <span class="absolute bottom-2 left-2 text-4xl font-black text-white/20 leading-none select-none">{{ i + 1 }}</span>
          </div>
          <p class="text-white/80 text-xs font-medium line-clamp-2">{{ itemTitle(item) }}</p>
          <p class="text-white/30 text-[10px]">{{ itemYear(item) }}</p>
        </div>
      </div>
    </section>

    <!-- Top 10 -->
    <section>
      <div class="flex flex-wrap items-center gap-4 mb-5">
        <h2 class="text-sm font-semibold text-white uppercase tracking-widest">{{ t.top10 }}</h2>

        <!-- Period toggle (only for movie/tv) -->
        <div v-if="['movie','tv'].includes(top10Category)" class="flex gap-2">
          <button
            v-for="period in ['week','month']"
            :key="period"
            class="px-3 py-1 rounded-lg text-xs font-medium transition"
            :class="top10Period === period ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
            @click="top10Period = period"
          >
            {{ period === 'week' ? t.thisWeek : t.thisMonth }}
          </button>
        </div>

        <!-- Category tabs -->
        <div class="flex gap-2 ml-auto flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="px-3 py-1 rounded-lg text-xs font-medium transition"
            :class="top10Category === cat.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'"
            @click="top10Category = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div v-if="loadingTop10" class="flex gap-2 items-center text-white/40 text-sm">
        <div class="w-4 h-4 border border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
        Loading...
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(item, i) in top10"
          :key="item.id"
          class="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/5 cursor-pointer transition group"
          @click="goDetail(item)"
        >
          <!-- Rank number -->
          <span class="text-2xl font-black text-white/20 w-8 text-center flex-shrink-0">{{ i + 1 }}</span>

          <!-- Poster -->
          <div class="w-10 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
            <img v-if="posterUrl(item)" :src="posterUrl(item)" class="w-full h-full object-cover" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-white/90 text-sm font-medium truncate group-hover:text-white transition">{{ itemTitle(item) }}</p>
            <p class="text-white/40 text-xs">{{ itemYear(item) }}</p>
          </div>

          <!-- Rating -->
          <span v-if="item.vote_average" class="text-yellow-400 text-xs font-medium flex-shrink-0">
            ⭐ {{ item.vote_average.toFixed(1) }}
          </span>

          <i class="fa-solid fa-chevron-right text-white/20 text-xs flex-shrink-0 group-hover:text-white/50 transition"></i>
        </div>
      </div>
    </section>

  </div>
</template>
