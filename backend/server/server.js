import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"
import axios from "axios"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

/*
|--------------------------------------------------------------------------
| AI → Generate Tags
|--------------------------------------------------------------------------
*/

async function generateTags(prompt) {

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
})

const response = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{
role: "user",
content: `
Convert this into TMDB search tags:

${prompt}

Return JSON:

{
"genres": [],
"keywords": [],
"tone": ""
}
`
}
]
})

return JSON.parse(response.choices[0].message.content)

}


/*
|--------------------------------------------------------------------------
| TMDB Search
|--------------------------------------------------------------------------
*/

async function searchTMDB(tags, contentType) {

const baseUrl = "https://api.themoviedb.org/3"

const type = contentType === "Movies" ? "movie" : "tv"

const response = await axios.get(
`${baseUrl}/discover/${type}`, {
params: {
api_key: process.env.TMDB_API_KEY,
with_keywords: tags.keywords?.join(","),
with_genres: tags.genres?.join(","),
sort_by: "popularity.desc"
}
})

return response.data.results.slice(0,5)

}


/*
|--------------------------------------------------------------------------
| JustWatch Availability
|--------------------------------------------------------------------------
*/

async function getAvailability(title) {

try {

const response = await axios.get(
"https://justwatch.com/us/search?q=" + encodeURIComponent(title)
)

return response.data

} catch {

return null

}

}


/*
|--------------------------------------------------------------------------
| Main Endpoint
|--------------------------------------------------------------------------
*/

app.post("/api/recommendations", async (req, res) => {

try {

const {
selectedMood,
selectedSubMood,
selectedTime,
selectedContent
} = req.body


const prompt = `
Mood: ${selectedMood?.mood}
Sub Mood: ${selectedSubMood?.submood}
Description: ${selectedSubMood?.description}
Time: ${selectedTime}
Content: ${selectedContent}
`


/*
|--------------------------------------------------------------------------
| Step 1: AI → Tags
|--------------------------------------------------------------------------
*/

const tags = await generateTags(prompt)


/*
|--------------------------------------------------------------------------
| Step 2: TMDB Search
|--------------------------------------------------------------------------
*/

const results = await searchTMDB(tags, selectedContent)


/*
|--------------------------------------------------------------------------
| Step 3: JustWatch Availability
|--------------------------------------------------------------------------
*/

const enriched = await Promise.all(

results.slice(0,3).map(async item => {

const availability = await getAvailability(item.title || item.name)

return {
title: item.title || item.name,
year: item.release_date?.split("-")[0],
poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
overview: item.overview,
availability
}

})

)


res.json(enriched)

} catch (error) {

console.error(error)

res.status(500).json({
error: "Recommendation failed"
})

}

})

app.listen(3001, () => {
console.log("Hybrid AI recommendation server running")
})