import { Router } from 'express'
import OpenAI from 'openai'
import db from '../db.js'
import { verifyToken, requirePremium } from '../middleware/auth.js'

const router = Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ORACLE_SYSTEM = `You are the Oracle — a witty, deeply knowledgeable entertainment expert, film critic, and curator with an air of mystique. You speak with confidence, warmth, and personality.

Your expertise spans cinema, television, anime, documentaries, and streaming culture across all eras and countries. You give specific, insightful recommendations and engage in passionate discussion about storytelling, themes, directors, and emotional impact.

Guidelines:
- Speak in first person as the Oracle — a personality, not a generic assistant
- Be opinionated and specific — name directors, actors, themes, emotional tones
- When recommending, always give a reason that connects to what the user seems to want
- Keep responses focused (under 250 words unless asked to elaborate)
- If the user is vague, ask a clarifying question to give a better recommendation
- You may be slightly dramatic and poetic — it's part of the Oracle persona`

// ── POST /api/chat/oracle ────────────────────────────────────────────────────
router.post('/oracle', verifyToken, requirePremium, async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const userId = req.user.id

    // Save user message
    db.prepare(
      'INSERT INTO oracle_chat_messages (user_id, role, content) VALUES (?, ?, ?)'
    ).run(userId, 'user', message.trim())

    // Fetch last 40 messages for context (chronological)
    const history = db.prepare(
      'SELECT role, content FROM oracle_chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 40'
    ).all(userId).reverse()

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: ORACLE_SYSTEM },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.85,
      max_tokens: 400,
    })

    const reply = response.choices[0].message.content

    // Save oracle reply
    db.prepare(
      'INSERT INTO oracle_chat_messages (user_id, role, content) VALUES (?, ?, ?)'
    ).run(userId, 'assistant', reply)

    res.json({ reply })
  } catch (err) {
    console.error('Oracle chat error:', err.message)
    res.status(500).json({ error: 'Oracle is temporarily unavailable' })
  }
})

// ── GET /api/chat/oracle/history ─────────────────────────────────────────────
router.get('/oracle/history', verifyToken, requirePremium, (req, res) => {
  try {
    const messages = db.prepare(
      'SELECT role, content, created_at FROM oracle_chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 60'
    ).all(req.user.id)

    res.json({ messages })
  } catch (err) {
    console.error('Chat history error:', err.message)
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

// ── DELETE /api/chat/oracle/history ──────────────────────────────────────────
router.delete('/oracle/history', verifyToken, requirePremium, (req, res) => {
  try {
    db.prepare('DELETE FROM oracle_chat_messages WHERE user_id = ?').run(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('Clear history error:', err.message)
    res.status(500).json({ error: 'Failed to clear history' })
  }
})

export default router
