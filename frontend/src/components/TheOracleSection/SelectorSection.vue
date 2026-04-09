<script setup>
import { ref, watch, computed } from 'vue';
import Selections from './Selections.vue';
import FilterOptionsData from '@/data/filterOptions.json';

const { timeAvailabilities, contentTypes } = FilterOptionsData.filterOptions;
const selectedTime = ref('');
const selectedContent = ref('');

const moods = FilterOptionsData.moods;
const selectedMood = ref(null);
const selectedSubMood = ref(null);

const subMoods = computed(() => {
    return selectedMood.value?.submoods || [];
});

watch(selectedMood, () => {
    selectedSubMood.value = null; // Reset sub-mood when main mood changes
})

</script>

<template>
    <div class="flex flex-col gap-14">
        
        <Selections 
            title="How I want to feel"
            :items="moods"
            v-model="selectedMood"
        />
        
        <Selections v-if ="selectedMood"
            title="Sub Mood"
            :items="subMoods"
            v-model="selectedSubMood"
        />

        <p v-if="selectedSubMood" class="text-base text-[#949da3] leading-relaxed max-w-xl border-l-2 border-purple-500/40 pl-4">
            {{ selectedSubMood.description }}
        </p>


        <Selections 
            title="How much time do I have?"
            :items="timeAvailabilities"
            v-model="selectedTime"
        />

        <Selections 
            title="What type of content do I want?"
            :items="contentTypes"
            v-model="selectedContent"
        />


        <div class="w-[40%] flex gap-4">
            <button class="btn-secondary-2" v-if="selectedTime"><i class="fa-solid fa-lightbulb"></i> Recommend me something!  </button>
            <button class="btn-secondary-1"><i class="fa-solid fa-dice"></i> Just pick for me!  </button>
        </div>

    </div>
</template>