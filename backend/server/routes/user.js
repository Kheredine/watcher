import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

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

export default router
