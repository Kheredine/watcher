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
    <h2 class="uppercase text-[11px] tracking-2 mb-4 font-medium text-[#fbffff]">
      {{ title }}
    </h2>

    <div class="flex flex-wrap gap-4">
      <button 
        v-for="item in items"
        :key="item.id || item"
        class="btn-time-pill"
        :class="{ pill_active: item.id ? modelValue?.id === item?.id : modelValue === item }"
        @click="$emit('update:modelValue', item)"
      >
        {{ item.emoji }} {{ item.submood || item.mood || item }}
      </button>
    </div>
  </div>


</template>