<script setup>
import { ref } from 'vue';
import Moods from './Moods.vue';


const selectedTime = ref(null);

const times =['< 30 mins', '~ 1 hour', '~ 2 hours', '> 3 hours']

function selectTime(time) {
    selectedTime.value = time;
}

</script>

<template>
    <div class="flex flex-col gap-14">
        
        <Moods />  

        <div class="time_available">
            <h2 class="uppercase text-[11px] tracking-2 mb-4 font-medium text-[#fbffff]">I have</h2>
        
            <div class="flex flex-wrap gap-4">
                <button 
                    class="btn-time-pill"
                    :class="{ 'pill_active': selectedTime === time }"
                    @click="selectTime(time)"
                    v-for="(time, index) in times" :key="index"
                    >
                    {{ time }}
                </button>
            </div>
        </div>

        <div class="w-[40%] flex gap-4">
            <button class="btn-secondary-2" v-if="selectedTime"><i class="fa-solid fa-lightbulb"></i> Recommend me something!  </button>
            <button class="btn-secondary-1"><i class="fa-solid fa-dice"></i> Just pick for me!  </button>
        </div>

    </div>
</template>