<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOracleState } from '@/composables/useOracleState'
import { useUserLibrary } from '@/composables/useUserLibrary'
import { useUserPreferences } from '@/composables/useUserPreferences'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { selections, recommendations, loading, error, noResult, page, appendRecommendations } = useOracleState()
const { isInWatchlist, isWatched, isLiked, toggleWatchlist, toggleWatched, toggleLike } = useUserLibrary()
const { recordLikedMood, recordSkippedSet, isDisliked } = useUserPreferences()
const { t } = useI18n()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE  = 'https://image.tmdb.org/t/p/w500'

// ERA date ranges
const ERA_RANGES = {
  'Classic (pre-1980)': { gte: '1900-01-01', lte: '1979-12-31' },
  '80s': { gte: '1980-01-01', lte: '1989-12-31' },
  '90s': { gte: '1990-01-01', lte: '1999-12-31' },
  '2000s': { gte: '2000-01-01', lte: '2009-12-31' },
  '2010s': { gte: '2010-01-01', lte: '2019-12-31' },
  'Recent (2020+)': { gte: '2020-01-01', lte: new Date().toISOString().split('T')[0] },
}

const verifyInTMDB = async (suggestion, contentType) => {
  try {
    const type = contentType === 'Movies' ? 'movie' : 'tv'
    const yearParam = suggestion.year ? `&year=${suggestion.year}` : ''
    const url = `${TMDB_BASE}/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(suggestion.title)}${yearParam}`
    const res = await fetch(url)
    const data = await res.json()
    let result = data.results?.[0]
    if (!result && suggestion.year) {
      // Retry without year
      const url2 = `${TMDB_BASE}/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(suggestion.title)}`
      const res2 = await fetch(url2)
      const data2 = await res2.json()
      result = data2.results?.[0]
    }
    if (!result) return null
    return {
      id:     result.id,
      type,
      title:  result.title || result.name,
      year:   (result.release_date || result.first_air_date || '').split('-')[0],
      poster: result.poster_path ? `${IMG_BASE}${result.poster_path}` : null,
      rating: result.vote_average?.toFixed(1),
      reason: suggestion.reason,
    }
  } catch {
    return null
  }
}

const fetchRecommendations = async (isMore = false) => {
  if (!selections.value || loading.value) return

  if (isMore) {
    page.value++
    const sel = selections.value
    if (sel?.selectedMood) recordSkippedSet(sel.selectedMood.id, sel.selectedSubMood?.id)
  }

  loading.value  = true
  error.value    = null
  noResult.value = false

  try {
    const res = await fetch('http://localhost:3001/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...selections.value, page: page.value }),
    })
    if (!res.ok) throw new Error('Server error')

    const suggestions = await res.json()

    // Verify each suggestion in TMDB (browser-side), filter already shown
    const existingIds = new Set(recommendations.value.map(r => `${r.type}-${r.id}`))
    const results = await Promise.all(
      suggestions.map(s => verifyInTMDB(s, selections.value?.selectedContent))
    )
    const valid = results.filter(r => r && !isDisliked(r) && !existingIds.has(`${r.type}-${r.id}`))

    if (!valid.length && !isMore) noResult.value = true
    else appendRecommendations(valid)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Action helpers
const makeItem = (rec) => ({ id: rec.id, type: rec.type, title: rec.title, poster: rec.poster, year: rec.year })

const handleLike = (rec) => {
  toggleLike(makeItem(rec))
  if (selections.value?.selectedMood) recordLikedMood(selections.value.selectedMood.id)
}

const goDetail = (rec) => {
  router.push({ name: 'detail', params: { type: rec.type, id: rec.id } })
}

onMounted(() => {
  if (recommendations.value.length === 0) fetchRecommendations()
})
</script>

<template>
  <div class="flex flex-col gap-8">

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-4 py-12 text-white/60">
      <div class="w-10 h-10 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin"></div>
      <p class="text-sm">{{ t.loading }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-red-400 text-sm p-4 rounded-xl bg-red-500/10 border border-red-500/20">
      {{ error }}
      <button class="underline ml-2" @click="fetchRecommendations()">Retry</button>
    </div>

    <!-- No results -->
    <div v-else-if="noResult" class="text-[#949da3] text-sm p-4">{{ t.noResults }}</div>

    <!-- Cards -->
    <template v-else-if="recommendations.length">
      <h2 class="text-xs uppercase tracking-widest text-white/40 font-medium">{{ t.recommendationsTitle }}</h2>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="rec in recommendations"
          :key="`${rec.type}-${rec.id}`"
          class="rec-card group relative flex flex-col rounded-xl overflow-hidden cursor-pointer bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/60 transition duration-300"
          @click="goDetail(rec)"
        >
          <!-- Poster -->
          <div class="relative w-full h-52 flex-shrink-0 overflow-hidden bg-[#12121A]">
            <img
              v-if="rec.poster"
              :src="rec.poster"
              :alt="rec.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-white/20">
              <i class="fa-solid fa-film text-3xl"></i>
            </div>

            <!-- Rating badge -->
            <span v-if="rec.rating" class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-xs px-2 py-1 rounded-lg font-medium">
              ⭐ {{ rec.rating }}
            </span>

            <!-- Type badge -->
            <span class="absolute top-2 right-2 bg-purple-600/80 backdrop-blur-sm text-white text-[10px] uppercase px-2 py-1 rounded-lg font-medium">
              {{ rec.type === 'movie' ? 'Film' : 'Series' }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex flex-col gap-2 p-3 flex-1">
            <h3 class="text-white text-sm font-semibold leading-tight line-clamp-2">{{ rec.title }}</h3>
            <span class="text-white/40 text-xs">{{ rec.year }}</span>
            <p v-if="rec.reason" class="text-white/60 text-sm leading-relaxed line-clamp-3 mt-1">{{ rec.reason }}</p>
          </div>

          <!-- Action buttons -->
          <div class="flex border-t border-white/5 divide-x divide-white/5" @click.stop>
            <button
              class="flex-1 py-2.5 flex items-center justify-center gap-1 text-xs transition"
              :class="isLiked(makeItem(rec)) ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-red-400 hover:bg-red-500/10'"
              @click="handleLike(rec)"
              :title="t.like"
            >
              <i class="fa-solid fa-heart text-xs"></i>
            </button>
            <button
              class="flex-1 py-2.5 flex items-center justify-center gap-1 text-xs transition"
              :class="isInWatchlist(makeItem(rec)) ? 'text-blue-400 bg-blue-500/10' : 'text-white/40 hover:text-blue-400 hover:bg-blue-500/10'"
              @click="toggleWatchlist(makeItem(rec))"
              :title="t.addWatchlist"
            >
              <i class="fa-solid fa-bookmark text-xs"></i>
            </button>
            <button
              class="flex-1 py-2.5 flex items-center justify-center gap-1 text-xs transition"
              :class="isWatched(makeItem(rec)) ? 'text-green-400 bg-green-500/10' : 'text-white/40 hover:text-green-400 hover:bg-green-500/10'"
              @click="toggleWatched(makeItem(rec))"
              :title="t.markWatched"
            >
              <i class="fa-solid fa-check text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Show More button -->
      <div class="flex justify-center mt-2">
        <button
          class="btn-secondary-1 flex items-center gap-2"
          :disabled="loading"
          @click="fetchRecommendations(true)"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          {{ t.showMore }}
        </button>
      </div>
    </template>

  </div>
</template>
