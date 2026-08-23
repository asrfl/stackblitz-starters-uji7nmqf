import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { findCity, haversine } from '../cities.js';
import { findScale, travelDurationMs, rollLostProgress, SNAIL_SPEED_MPS } from '../snail.js';
import { serialize, getMessageRow, listMessageRows, tick } from '../messages.js';

export const messageRoutes = Router();

export const MAX_BODY = 500;
/** Meme ville : l'escargot fait quand meme le tour du paté de maisons. */
const MIN_DISTANCE_M = 250;

messageRoutes.use(requireUser);

messageRoutes.post('/', (req, res) => {
  const body = String(req.body?.body ?? '').trim();
  if (!body) return res.status(400).json({ error: 'Un message vide ne mérite pas un escargot.' });
  if (body.length > MAX_BODY) {
    return res.status(400).json({ error: `${MAX_BODY} caractères maximum, l’escargot ne porte pas plus.` });
  }

  const recipient = db
    .prepare('SELECT id, pseudo, city FROM users WHERE pseudo = ?')
    .get(String(req.body?.to ?? '').trim());
  if (!recipient) return res.status(404).json({ error: 'Ce destinataire n’a pas de boîte aux lettres.' });

  const from = findCity(req.body?.fromCity || req.user.city);
  const to = findCity(req.body?.toCity || recipient.city);
  if (!from) return res.status(400).json({ error: 'Indiquez d’où part l’escargot.' });
  if (!to) return res.status(400).json({ error: 'Indiquez où vit le destinataire.' });

  const { scale } = findScale(req.body?.scale);
  const distanceM = Math.max(MIN_DISTANCE_M, haversine(from, to));
  const crawlDistanceM = distanceM * scale;
  const departedAt = Date.now();
  const etaAt = Math.round(departedAt + travelDurationMs(crawlDistanceM));

  const info = db
    .prepare(
      `INSERT INTO messages (
        sender_id, recipient_id, body,
        from_city, from_lat, from_lon, to_city, to_lat, to_lon,
        distance_m, scale, crawl_distance_m, speed_mps,
        departed_at, eta_at, lost_at_progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      recipient.id,
      body,
      from.name,
      from.lat,
      from.lon,
      to.name,
      to.lat,
      to.lon,
      distanceM,
      scale,
      crawlDistanceM,
      SNAIL_SPEED_MPS,
      departedAt,
      etaAt,
      rollLostProgress()
    );

  res.status(201).json(serialize(getMessageRow(info.lastInsertRowid), req.user.id));
});

/** Boite aux lettres : tout ce qui arrive et tout ce qui part. */
messageRoutes.get('/', async (req, res) => {
  await tick();
  const now = Date.now();
  const rows = listMessageRows(
    'WHERE m.recipient_id = ? OR m.sender_id = ? ORDER BY m.departed_at DESC',
    req.user.id,
    req.user.id
  );
  const messages = rows.map((row) => serialize(row, req.user.id, now));
  res.json({
    now,
    recus: messages.filter((m) => m.direction === 'recu'),
    envoyes: messages.filter((m) => m.direction === 'envoye'),
  });
});

messageRoutes.get('/:id', (req, res) => {
  const row = getMessageRow(req.params.id);
  if (!row || (row.recipient_id !== req.user.id && row.sender_id !== req.user.id)) {
    return res.status(404).json({ error: 'Message introuvable.' });
  }
  res.json(serialize(row, req.user.id));
});

/** Deplier la lettre : n a de sens qu une fois l escargot arrive. */
messageRoutes.post('/:id/read', (req, res) => {
  const row = getMessageRow(req.params.id);
  if (!row || row.recipient_id !== req.user.id) {
    return res.status(404).json({ error: 'Message introuvable.' });
  }
  if (row.status !== 'delivered') {
    return res.status(409).json({ error: 'L’escargot n’est pas encore arrivé.' });
  }
  if (!row.read_at) {
    db.prepare('UPDATE messages SET read_at = ? WHERE id = ?').run(Date.now(), row.id);
  }
  res.json(serialize(getMessageRow(row.id), req.user.id));
});
