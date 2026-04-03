<script setup>
    const rankings = [
        {position: '1st', color: 'bg-[#C8A96E]/40 border border-[#C8A96E]/40'},
        {position: '2nd', color: 'bg-[#4ECDC4]/40 border border-[#4ECDC4]/40'},
        {position: '3rd', color: 'bg-[#E8A598]/40 border border-[#E8A598]/30'},
    ];

</script>

<template>
    <div class="flex flex-col gap-10 text-[#fbffff] mb-12">
        <h2 class="uppercase text-sm tracking-2 font-medium">Recommendations</h2>

        <p class="text-base text-[#949da3] leading-relaxed max-w-xl border-l-2 border-purple-500/40 pl-4">
            These recommendations match your current mood and time availability, curated to give you the most satisfying watch right now.
        </p>
        
        <div class="recommendations flex flex-wrap gap-8">

            <div v-for="(ranking, index) in rankings" :key="index" class="rec-card relative bg-purple-500/10 w-full md:w-[48%] lg:w-[20%] rounded-lg overflow-hidden cursor-pointer border border-purple-500/20 hover:border-purple-500 transition duration-300">
                <img src="@/assets/images/caroussel-1.jpg"  alt="Movie Poster" class="rec-poster h-60 w-96">
                
                <span :class="`badge rounded-md px-3 ${ranking.color} absolute top-2 right-2`">{{ ranking.position }}</span>

                <div class="rec-info py-6 pl-2">
                    <h3 class="rec-title">The Shawshank Redemption</h3>
                    <div class="flex gap-2 items-center">
                        <span class="rec-year">1994</span> 
                        <span class="dot w-1.5 h-1.5 px-0.5 rounded-full inline-block bg-[#fbffff]"></span>
                        <span class="rec-rating"><i class="fa-solid fa-star text-yellow-400"></i> 9.3</span>
                    </div>
                </div>
            </div>

        </div>

    </div>
</template>