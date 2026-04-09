<script setup>
import { ref, nextTick } from 'vue'
import HeroSection from '@/components/TheOracleSection/HeroSection.vue'
import SelectorSection from '@/components/TheOracleSection/SelectorSection.vue'
import RecommendationSection from '@/components/TheOracleSection/RecommendationSection.vue'
import { useOracleState } from '@/composables/useOracleState'
import { useUserPreferences } from '@/composables/useUserPreferences'

const { selections, isSubmitted, setSelections, reset } = useOracleState()
const { recordSessionMood } = useUserPreferences()

const recommendationsRef = ref(null)

const handleRecommend = (data) => {
  if (!data) {
    reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  setSelections(data)
  if (data.selectedMood) recordSessionMood(data.selectedMood.id)
  nextTick(() => {
    setTimeout(() => {
      recommendationsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  })
}
</script>

<template>
  <div class="flex flex-col gap-10">

    <HeroSection />

    <div class="w-full h-px bg-white/5 rounded-full"></div>

    <SelectorSection :isSubmitted="isSubmitted" @recommend="handleRecommend" />

    <div v-if="isSubmitted" ref="recommendationsRef" class="scroll-section">
      <RecommendationSection />
    </div>

  </div>
</template>
