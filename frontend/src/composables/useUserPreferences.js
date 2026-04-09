import { ref } from 'vue'

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// Module-level state
const prefs = ref(load('tazama_prefs', {
  likedMoods:     {},   // mood id → count
  dislikedItems:  [],   // { id, type } — skipped in "show more" flow
  skippedSets:    [],   // array of moods+submoods where user clicked "show more" on first results
  sessionMoods:   [],   // { hour, moodId } — time-of-day mood pattern
}))

export function useUserPreferences() {
  const _save = () => save('tazama_prefs', prefs.value)

  // Call when user likes or watches a recommendation
  const recordLikedMood = (moodId) => {
    prefs.value.likedMoods[moodId] = (prefs.value.likedMoods[moodId] || 0) + 1
    _save()
  }

  // Call when "show more" is clicked after first batch — implies partial dissatisfaction
  const recordSkippedSet = (moodId, subMoodId) => {
    prefs.value.skippedSets.push({ moodId, subMoodId, at: Date.now() })
    if (prefs.value.skippedSets.length > 100) prefs.value.skippedSets.shift()
    _save()
  }

  // Call when user dismisses/ignores a card without engaging
  const recordDisliked = (item) => {
    if (!prefs.value.dislikedItems.find(x => x.id === item.id && x.type === item.type)) {
      prefs.value.dislikedItems.push({ id: item.id, type: item.type })
      if (prefs.value.dislikedItems.length > 200) prefs.value.dislikedItems.shift()
      _save()
    }
  }

  // Record the mood selected at this hour of day
  const recordSessionMood = (moodId) => {
    const hour = new Date().getHours()
    prefs.value.sessionMoods.push({ hour, moodId, at: Date.now() })
    if (prefs.value.sessionMoods.length > 200) prefs.value.sessionMoods.shift()
    _save()
  }

  // Return top mood for a given hour range (±2 hours)
  const getMoodForHour = (hour) => {
    const range = prefs.value.sessionMoods.filter(s => Math.abs(s.hour - hour) <= 2)
    if (!range.length) return null
    const counts = {}
    range.forEach(s => { counts[s.moodId] = (counts[s.moodId] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  // Top N liked moods
  const getTopMoods = (n = 3) => {
    return Object.entries(prefs.value.likedMoods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id)
  }

  const isDisliked = (item) =>
    prefs.value.dislikedItems.some(x => x.id === item.id && x.type === item.type)

  return {
    prefs,
    recordLikedMood,
    recordSkippedSet,
    recordDisliked,
    recordSessionMood,
    getMoodForHour,
    getTopMoods,
    isDisliked,
  }
}
