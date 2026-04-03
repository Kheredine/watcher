<script setup>
import { useTimeOfDay } from '@/composables/useTimeOfDay';
const { day, timeOfDay } = useTimeOfDay();

</script>


<template>
    <div>
        <div class="uppercase text-[11px] tracking-2 font-medium text-[#fbffff]">{{ day }} {{ timeOfDay }}</div>
        
        <h1 class="text-4xl my-4 font-heroTitle uppercase text-[#fbffff]">
            How do you want to feel right now?
        
        </h1>
        <p class="text-[#949da3]">Pick a mood and we'll find exactly the right thing to watch</p>
    </div>
</template>


<style></style>