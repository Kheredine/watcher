<script setup>
    const rankings = [
        {position: '1st', color: 'bg-[#C8A96E]/40 border border-[#C8A96E]/40'},
        {position: '2nd', color: 'bg-[#4ECDC4]/40 border border-[#4ECDC4]/40'},
        {position: '3rd', color: 'bg-[#E8A598]/40 border border-[#E8A598]/30'},
    ];


    const props = defineProps({
        selectedMood: Object,
        selectedSubMood: Object,
        selectedTime: String,
        selectedContent: String
    })

    const recommendations = ref([])
    const loading = ref(false)

    const getRecommendations = async () => {

        loading.value = true

        const response = await fetch(
            "http://localhost:3001/api/recommendations",
            {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    selectedMood: props.selectedMood,
                    selectedSubMood: props.selectedSubMood,
                    selectedTime: props.selectedTime,
                    selectedContent: props.selectedContent
                })
            }
        )

        recommendations.value = await response.json()

        loading.value = false

    }

</script>

<template>
    <div class="flex flex-col gap-10 text-[#fbffff] mb-12" v-if="recommendations.length">
        <h2 class="uppercase text-sm tracking-2 font-medium">Recommendations</h2>
        
        <div class="recommendations flex flex-wrap gap-8">

            <div v-for="(ranking, index) in rankings" :key="index" class="rec-card relative bg-purple-500/10 w-full md:w-[48%] lg:w-[20%] rounded-lg overflow-hidden cursor-pointer border border-purple-500/20 hover:border-purple-500 transition duration-300">

                <div v-for="item in recommendations" :key="item.title">

                    <img :src="item.poster"  alt="Movie Poster" class="rec-poster h-60 w-96">
                    
                    <span :class="`badge rounded-md px-3 ${ranking.color} absolute top-2 right-2`">{{ ranking.position }}</span>

                    <div class="rec-info py-6 pl-2">
                        <h3 class="rec-title">{{ item.title }}</h3>
                        <div class="flex gap-2 items-center">
                            <span class="rec-year">{{ item.year }}</span> 
                            <span class="dot w-1.5 h-1.5 px-0.5 rounded-full inline-block bg-[#fbffff]"></span>
                            <span class="rec-rating"><i class="fa-solid fa-star text-yellow-400"></i> {{ item.rating }}</span>
                        </div>
                    </div>

                </div>

            </div>

                

        </div>

    </div>
</template>