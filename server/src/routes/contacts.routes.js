import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';

export const contactRoutes = Router();

contactRoutes.use(requireUser);

contactRoutes.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, u.pseudo, u.city
       FROM contacts c JOIN users u ON u.id = c.contact_id
       WHERE c.owner_id = ? ORDER BY u.pseudo COLLATE NOCASE`
    )
    .all(req.user.id);
  res.json(rows);
});

contactRoutes.post('/', (req, res) => {
  const pseudo = String(req.body?.pseudo ?? '').trim();
  const target = db.prepare('SELECT id, pseudo, city FROM users WHERE pseudo = ?').get(pseudo);
  if (!target) return res.status(404).json({ error: 'Personne de ce nom dans le jardin.' });
  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'Vous êtes déjà en très bons termes avec vous-même.' });
  }
  const exists = db
    .prepare('SELECT 1 FROM contacts WHERE owner_id = ? AND contact_id = ?')
    .get(req.user.id, target.id);
  if (exists) return res.status(409).json({ error: 'Ce contact est déjà dans votre carnet.' });

  const info = db
    .prepare('INSERT INTO contacts (owner_id, contact_id, created_at) VALUES (?, ?, ?)')
    .run(req.user.id, target.id, Date.now());
  res.status(201).json({ id: info.lastInsertRowid, pseudo: target.pseudo, city: target.city });
});

contactRoutes.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM contacts WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'Contact introuvable.' });
  res.json({ ok: true });
});
