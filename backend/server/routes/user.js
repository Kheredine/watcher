import { Router } from 'express'
import OpenAI from 'openai'
import db from '../db.js'
import { verifyToken, requirePremium } from '../middleware/auth.js'

const router = Router()

// Lazy OpenAI init
let _openai = null
const openai = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

// ── GET /api/user/library ───────────────────────────────────────────────────
router.get('/library', verifyToken, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM user_library WHERE user_id = ? ORDER BY added_at DESC'
    ).all(req.user.id)

    // Group by list_type
    const library = { liked: [], watchlist: [], watched: [], history: [] }
    for (const row of rows) {
      const item = {
        id:     row.tmdb_id,
        type:   row.media_type,
        title:  row.title,
        poster: row.poster_path,
        year:   row.year,
      }
      if (library[row.list_type]) library[row.list_type].push(item)
    }

    res.json({ library })
  } catch (err) {
    console.error('Get library error:', err.message)
    res.status(500).json({ error: 'Failed to fetch library' })
  }
})

// ── POST /api/user/library/sync ─────────────────────────────────────────────
// Full sync: replaces all library data for this user
router.post('/library/sync', verifyToken, (req, res) => {
  try {
    const { liked = [], watchlist = [], watched = [], history = [] } = req.body
    const userId = req.user.id

    const syncTransaction = db.transaction(() => {
      // Clear existing
      db.prepare('DELETE FROM user_library WHERE user_id = ?').run(userId)

      const insert = db.prepare(`
        INSERT OR IGNORE INTO user_library (user_id, tmdb_id, media_type, title, poster_path, year, list_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      let count = 0
      const lists = { liked, watchlist, watched, history }
      for (const [listType, items] of Object.entries(lists)) {
        for (const item of items) {
          insert.run(
            userId,
            String(item.id),
            item.type || 'movie',
            item.title || '',
            item.poster || null,
            item.year || null,
            listType
          )
          count++
        }
      }
      return count
    })

    const count = syncTransaction()
    res.json({ ok: true, count })
  } catch (err) {
    console.error('Sync library error:', err.message)
    res.status(500).json({ error: 'Failed to sync library' })
  }
})

// ── GET /api/user/preferences ───────────────────────────────────────────────
router.get('/preferences', verifyToken, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id)
    if (!row) {
      return res.json({ preferences: { likedMoods: {}, dislikedItems: [], sessionMoods: [] } })
    }

    res.json({
      preferences: {
        likedMoods:    JSON.parse(row.liked_moods   || '{}'),
        dislikedItems: JSON.parse(row.disliked_items || '[]'),
        sessionMoods:  JSON.parse(row.session_moods  || '[]'),
      }
    })
  } catch (err) {
    console.error('Get preferences error:', err.message)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

// ── POST /api/user/preferences/sync ────────────────────────────────────────
router.post('/preferences/sync', verifyToken, (req, res) => {
  try {
    const { likedMoods = {}, dislikedItems = [], sessionMoods = [] } = req.body
    const userId = req.user.id

    db.prepare(`
      INSERT INTO user_preferences (user_id, liked_moods, disliked_items, session_moods, updated_at)
      VALUES (?, ?, ?, ?, unixepoch())
      ON CONFLICT(user_id) DO UPDATE SET
        liked_moods    = excluded.liked_moods,
        disliked_items = excluded.disliked_items,
        session_moods  = excluded.session_moods,
        updated_at     = excluded.updated_at
    `).run(
      userId,
      JSON.stringify(likedMoods),
      JSON.stringify(dislikedItems),
      JSON.stringify(sessionMoods)
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('Sync preferences error:', err.message)
    res.status(500).json({ error: 'Failed to sync preferences' })
  }
})

// ── POST /api/user/generate-title ──────────────────────────────────────────
// Premium only — generates a funny, insightful watcher personality title
router.post('/generate-title', verifyToken, requirePremium, async (req, res) => {
  try {
    const {
      topMoods      = [],
      likedTitles   = [],
      watchedCount  = 0,
      watchlistCount = 0,
      dislikedCount = 0,
      sessionMoods  = [],
      language      = 'en',
    } = req.body

    // Determine dominant viewing time
    const hourCounts = {}
    sessionMoods.forEach(s => { hourCounts[s.hour] = (hourCounts[s.hour] || 0) + 1 })
    const dominantHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const timeLabel = dominantHour === undefined ? 'no particular time' :
      Number(dominantHour) < 6  ? 'late at night' :
      Number(dominantHour) < 12 ? 'in the morning' :
      Number(dominantHour) < 18 ? 'in the afternoon' : 'in the evening'

    const isFr = language === 'fr'

    const prompt = `You are a witty pop-culture analyst. Based on a user's entertainment preferences, create a fun, insightful "watcher personality" profile.

User data:
- Top mood categories: ${topMoods.join(', ') || 'unknown'}
- Liked titles: ${likedTitles.slice(0, 8).join(', ') || 'none yet'}
- Titles watched: ${watchedCount}
- Titles on watchlist: ${watchlistCount}
- Titles disliked: ${dislikedCount}
- Favorite viewing time: ${timeLabel}

Create a personality profile. Be funny, specific, and insightful. Reference real traits that can be inferred from the data.
${isFr ? 'Write everything in French.' : 'Write in English.'}

Return ONLY valid JSON (no markdown):
{
  "title": "A specific, funny, flattering title (e.g. 'The Midnight Thriller Philosopher')",
  "subtitle": "A one-liner that nails their vibe (e.g. 'Falls asleep to horror films, cries during ads')",
  "emoji": "One perfect emoji for this personality",
  "traits": ["trait 1", "trait 2", "trait 3", "trait 4"],
  "funFacts": ["funny observation 1", "funny observation 2", "funny observation 3"],
  "cinemaType": "The kind of filmgoer they'd be in real life (1 sentence)"
}`

    const response = await openai().chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a witty pop-culture analyst. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.88,
    })

    const result = JSON.parse(response.choices[0].message.content)
    res.json(result)
  } catch (err) {
    console.error('Generate title error:', err.message)
    res.status(500).json({ error: 'Could not generate title' })
  }
})

export default router
