<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import SideBar from './components/SideBar.vue'
import TopBar from './components/TopBar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen">

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/70 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar: 256px fixed on desktop, slide-in on mobile -->
    <SideBar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Main area: offset by sidebar width on desktop only -->
    <div class="flex-1 flex flex-col min-w-0 md:ml-64">

      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Page content: top padding clears the fixed header (h-[60px] → pt-20) -->
      <main class="flex-1 pt-20 px-4 md:px-8 pb-10">
        <div class="max-w-7xl mx-auto w-full">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>

    </div>

  </div>
</template>
