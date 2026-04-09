<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

const MOVIE_GENRES = {
    'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
    'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
    'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
    'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
    'Thriller': 53, 'War': 10752, 'Western': 37
}

const TV_GENRES = {
    'Action & Adventure': 10759, 'Animation': 16, 'Comedy': 35,
    'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
    'Kids': 10762, 'Mystery': 9648, 'Reality': 10764,
    'Sci-Fi & Fantasy': 10765, 'War & Politics': 10768, 'Western': 37
}

const ERA_RANGES = {
    'Before 1970': { from: '1900-01-01', to: '1969-12-31' },
    '1970s':       { from: '1970-01-01', to: '1979-12-31' },
    '1980s':       { from: '1980-01-01', to: '1989-12-31' },
    '1990s':       { from: '1990-01-01', to: '1999-12-31' },
    '2000s':       { from: '2000-01-01', to: '2009-12-31' },
    '2010s':       { from: '2010-01-01', to: '2019-12-31' },
    '2020s':       { from: '2020-01-01', to: '2099-12-31' },
}

const rankings = [
    { position: '1st', color: 'bg-[#C8A96E]/40 border border-[#C8A96E]/40' },
    { position: '2nd', color: 'bg-[#4ECDC4]/40 border border-[#4ECDC4]/40' },
    { position: '3rd', color: 'bg-[#E8A598]/40 border border-[#E8A598]/30' },
]

const props = defineProps({
    selectedMood:    Object,
    selectedSubMood: Object,
    selectedTime:    String,
    selectedContent: String,
    selectedEra:     { type: String, default: 'Any era' },
})

const recommendations = ref([])
const loading  = ref(false)
const error    = ref(null)
const noResult = ref(false)

// Guard: ensure TMDB key is present
if (!TMDB_KEY) {
    error.value = 'TMDB API key is missing. Add VITE_TMDB_API_KEY to your frontend .env file.'
}

const buildDiscoverUrl = (type, genreIds, eraRange) => {
    const dateKey = type === 'movie' ? 'primary_release_date' : 'first_air_date'
    const params  = new URLSearchParams({
        api_key:    TMDB_KEY,
        with_genres: genreIds,
        sort_by:    'popularity.desc',
    })
    if (eraRange) {
        params.set(`${dateKey}.gte`, eraRange.from)
        params.set(`${dateKey}.lte`, eraRange.to)
    }
    return `${TMDB_BASE}/discover/${type}?${params}`
}

const buildSearchUrl = (type, query, eraRange) => {
    const dateKey = type === 'movie' ? 'primary_release_date' : 'first_air_date'
    const params  = new URLSearchParams({
        api_key: TMDB_KEY,
        query,
    })
    if (eraRange) {
        params.set(`${dateKey}.gte`, eraRange.from)
        params.set(`${dateKey}.lte`, eraRange.to)
    }
    return `${TMDB_BASE}/search/${type}?${params}`
}

const safeFetch = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TMDB request failed (${res.status})`)
    const data = await res.json()
    if (data.success === false) throw new Error(data.status_message || 'TMDB error')
    return data
}

const getRecommendations = async () => {
    if (!TMDB_KEY) return
    loading.value  = true
    error.value    = null
    noResult.value = false

    try {
        // ── Step 1: AI tags ──────────────────────────────────────────
        const tagsRes = await fetch('http://localhost:3001/api/tags', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedMood:    props.selectedMood,
                selectedSubMood: props.selectedSubMood,
                selectedTime:    props.selectedTime,
                selectedContent: props.selectedContent,
            })
        })

        if (!tagsRes.ok) throw new Error(`AI service error (${tagsRes.status}). Is the backend running?`)
        const tags = await tagsRes.json()
        if (tags.error) throw new Error(tags.detail || 'AI tag generation failed')

        // ── Step 2: TMDB discover / search ────────────────────────────
        const type     = props.selectedContent === 'Movies' ? 'movie' : 'tv'
        const genreMap = type === 'movie' ? MOVIE_GENRES : TV_GENRES
        const eraRange = ERA_RANGES[props.selectedEra] || null

        const genreIds = (tags.genres || [])
            .map(g => genreMap[g])
            .filter(Boolean)
            .join(',')

        let results = []

        // Try discover with genre IDs
        if (genreIds) {
            const data = await safeFetch(buildDiscoverUrl(type, genreIds, eraRange))
            results = data.results || []
        }

        // Fallback: text search with tone
        if (!results.length) {
            const query = tags.tone || tags.keywords?.[0] || tags.genres?.[0]
            if (query) {
                const data = await safeFetch(buildSearchUrl(type, query, eraRange))
                results = data.results || []
            }
        }

        // Second fallback: popular in era only (no genre/text filter)
        if (!results.length && eraRange) {
            const dateKey = type === 'movie' ? 'primary_release_date' : 'first_air_date'
            const params  = new URLSearchParams({
                api_key:  TMDB_KEY,
                sort_by:  'popularity.desc',
                [`${dateKey}.gte`]: eraRange.from,
                [`${dateKey}.lte`]: eraRange.to,
            })
            const data = await safeFetch(`${TMDB_BASE}/discover/${type}?${params}`)
            results = data.results || []
        }

        if (!results.length) {
            noResult.value = true
            recommendations.value = []
            return
        }

        recommendations.value = results.slice(0, 3).map(item => ({
            id:     item.id,
            type,
            title:  item.title  || item.name  || 'Untitled',
            year:   (item.release_date || item.first_air_date || '').split('-')[0] || null,
            poster: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null,
            rating: item.vote_average > 0 ? item.vote_average.toFixed(1) : null,
        }))

    } catch (e) {
        error.value = e.message || 'Could not load recommendations. Please try again.'
        console.error('[Tazama]', e)
    } finally {
        loading.value = false
    }
}

onMounted(getRecommendations)

const openDetail = (item) => {
    router.push({ name: 'detail', params: { type: item.type, id: item.id } })
}
</script>

<template>
    <div class="flex flex-col gap-10 text-[#fbffff] mb-12">
        <h2 class="uppercase text-sm tracking-2 font-medium">Recommendations</h2>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center gap-3 text-[#949da3] py-8">
            <i class="fa-solid fa-spinner animate-spin text-lg"></i>
            <span>Finding the perfect picks for you…</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col gap-4 py-4">
            <p class="text-red-400 text-sm flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation"></i>
                {{ error }}
            </p>
            <button @click="getRecommendations" class="btn-secondary-2 w-fit text-sm">
                <i class="fa-solid fa-rotate-right"></i> Try again
            </button>
        </div>

        <!-- No results -->
        <div v-else-if="noResult" class="flex flex-col gap-3 py-4 text-[#949da3]">
            <p class="flex items-center gap-2">
                <i class="fa-solid fa-magnifying-glass"></i>
                No results found for your selection.
            </p>
            <p class="text-sm">Try a different era, mood, or content type.</p>
        </div>

        <!-- Results -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="(item, index) in recommendations"
                :key="item.id"
                class="rec-card relative bg-purple-500/10 rounded-xl overflow-hidden cursor-pointer border border-purple-500/20 hover:border-purple-500/70 hover:scale-[1.02] transition-all duration-300"
                @click="openDetail(item)"
            >
                <!-- Poster -->
                <div class="aspect-[2/3] w-full overflow-hidden bg-purple-500/10">
                    <img
                        v-if="item.poster"
                        :src="item.poster"
                        :alt="item.title"
                        class="w-full h-full object-contain"
                        loading="lazy"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-[#949da3]">
                        <i class="fa-solid fa-film text-3xl"></i>
                        <span class="text-xs">No poster</span>
                    </div>
                </div>

                <!-- Ranking badge -->
                <span
                    :class="`absolute top-2 right-2 text-xs px-2 py-1 rounded-md font-medium ${rankings[index]?.color || 'bg-gray-500/40'}`"
                >
                    {{ rankings[index]?.position }}
                </span>

                <!-- Info -->
                <div class="p-4">
                    <h3 class="font-medium text-[#fbffff] truncate">{{ item.title }}</h3>
                    <div class="flex items-center gap-2 mt-1 text-sm text-[#949da3]">
                        <span v-if="item.year">{{ item.year }}</span>
                        <template v-if="item.year && item.rating">
                            <span class="w-1 h-1 rounded-full bg-[#949da3] inline-block"></span>
                        </template>
                        <span v-if="item.rating">
                            <i class="fa-solid fa-star text-yellow-400 text-xs mr-1"></i>{{ item.rating }}
                        </span>
                        <span v-if="!item.year && !item.rating" class="text-xs italic">Details unavailable</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
