<script setup>
import { ref, watch, computed } from 'vue';
import Selections from './Selections.vue';
import FilterOptionsData from '@/data/filterOptions.json';

const emit = defineEmits(['recommend']);

const { timeAvailabilities, contentTypes } = FilterOptionsData.filterOptions;
const selectedTime    = ref('');
const selectedContent = ref('');
const selectedEra     = ref('Any era');

const eras = ['Any era', 'Before 1970', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

const moods       = FilterOptionsData.moods;
const selectedMood    = ref(null);
const selectedSubMood = ref(null);

const subMoods = computed(() => selectedMood.value?.submoods || []);

watch(selectedMood, () => { selectedSubMood.value = null })

const showValidation = ref(false)
const missing = computed(() => {
    const m = []
    if (!selectedMood.value)    m.push('mood')
    if (!selectedTime.value)    m.push('time')
    if (!selectedContent.value) m.push('content')
    return m
})

const recommend = () => {
    if (missing.value.length) {
        showValidation.value = true
        return
    }
    showValidation.value = false
    emit('recommend', {
        selectedMood:    selectedMood.value,
        selectedSubMood: selectedSubMood.value,
        selectedTime:    selectedTime.value,
        selectedContent: selectedContent.value,
        selectedEra:     selectedEra.value,
    })
}

const justPickForMe = () => {
    const randMood    = moods[Math.floor(Math.random() * moods.length)]
    const randSubMood = randMood.submoods[Math.floor(Math.random() * randMood.submoods.length)]
    const randTime    = timeAvailabilities[Math.floor(Math.random() * timeAvailabilities.length)]
    const randContent = contentTypes[Math.floor(Math.random() * contentTypes.length)]

    selectedMood.value    = randMood
    selectedSubMood.value = randSubMood
    selectedTime.value    = randTime
    selectedContent.value = randContent
    selectedEra.value     = 'Any era'
    showValidation.value  = false

    emit('recommend', {
        selectedMood:    randMood,
        selectedSubMood: randSubMood,
        selectedTime:    randTime,
        selectedContent: randContent,
        selectedEra:     'Any era',
    })
}
</script>

<template>
    <div class="flex flex-col gap-14">

        <Selections
            title="How I want to feel"
            :items="moods"
            v-model="selectedMood"
            :error="showValidation && missing.includes('mood')"
        />

        <Selections v-if="selectedMood"
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
            :error="showValidation && missing.includes('time')"
        />

        <Selections
            title="What type of content do I want?"
            :items="contentTypes"
            v-model="selectedContent"
            :error="showValidation && missing.includes('content')"
        />

        <Selections
            title="Era (optional)"
            :items="eras"
            v-model="selectedEra"
        />

        <!-- Validation nudge -->
        <p v-if="showValidation && missing.length" class="text-sm text-amber-400 -mt-8 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Please select your
            <span class="font-medium">{{ missing.join(', ') }}</span>
            to continue.
        </p>

        <div class="flex flex-wrap gap-4">
            <button class="btn-secondary-2" @click="recommend">
                <i class="fa-solid fa-lightbulb"></i>
                Recommend me something!
            </button>
            <button class="btn-secondary-1" @click="justPickForMe">
                <i class="fa-solid fa-dice"></i>
                Just pick for me!
            </button>
        </div>

    </div>
</template>
