import { ref } from 'vue'

const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]') }
    catch { return [] }
}
const save = (key, list) => localStorage.setItem(key, JSON.stringify(list))

const watchlist = ref(load('tazama_watchlist'))
const watched   = ref(load('tazama_watched'))
const liked     = ref(load('tazama_liked'))

const toggle = (list, key, item) => {
    const idx = list.value.findIndex(i => i.id === item.id && i.type === item.type)
    if (idx === -1) list.value.push(item)
    else list.value.splice(idx, 1)
    save(key, list.value)
}

export function useUserLibrary() {
    const isInWatchlist = (id, type) => watchlist.value.some(i => i.id === id && i.type === type)
    const isWatched     = (id, type) => watched.value.some(i => i.id === id && i.type === type)
    const isLiked       = (id, type) => liked.value.some(i => i.id === id && i.type === type)

    const toggleWatchlist = (item) => toggle(watchlist, 'tazama_watchlist', item)
    const toggleWatched   = (item) => toggle(watched,   'tazama_watched',   item)
    const toggleLike      = (item) => toggle(liked,     'tazama_liked',     item)

    return { isInWatchlist, isWatched, isLiked, toggleWatchlist, toggleWatched, toggleLike, watchlist, watched, liked }
}
