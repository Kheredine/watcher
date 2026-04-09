<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import Selections from './Selections.vue'
import FilterOptionsData from '@/data/filterOptions.json'
import { useI18n } from '@/composables/useI18n'

const emit = defineEmits(['recommend'])
const props = defineProps({ isSubmitted: Boolean })

const { t } = useI18n()
const { timeAvailabilities, contentTypes, eras } = FilterOptionsData.filterOptions
const moods = FilterOptionsData.moods

// Defaults: "Any time" and "Any content" pre-selected
const selectedTime    = ref('Any time')
const selectedContent = ref('Any content')
const selectedEra     = ref('Any era')
const selectedMood    = ref(null)
const selectedSubMood = ref(null)

const subMoods = computed(() => selectedMood.value?.submoods || [])

// Scroll refs
const moodRef     = ref(null)
const subMoodRef  = ref(null)
const timeRef     = ref(null)
const contentRef  = ref(null)
const eraRef      = ref(null)
const buttonsRef  = ref(null)

const scrollTo = (el) => {
  if (!el) return
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
}

watch(selectedMood, (val) => {
  selectedSubMood.value = null
  if (val) nextTick(() => scrollTo(subMoodRef.value))
})
watch(selectedSubMood, (val) => {
  if (val) nextTick(() => scrollTo(timeRef.value))
})
watch(selectedTime, (val) => {
  if (val) nextTick(() => scrollTo(contentRef.value))
})
watch(selectedContent, (val) => {
  if (val) nextTick(() => scrollTo(eraRef.value))
})
watch(selectedEra, (val) => {
  if (val) nextTick(() => scrollTo(buttonsRef.value))
})

const handleRecommend = () => {
  emit('recommend', {
    selectedMood: selectedMood.value,
    selectedSubMood: selectedSubMood.value,
    selectedTime: selectedTime.value,
    selectedContent: selectedContent.value,
    selectedEra: selectedEra.value,
  })
}

const handleReset = () => {
  selectedMood.value    = null
  selectedSubMood.value = null
  selectedTime.value    = 'Any time'
  selectedContent.value = 'Any content'
  selectedEra.value     = 'Any era'
  emit('recommend', null)
}
</script>

<template>
  <div class="flex flex-col gap-12">

    <!-- Filter sections: hidden after submit -->
    <template v-if="!isSubmitted">

      <div ref="moodRef" class="scroll-section">
        <Selections
          :title="t.howIFeel"
          :items="moods"
          v-model="selectedMood"
        />
      </div>

      <div v-if="selectedMood" ref="subMoodRef" class="scroll-section">
        <Selections
          :title="t.subMood"
          :items="subMoods"
          v-model="selectedSubMood"
        />
        <p v-if="selectedSubMood" class="mt-5 text-base leading-relaxed max-w-2xl pl-4 border-l-2 border-purple-500/50" style="color: rgba(255,255,255,0.55)">
          {{ selectedSubMood.description }}
        </p>
      </div>

      <div ref="timeRef" class="scroll-section">
        <Selections
          :title="t.howMuchTime"
          :items="timeAvailabilities"
          v-model="selectedTime"
        />
      </div>

      <div ref="contentRef" class="scroll-section">
        <Selections
          :title="t.contentType"
          :items="contentTypes"
          v-model="selectedContent"
        />
      </div>

      <div ref="eraRef" class="scroll-section">
        <Selections
          :title="t.filterByEra"
          :items="eras"
          v-model="selectedEra"
        />
      </div>

      <div ref="buttonsRef" class="scroll-section flex flex-wrap gap-4">
        <button
          class="btn-secondary-2"
          :disabled="!selectedMood"
          @click="handleRecommend"
        >
          <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>{{ t.recommendBtn }}
        </button>
        <button class="btn-secondary-1" @click="handleRecommend">
          <i class="fa-solid fa-dice mr-2"></i>{{ t.pickBtn }}
        </button>
      </div>

    </template>

    <!-- After submit: only reset button -->
    <template v-else>
      <button class="btn-secondary-1 self-start" @click="handleReset">
        <i class="fa-solid fa-rotate-left mr-2"></i>{{ t.resetBtn }}
      </button>
    </template>

  </div>
</template>
