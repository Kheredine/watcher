<script setup>
import { useTimeOfDay } from '@/composables/useTimeOfDay'
import { useI18n } from '@/composables/useI18n'

const { day, timeOfDay } = useTimeOfDay()
const { t } = useI18n()
</script>

<template>
  <div class="opacity-0 animate-fadeUp">
    <div class="uppercase text-[11px] tracking-2 font-medium text-white/40 mb-3">{{ day }} · {{ timeOfDay }}</div>

    <h1 class="text-3xl md:text-5xl font-heroTitle uppercase text-white leading-tight mb-4">
      {{ t.oracleTitle }}
    </h1>
    <p class="text-[#949da3] text-sm md:text-base max-w-lg">{{ t.oracleSubtitle }}</p>
  </div>
</template>
