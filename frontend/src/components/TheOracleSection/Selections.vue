<script setup>
defineProps({
  title: String,
  items: Array,
  modelValue: [String, Object, null]
})

defineEmits(["update:modelValue"])
</script>

<template>
  <div>
    <h2 class="uppercase text-[11px] tracking-[0.18em] mb-5 font-semibold" style="color: rgba(255,255,255,0.45)">
      {{ title }}
    </h2>

    <div class="flex flex-wrap gap-3">
      <button
        v-for="item in items"
        :key="item.id || item"
        class="btn-time-pill"
        :class="{ pill_active: item.id ? modelValue?.id === item?.id : modelValue === item }"
        @click="$emit('update:modelValue', item)"
      >
        <span v-if="item.emoji" class="mr-1.5">{{ item.emoji }}</span>
        {{ item.submood || item.mood || item }}
      </button>
    </div>
  </div>
</template>
