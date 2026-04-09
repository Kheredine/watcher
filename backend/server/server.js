import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

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
response_format: { type: "json_object" },
messages: [
{
role: "user",
content: `
Convert this mood/preference profile into TMDB-compatible search tags.

${prompt}

Return only valid JSON:

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
| Tags Endpoint  (TMDB search now happens client-side in the browser)
|--------------------------------------------------------------------------
*/

app.post("/api/tags", async (req, res) => {

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
Time Available: ${selectedTime}
Content Type: ${selectedContent}
`

const tags = await generateTags(prompt)

res.json(tags)

} catch (error) {

console.error(error)
res.status(500).json({ error: "Tag generation failed", detail: error.message })

}

})


app.listen(3001, () => {
console.log("Tazama AI tag server running on port 3001")
})
