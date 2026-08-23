import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'escargot.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo     TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pin_hash   TEXT NOT NULL,
  city       TEXT,
  token      TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE (owner_id, contact_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body              TEXT NOT NULL,
  from_city         TEXT NOT NULL,
  from_lat          REAL NOT NULL,
  from_lon          REAL NOT NULL,
  to_city           TEXT NOT NULL,
  to_lat            REAL NOT NULL,
  to_lon            REAL NOT NULL,
  distance_m        REAL NOT NULL,   -- distance reelle sur le terrain
  scale             REAL NOT NULL,   -- multiplicateur d'echelle (1 = realiste)
  crawl_distance_m  REAL NOT NULL,   -- distance effectivement rampee = distance_m * scale
  speed_mps         REAL NOT NULL,   -- vitesse escargot en m/s
  departed_at       INTEGER NOT NULL,
  eta_at            INTEGER NOT NULL,-- arrivee estimee, decalee a chaque hibernation
  paused_ms         INTEGER NOT NULL DEFAULT 0,
  paused_since      INTEGER,         -- non nul => l'escargot hiberne
  status            TEXT NOT NULL DEFAULT 'transit', -- transit | delivered | lost
  delivered_at      INTEGER,
  read_at           INTEGER,
  lost_at_progress  REAL,            -- progression a laquelle l'escargot part voir ailleurs
  lost_at           INTEGER,
  weather_temp      REAL,
  weather_place     TEXT,
  weather_checked_at INTEGER,
  weather_source    TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status);

-- Compteur communautaire : metres reellement rampes, cumules par le ticker.
CREATE TABLE IF NOT EXISTS stats (
  key   TEXT PRIMARY KEY,
  value REAL NOT NULL
);
INSERT OR IGNORE INTO stats (key, value) VALUES ('total_crawled_m', 0);
`);

export function getStat(key) {
  const row = db.prepare('SELECT value FROM stats WHERE key = ?').get(key);
  return row ? row.value : 0;
}

export function setStat(key, value) {
  db.prepare(
    'INSERT INTO stats (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}
