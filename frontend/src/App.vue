<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
import TopBar from './components/TopBar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-full">

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <SideBar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 flex flex-col gap-6 lg:ml-64 min-w-0">

      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <div class="main-content flex flex-col gap-6 rounded-lg p-6 md:p-12 mx-4 md:mr-6 bg-[#7C3AED]/20 backdrop-blur-md shadow-inner mt-24 lg:mt-30 mb-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>

    </div>

  </div>
</template>
