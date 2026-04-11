import { Router } from 'express'
import db from '../db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// ── GET /api/social/search?q=... ────────────────────────────────────────────
router.get('/search', verifyToken, (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json({ users: [] })

    // LOWER() on both sides = case-insensitive match
    // is_discoverable checked via != 0 so NULL rows (legacy) are also matched
    const users = db.prepare(`
      SELECT id, username, plan, avatar, bio, is_discoverable
      FROM users
      WHERE LOWER(username) LIKE LOWER(?) AND COALESCE(is_discoverable, 1) != 0 AND id != ?
      LIMIT 10
    `).all(`%${q}%`, req.user.id)

    res.json({ users: users.map(u => ({
      id:       u.id,
      username: u.username,
      plan:     u.plan,
      avatar:   u.avatar || '🎬',
      bio:      u.bio    || '',
    })) })
  } catch (err) {
    console.error('Search users error:', err.message)
    res.status(500).json({ error: 'Search failed' })
  }
})

// ── POST /api/social/connect/:userId ───────────────────────────────────────
// Toggle follow/unfollow. Creates a notification on follow.
router.post('/connect/:userId', verifyToken, (req, res) => {
  try {
    const followerId  = req.user.id
    const followingId = Number(req.params.userId)

    if (followerId === followingId) {
      return res.status(400).json({ error: "You can't follow yourself" })
    }

    const target = db.prepare('SELECT id, username, is_discoverable FROM users WHERE id = ?').get(followingId)
    if (!target || !target.is_discoverable) {
      return res.status(404).json({ error: 'User not found' })
    }

    const existing = db.prepare(
      'SELECT id FROM social_connections WHERE follower_id = ? AND following_id = ?'
    ).get(followerId, followingId)

    if (existing) {
      // Unfollow
      db.prepare('DELETE FROM social_connections WHERE follower_id = ? AND following_id = ?').run(followerId, followingId)
      res.json({ ok: true, following: false })
    } else {
      // Follow + create notification
      db.prepare(
        'INSERT OR IGNORE INTO social_connections (follower_id, following_id) VALUES (?, ?)'
      ).run(followerId, followingId)

      const follower = db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(followerId)
      db.prepare(`
        INSERT INTO notifications (user_id, from_user_id, type, content)
        VALUES (?, ?, 'connect', ?)
      `).run(
        followingId,
        followerId,
        `${follower.username} joined your credits — you have a new Reel Mate! 🎬`
      )

      res.json({ ok: true, following: true })
    }
  } catch (err) {
    console.error('Connect error:', err.message)
    res.status(500).json({ error: 'Failed to update connection' })
  }
})

// ── GET /api/social/status/:userId ─────────────────────────────────────────
router.get('/status/:userId', verifyToken, (req, res) => {
  try {
    const isFollowing = !!db.prepare(
      'SELECT 1 FROM social_connections WHERE follower_id = ? AND following_id = ?'
    ).get(req.user.id, Number(req.params.userId))

    const followerCount  = db.prepare('SELECT COUNT(*) as c FROM social_connections WHERE following_id = ?').get(Number(req.params.userId)).c
    const followingCount = db.prepare('SELECT COUNT(*) as c FROM social_connections WHERE follower_id = ?').get(Number(req.params.userId)).c

    res.json({ isFollowing, followerCount, followingCount })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' })
  }
})

// ── GET /api/social/connections ─────────────────────────────────────────────
router.get('/connections', verifyToken, (req, res) => {
  try {
    const userId = req.user.id

    const followers = db.prepare(`
      SELECT u.id, u.username, u.plan, u.avatar, u.bio
      FROM social_connections sc
      JOIN users u ON u.id = sc.follower_id
      WHERE sc.following_id = ?
      ORDER BY sc.created_at DESC
    `).all(userId)

    const following = db.prepare(`
      SELECT u.id, u.username, u.plan, u.avatar, u.bio
      FROM social_connections sc
      JOIN users u ON u.id = sc.following_id
      WHERE sc.follower_id = ?
      ORDER BY sc.created_at DESC
    `).all(userId)

    res.json({ followers, following })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch connections' })
  }
})

// ── GET /api/social/notifications ──────────────────────────────────────────
router.get('/notifications', verifyToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, u.username as from_username, u.avatar as from_avatar
      FROM notifications n
      LEFT JOIN users u ON u.id = n.from_user_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(req.user.id)

    res.json({ notifications })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// ── PUT /api/social/notifications/read ─────────────────────────────────────
router.put('/notifications/read', verifyToken, (req, res) => {
  try {
    const { ids } = req.body // optional array of IDs; if empty, mark all
    if (ids && ids.length) {
      const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      for (const id of ids) stmt.run(id, req.user.id)
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id)
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
})

// ── GET /api/social/unread-count ───────────────────────────────────────────
router.get('/unread-count', verifyToken, (req, res) => {
  try {
    const row = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id)
    res.json({ count: row.c })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

export default router
