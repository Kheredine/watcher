<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SideBar from './components/SideBar.vue'
import TopBar from './components/TopBar.vue'

const sidebarOpen = ref(false)
const route = useRoute()

const isPublicRoute = computed(() => route.meta?.public)
</script>

<template>
  <div class="flex min-h-screen">

    <!-- ── Authenticated layout ──────────────────────────────────────────── -->
    <template v-if="!isPublicRoute">
      <!-- Mobile overlay -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/70 md:hidden"
        @click="sidebarOpen = false"
      />

      <SideBar :open="sidebarOpen" @close="sidebarOpen = false" />

      <div class="flex-1 flex flex-col min-w-0 md:ml-64">
        <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

        <main class="flex-1 pt-20 px-4 md:px-8 pb-10">
          <div class="max-w-7xl mx-auto w-full">
            <!-- No mode="out-in": prevents insertBefore-null crash when components
                 navigate away programmatically mid-transition -->
            <RouterView v-slot="{ Component, route: r }">
              <Transition name="page">
                <component :is="Component" :key="r.path" />
              </Transition>
            </RouterView>
          </div>
        </main>
      </div>
    </template>

    <!-- ── Public layout ─────────────────────────────────────────────────── -->
    <template v-else>
      <div class="flex-1">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="page">
            <component :is="Component" :key="r.path" />
          </Transition>
        </RouterView>
      </div>
    </template>

  </div>
</template>
