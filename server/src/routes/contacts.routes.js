import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { echec } from '../i18n.js';

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
  if (!target) return echec(res, 404, req, 'contact.inconnu');
  if (target.id === req.user.id) return echec(res, 400, req, 'contact.soiMeme');
  const exists = db
    .prepare('SELECT 1 FROM contacts WHERE owner_id = ? AND contact_id = ?')
    .get(req.user.id, target.id);
  if (exists) return echec(res, 409, req, 'contact.doublon');

  const info = db
    .prepare('INSERT INTO contacts (owner_id, contact_id, created_at) VALUES (?, ?, ?)')
    .run(req.user.id, target.id, Date.now());
  res.status(201).json({ id: info.lastInsertRowid, pseudo: target.pseudo, city: target.city });
});

contactRoutes.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM contacts WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.user.id);
  if (!info.changes) return echec(res, 404, req, 'contact.introuvable');
  res.json({ ok: true });
});
