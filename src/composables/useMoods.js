import { ref, computed } from 'vue'
import moodsData from '@/data/moods.json'

export function useMoods() {
  const moods = ref(moodsData.moods)
  const selectedMood = ref(null)
  const selectedSubMood = ref(null)

  // Sub-moods for the currently selected mood
  const currentSubMoods = computed(() =>
    selectedMood.value?.subMoods ?? []
  )

  // Examples for the currently selected sub-mood
  const currentExamples = computed(() =>
    selectedSubMood.value?.examples ?? []
  )

  function selectMood(mood) {
    selectedMood.value = mood
    selectedSubMood.value = null // reset sub-mood on new mood
  }

  function selectSubMood(subMood) {
    selectedSubMood.value = subMood
  }

  // Filter moods by time of day
  function getMoodsByTime(timeOfDay) {
    return moods.value.filter(m => m.timeOfDay.includes(timeOfDay))
  }

  return {
    moods,
    selectedMood,
    selectedSubMood,
    currentSubMoods,
    currentExamples,
    selectMood,
    selectSubMood,
    getMoodsByTime
  }
}