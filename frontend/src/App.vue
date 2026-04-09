<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
import TopBar from './components/TopBar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-full min-h-screen">

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/60 md:hidden"
      @click="sidebarOpen = false"
    />

    <SideBar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="right-content flex-1 flex flex-col md:ml-64">

      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <div class="main-content flex flex-col gap-6 rounded-lg p-6 md:p-12 mr-0 md:mr-6 bg-[#7C3AED]/10 backdrop-blur-md shadow-inner mt-24">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>

    </div>

  </div>
</template>

<style scoped></style>
