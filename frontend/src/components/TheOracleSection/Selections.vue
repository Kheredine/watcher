<script setup>
defineProps({
    title:       String,
    items:       Array,
    modelValue:  [String, Object, null],
    error:       { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])
</script>

<template>
    <div>
        <h2 :class="['uppercase text-[11px] tracking-2 mb-4 font-medium transition', error ? 'text-amber-400' : 'text-[#fbffff]']">
            {{ title }}
            <span v-if="error" class="ml-1 text-amber-400">·</span>
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
