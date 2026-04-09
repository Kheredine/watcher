<script setup>
import SideBar from './components/SideBar.vue'
import TopBar from './components/TopBar.vue'
import MainContent from './components/MainContent.vue'
import TheOracleView from './views/TheOracleView.vue';
</script>

<template>

  <div class="flex h-full">
    
    <SideBar />

    <div class="right-content flex-1 flex flex-col gap-6 ml-64">

      <TopBar />

      <div class="main-content flex flex-col gap-6 rounded-lg p-12 mr-6 bg-[#7C3AED]/20 backdrop-blur-md shadow-inner mt-30">
        <TheOracleView />
        <!-- <MainContent /> -->
      </div>

      

    </div>

  </div>
</template>

<style scoped></style>
