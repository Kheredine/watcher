<script setup>
import { ref } from 'vue';
import HeroSection           from '@/components/TheOracleSection/HeroSection.vue';
import RecommendationSection from '@/components/TheOracleSection/RecommendationSection.vue';
import SelectorSection       from '@/components/TheOracleSection/SelectorSection.vue';

const selections = ref(null)

const handleRecommend = (data) => {
    // Reset then re-set so RecommendationSection remounts fresh each time
    selections.value = null
    requestAnimationFrame(() => { selections.value = data })
}
</script>

<template>
    <div class="flex flex-col gap-10">

        <HeroSection />

        <div class="w-full h-px bg-purple-500/20 rounded-full"></div>

        <SelectorSection @recommend="handleRecommend" />

        <template v-if="selections">
            <div class="w-full h-px bg-purple-500/20 rounded-full"></div>
            <RecommendationSection
                :selectedMood="selections.selectedMood"
                :selectedSubMood="selections.selectedSubMood"
                :selectedTime="selections.selectedTime"
                :selectedContent="selections.selectedContent"
                :selectedEra="selections.selectedEra"
            />
        </template>

    </div>
</template>
