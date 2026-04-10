import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(join(dataDir, 'tazama.db'))

// Performance settings
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Users ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    UNIQUE NOT NULL,
    username     TEXT    NOT NULL,
    password_hash TEXT   NOT NULL,
    plan         TEXT    NOT NULL DEFAULT 'standard',
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

// ── User Library ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS user_library (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    tmdb_id     TEXT    NOT NULL,
    media_type  TEXT    NOT NULL,
    title       TEXT,
    poster_path TEXT,
    year        TEXT,
    list_type   TEXT    NOT NULL,
    added_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, tmdb_id, media_type, list_type)
  )
`)

// ── User Preferences ───────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id       INTEGER PRIMARY KEY,
    liked_moods   TEXT NOT NULL DEFAULT '{}',
    disliked_items TEXT NOT NULL DEFAULT '[]',
    session_moods TEXT NOT NULL DEFAULT '[]',
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

// ── Oracle Chat Messages ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS oracle_chat_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

console.log('✅ Database initialized at', join(dataDir, 'tazama.db'))

export default db
