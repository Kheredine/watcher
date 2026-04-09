<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserLibrary } from '@/composables/useUserLibrary'

const route  = useRoute()
const router = useRouter()
const { isLiked, isInWatchlist, isWatched, toggleLike, toggleWatchlist, toggleWatched } = useUserLibrary()

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

const type = route.params.type   // 'movie' | 'tv'
const id   = route.params.id

const detail           = ref(null)
const loading          = ref(true)
const error            = ref(null)
const activeProviderTab = ref('flatrate')

// ── Computed helpers ──────────────────────────────────────────────────────────

const title    = computed(() => detail.value?.title || detail.value?.name || '')
const year     = computed(() => (detail.value?.release_date || detail.value?.first_air_date || '').split('-')[0] || null)
const backdrop = computed(() => detail.value?.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.value.backdrop_path}` : null)
const poster   = computed(() => detail.value?.poster_path   ? `https://image.tmdb.org/t/p/w500${detail.value.poster_path}`       : null)
const genres   = computed(() => detail.value?.genres || [])
const rating   = computed(() => detail.value?.vote_average > 0 ? detail.value.vote_average.toFixed(1) : null)
const overview = computed(() => detail.value?.overview || null)

const runtime = computed(() => {
    if (!detail.value) return null
    if (type === 'movie') {
        const m = detail.value.runtime
        if (!m) return null
        return `${Math.floor(m / 60)}h ${m % 60}m`
    }
    const s = detail.value.number_of_seasons
    const e = detail.value.number_of_episodes
    if (!s) return null
    return `${s} season${s !== 1 ? 's' : ''} · ${e} ep.`
})

const cast = computed(() => (detail.value?.credits?.cast || []).slice(0, 8))

const credit = computed(() => {
    if (!detail.value) return null
    if (type === 'movie') {
        const dir = (detail.value?.credits?.crew || []).find(c => c.job === 'Director')
        return dir ? { label: 'Directed by', name: dir.name } : null
    }
    const creators = (detail.value?.created_by || []).map(c => c.name).join(', ')
    return creators ? { label: 'Created by', name: creators } : null
})

const trailer = computed(() => {
    const vids = detail.value?.videos?.results || []
    return (
        vids.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official) ||
        vids.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
        vids.find(v => v.site === 'YouTube') ||
        null
    )
})

const providers = computed(() => {
    const all = detail.value?.['watch/providers']?.results || {}
    const userCountry = navigator.language?.split('-')?.[1]?.toUpperCase()
    for (const code of [userCountry, 'US', 'GB', 'FR', 'CA', 'AU'].filter(Boolean)) {
        if (all[code]) return all[code]
    }
    return Object.values(all)[0] || null
})

// Set default provider tab to first that has data
watch(providers, (p) => {
    if (!p) return
    if (p.flatrate?.length)     activeProviderTab.value = 'flatrate'
    else if (p.rent?.length)    activeProviderTab.value = 'rent'
    else if (p.buy?.length)     activeProviderTab.value = 'buy'
}, { immediate: true })

const itemForLibrary = computed(() => ({
    id:     Number(id),
    type,
    title:  title.value,
    poster: poster.value,
    year:   year.value,
    rating: rating.value,
}))

// ── Fetch ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
    try {
        const res = await fetch(
            `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,videos,watch/providers`
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data.success === false) throw new Error(data.status_message || 'Not found')
        detail.value = data
    } catch (e) {
        error.value = e.message || 'Failed to load details'
        console.error('[Tazama]', e)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="text-[#fbffff] min-h-[60vh]">

        <!-- Back -->
        <button
            @click="router.back()"
            class="flex items-center gap-2 text-[#949da3] hover:text-white transition text-sm mb-6"
        >
            <i class="fa-solid fa-arrow-left"></i> Back
        </button>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center min-h-[50vh] gap-3 text-[#949da3]">
            <i class="fa-solid fa-spinner animate-spin text-2xl"></i>
            <span>Loading…</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-[#949da3]">
            <i class="fa-solid fa-circle-exclamation text-3xl text-red-400"></i>
            <p class="text-red-400">{{ error }}</p>
            <button @click="router.back()" class="btn-secondary-2">Go back</button>
        </div>

        <!-- Content -->
        <div v-else-if="detail">

            <!-- ── Backdrop ──────────────────────────────────────────── -->
            <div class="relative -mx-6 md:-mx-12 -mt-6 md:-mt-12 h-64 md:h-96 overflow-hidden rounded-t-lg mb-0">
                <img v-if="backdrop" :src="backdrop" :alt="title" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-purple-500/10 flex items-center justify-center">
                    <i class="fa-solid fa-film text-5xl text-[#949da3]"></i>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#0a0615] via-[#0a0615]/50 to-transparent"></div>
            </div>

            <!-- ── Poster + title row ────────────────────────────────── -->
            <div class="flex gap-6 md:gap-10 -mt-20 md:-mt-28 relative z-10">

                <!-- Poster -->
                <div class="shrink-0 hidden sm:block">
                    <img
                        v-if="poster"
                        :src="poster" :alt="title"
                        class="w-36 md:w-44 rounded-xl shadow-2xl aspect-[2/3] object-cover"
                    />
                    <div v-else class="w-36 md:w-44 rounded-xl bg-purple-500/10 aspect-[2/3] flex items-center justify-center">
                        <i class="fa-solid fa-film text-2xl text-[#949da3]"></i>
                    </div>
                </div>

                <!-- Text -->
                <div class="flex flex-col gap-3 flex-1 self-end pb-2 pt-16 sm:pt-0">
                    <h1 class="text-2xl md:text-3xl font-bold leading-tight">{{ title }}</h1>

                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#949da3]">
                        <span v-if="year">{{ year }}</span>
                        <span v-if="runtime" class="flex items-center gap-2">
                            <span class="w-1 h-1 rounded-full bg-[#949da3]"></span>{{ runtime }}
                        </span>
                        <span v-if="rating" class="flex items-center gap-2">
                            <span class="w-1 h-1 rounded-full bg-[#949da3]"></span>
                            <i class="fa-solid fa-star text-yellow-400 text-xs"></i> {{ rating }}
                        </span>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="g in genres" :key="g.id"
                            class="text-xs px-3 py-1 rounded-full border border-purple-500/40 text-[#949da3]"
                        >{{ g.name }}</span>
                    </div>
                </div>

            </div>

            <!-- ── Action buttons ────────────────────────────────────── -->
            <div class="flex flex-wrap gap-3 mt-7">

                <button
                    @click="toggleLike(itemForLibrary)"
                    :class="['flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all', isLiked(Number(id), type) ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'border-white/10 text-[#949da3] hover:border-white/30 hover:text-white']"
                >
                    <i :class="isLiked(Number(id), type) ? 'fa-solid fa-star text-rose-400' : 'fa-regular fa-star'"></i>
                    {{ isLiked(Number(id), type) ? 'Liked' : 'Like' }}
                </button>

                <button
                    @click="toggleWatchlist(itemForLibrary)"
                    :class="['flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all', isInWatchlist(Number(id), type) ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-[#949da3] hover:border-white/30 hover:text-white']"
                >
                    <i :class="isInWatchlist(Number(id), type) ? 'fa-solid fa-bookmark text-purple-400' : 'fa-regular fa-bookmark'"></i>
                    {{ isInWatchlist(Number(id), type) ? 'In Watchlist' : 'Add to Watchlist' }}
                </button>

                <button
                    @click="toggleWatched(itemForLibrary)"
                    :class="['flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all', isWatched(Number(id), type) ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-white/10 text-[#949da3] hover:border-white/30 hover:text-white']"
                >
                    <i :class="isWatched(Number(id), type) ? 'fa-solid fa-circle-check text-green-400' : 'fa-solid fa-eye'"></i>
                    {{ isWatched(Number(id), type) ? 'Watched' : 'Mark as Watched' }}
                </button>

            </div>

            <!-- ── Overview ──────────────────────────────────────────── -->
            <div v-if="overview" class="mt-9">
                <h2 class="uppercase text-xs tracking-2 font-medium text-[#949da3] mb-3">Overview</h2>
                <p class="text-[#fbffff]/80 leading-relaxed max-w-3xl">{{ overview }}</p>
            </div>

            <!-- ── Director / Creator ────────────────────────────────── -->
            <p v-if="credit" class="mt-5 text-sm">
                <span class="text-[#949da3]">{{ credit.label }}</span>
                <span class="ml-2 font-medium">{{ credit.name }}</span>
            </p>

            <!-- ── Cast ──────────────────────────────────────────────── -->
            <div v-if="cast.length" class="mt-10">
                <h2 class="uppercase text-xs tracking-2 font-medium text-[#949da3] mb-4">Cast</h2>
                <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    <div v-for="actor in cast" :key="actor.id" class="flex-shrink-0 flex flex-col items-center gap-2 w-20 text-center">
                        <img
                            v-if="actor.profile_path"
                            :src="`https://image.tmdb.org/t/p/w185${actor.profile_path}`"
                            :alt="actor.name"
                            class="w-16 h-16 rounded-full object-cover border border-purple-500/20"
                        />
                        <div v-else class="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <i class="fa-solid fa-user text-[#949da3] text-sm"></i>
                        </div>
                        <span class="text-xs text-[#949da3] leading-tight">{{ actor.name }}</span>
                        <span v-if="actor.character" class="text-xs text-[#949da3]/50 leading-tight truncate w-full">{{ actor.character }}</span>
                    </div>
                </div>
            </div>

            <!-- ── Where to Watch ────────────────────────────────────── -->
            <div class="mt-10">
                <h2 class="uppercase text-xs tracking-2 font-medium text-[#949da3] mb-4">Where to Watch</h2>

                <template v-if="providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length)">

                    <!-- Tab bar -->
                    <div class="flex gap-2 mb-5 text-sm">
                        <button v-if="providers.flatrate?.length"
                            @click="activeProviderTab = 'flatrate'"
                            :class="['px-3 py-1 rounded-lg transition', activeProviderTab === 'flatrate' ? 'bg-purple-500/30 text-white' : 'text-[#949da3] hover:text-white']"
                        >Stream</button>
                        <button v-if="providers.rent?.length"
                            @click="activeProviderTab = 'rent'"
                            :class="['px-3 py-1 rounded-lg transition', activeProviderTab === 'rent' ? 'bg-purple-500/30 text-white' : 'text-[#949da3] hover:text-white']"
                        >Rent</button>
                        <button v-if="providers.buy?.length"
                            @click="activeProviderTab = 'buy'"
                            :class="['px-3 py-1 rounded-lg transition', activeProviderTab === 'buy' ? 'bg-purple-500/30 text-white' : 'text-[#949da3] hover:text-white']"
                        >Buy</button>
                    </div>

                    <!-- Provider logos -->
                    <div class="flex flex-wrap gap-4">
                        <a
                            v-for="p in (providers[activeProviderTab] || [])"
                            :key="p.provider_id"
                            :href="providers.link"
                            target="_blank" rel="noopener noreferrer"
                            :title="p.provider_name"
                            class="flex flex-col items-center gap-1 group"
                        >
                            <img
                                v-if="p.logo_path"
                                :src="`https://image.tmdb.org/t/p/w92${p.logo_path}`"
                                :alt="p.provider_name"
                                class="w-12 h-12 rounded-xl border border-white/10 group-hover:border-purple-500/60 transition object-cover"
                            />
                            <span class="text-xs text-[#949da3] group-hover:text-white transition max-w-[56px] truncate text-center">
                                {{ p.provider_name }}
                            </span>
                        </a>
                    </div>

                    <p class="text-xs text-[#949da3] mt-4">
                        Streaming data by JustWatch ·
                        <a v-if="providers.link" :href="providers.link" target="_blank" class="text-purple-400 hover:underline">
                            View all options
                        </a>
                    </p>

                </template>

                <p v-else class="text-[#949da3] text-sm">No streaming information available in your region.</p>
            </div>

            <!-- ── Trailer ────────────────────────────────────────────── -->
            <div v-if="trailer" class="mt-10">
                <h2 class="uppercase text-xs tracking-2 font-medium text-[#949da3] mb-4">Trailer</h2>
                <div class="relative aspect-video rounded-xl overflow-hidden max-w-3xl border border-purple-500/20">
                    <iframe
                        :src="`https://www.youtube.com/embed/${trailer.key}?rel=0`"
                        :title="trailer.name || 'Trailer'"
                        class="w-full h-full"
                        allowfullscreen
                        loading="lazy"
                    ></iframe>
                </div>
            </div>

        </div>
    </div>
</template>
