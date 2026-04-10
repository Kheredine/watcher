import { ref } from 'vue'

const load = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// Module-level — persist across navigation
const watchlist = ref(load('tazama_watchlist'))
const watched   = ref(load('tazama_watched'))
const liked     = ref(load('tazama_liked'))
const history   = ref(load('tazama_history'))   // streaming platform import history

const same = (a, b) => String(a.id) === String(b.id) && a.type === b.type

export function useUserLibrary() {
  const isInWatchlist = (item) => watchlist.value.some(x => same(x, item))
  const isWatched     = (item) => watched.value.some(x => same(x, item))
  const isLiked       = (item) => liked.value.some(x => same(x, item))

  const toggle = (listRef, key, item) => {
    const idx = listRef.value.findIndex(x => same(x, item))
    if (idx >= 0) listRef.value.splice(idx, 1)
    else          listRef.value.unshift(item)
    save(key, listRef.value)
  }

  const toggleWatchlist = (item) => toggle(watchlist, 'tazama_watchlist', item)
  const toggleWatched   = (item) => toggle(watched,   'tazama_watched',   item)
  const toggleLike      = (item) => toggle(liked,     'tazama_liked',     item)

  const addHistory = (entry) => {
    history.value.unshift({ ...entry, addedAt: Date.now() })
    save('tazama_history', history.value)
  }

  return {
    watchlist,
    watched,
    liked,
    history,
    isInWatchlist,
    isWatched,
    isLiked,
    toggleWatchlist,
    toggleWatched,
    toggleLike,
    addHistory,
  }
}
