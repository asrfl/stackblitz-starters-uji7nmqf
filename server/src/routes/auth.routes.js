import { Router } from 'express';
import { db } from '../db.js';
import { hashPin, verifyPin, newToken, isValidPseudo, isValidPin, requireUser } from '../auth.js';
import { findCity } from '../cities.js';
import { echec } from '../i18n.js';

export const authRoutes = Router();

const publicUser = (row, token) => ({
  id: row.id,
  pseudo: row.pseudo,
  city: row.city,
  ...(token ? { token } : {}),
});

authRoutes.post('/register', (req, res) => {
  const pseudo = String(req.body?.pseudo ?? '').trim();
  const pin = String(req.body?.pin ?? '');
  const city = req.body?.city ? findCity(req.body.city) : null;

  if (!isValidPseudo(pseudo)) return echec(res, 400, req, 'auth.pseudoInvalide');
  if (!isValidPin(pin)) return echec(res, 400, req, 'auth.codeInvalide');
  if (req.body?.city && !city) return echec(res, 400, req, 'ville.inconnue');

  const taken = db.prepare('SELECT 1 FROM users WHERE pseudo = ?').get(pseudo);
  if (taken) return echec(res, 409, req, 'auth.pseudoPris');

  const token = newToken();
  const info = db
    .prepare('INSERT INTO users (pseudo, pin_hash, city, token, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(pseudo, hashPin(pin), city?.name ?? null, token, Date.now());

  res.status(201).json(publicUser({ id: info.lastInsertRowid, pseudo, city: city?.name ?? null }, token));
});

authRoutes.post('/login', (req, res) => {
  const pseudo = String(req.body?.pseudo ?? '').trim();
  const pin = String(req.body?.pin ?? '');
  const row = db.prepare('SELECT * FROM users WHERE pseudo = ?').get(pseudo);

  // Meme reponse dans les deux cas : on n indique pas quels pseudos existent.
  if (!row || !verifyPin(pin, row.pin_hash)) return echec(res, 401, req, 'auth.identifiants');

  const token = newToken();
  db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, row.id);
  res.json(publicUser(row, token));
});

authRoutes.get('/me', requireUser, (req, res) => res.json(publicUser(req.user)));

authRoutes.patch('/me', requireUser, (req, res) => {
  const city = findCity(req.body?.city);
  if (!city) return echec(res, 400, req, 'ville.inconnue');
  db.prepare('UPDATE users SET city = ? WHERE id = ?').run(city.name, req.user.id);
  res.json(publicUser({ ...req.user, city: city.name }));
});

authRoutes.post('/logout', requireUser, (req, res) => {
  db.prepare('UPDATE users SET token = NULL WHERE id = ?').run(req.user.id);
  res.json({ ok: true });
});
