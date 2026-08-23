import crypto from 'node:crypto';
import { db } from './db.js';

/** PIN a 4 chiffres : hache avec sel (scrypt), jamais stocke en clair. */
export function hashPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPin(pin, stored) {
  const [salt, derived] = String(stored).split(':');
  if (!salt || !derived) return false;
  const candidate = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(derived, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const newToken = () => crypto.randomBytes(24).toString('hex');

export const isValidPseudo = (p) => /^[\p{L}\p{N} _.-]{2,24}$/u.test(String(p || '').trim());
export const isValidPin = (p) => /^\d{4}$/.test(String(p || ''));

/** Middleware : resout le porteur du jeton, sans le rendre obligatoire. */
export function attachUser(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.user = token
    ? db.prepare('SELECT id, pseudo, city FROM users WHERE token = ?').get(token) || null
    : null;
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Il faut d’abord ouvrir sa boîte aux lettres.' });
  next();
}
