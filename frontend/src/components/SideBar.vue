<script setup></script>

<template>
    <aside class="sideBar w-64 p-10 pr-0 flex flex-col gap-14 fixed left-0 top-0 h-screen">

        <h2 class="flex text-2xl font-bold text-[#fbffff]">
            <img src="../assets/images/dika.png" alt="JustWatch Logo" class="logo w-8 h-8 mr-2">
            <span class="font-logo"> JustWatch</span>
        </h2>


        <ul class="flex flex-col gap-7 flex-1 text-lg font-body">
            <li class="hover:text-[#fbffff] text-[#fbffff] cursor-pointer"><i class="fa-solid fa-house"></i> The Oracle</li>
            <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-compass"></i> Discover</li>
            <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-film"></i> Social</li>
            <!-- <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-star"></i> My Ratings</li> -->
            <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-clock"></i> Watchlist</li>

            <!-- <li class="middle hover:text-[#fbffff] text-[#949da3] mt-8 cursor-pointer"><i class="fa-solid fa-clock-rotate-left"></i> Recently Watched </li> -->

            <div class="bottom flex flex-col gap-7 mt-auto pt-4 relative">
                <div class="w-16 h-0.5 rounded-full bg-linear-to-r from-purple-500/60 to-transparent"></div>
                
                <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-gear"></i> Settings</li>
                <li class="hover:text-[#fbffff] text-[#949da3] cursor-pointer"><i class="fa-solid fa-question-circle"></i> Help</li>
            </div>
        </ul>

    </aside>
</template>

<style>
/* primary: "#7C3AED",
primarySoft: "#A78BFA",
bg: "#0B0B0F",
surface: "#12121A",
surfaceLight: "#1A1A24", */


</style>