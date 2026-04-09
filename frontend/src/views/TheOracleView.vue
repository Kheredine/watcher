<script setup>
import HeroSection from '@/components/TheOracleSection/HeroSection.vue';
import RecommendationSection from '@/components/TheOracleSection/RecommendationSection.vue';
import SelectorSection from '@/components/TheOracleSection/SelectorSection.vue';

</script>

<template>
    <div class="flex flex-col gap-10">

        <HeroSection />

        <div class="w-full h-0.5 rounded-full bg-transparent backdrop-blur-md"></div>

        <SelectorSection />

        <div class="w-full h-0.5 rounded-full bg-transparent backdrop-blur-md"></div>

        <RecommendationSection />

    </div>
</template>