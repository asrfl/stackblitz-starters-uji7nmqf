import { Router } from 'express';
import { db, getStat } from '../db.js';
import { CITIES } from '../cities.js';
import { SCALES, DEFAULT_SCALE_ID, SNAIL_SPEED_M_PER_HOUR, LOST_PROBABILITY } from '../snail.js';
import { HIBERNATION_TEMP, weatherMode } from '../weather.js';
import { refreshCommunityCounter } from '../messages.js';
import { MAX_BODY } from './messages.routes.js';
import { langueDe, tr, LANGUES } from '../i18n.js';

export const metaRoutes = Router();

metaRoutes.get('/cities', (_req, res) => res.json(CITIES));

metaRoutes.get('/config', (req, res) => {
  const langue = langueDe(req);
  return res.json({
    speedMetersPerHour: SNAIL_SPEED_M_PER_HOUR,
    langue,
    languesDisponibles: LANGUES,
    // Les libellés d'échelle suivent la langue demandée ; l'id, lui, ne bouge
    // jamais, c'est ce que le client renvoie à l'envoi.
    scales: SCALES.map((s) => ({
      ...s,
      label: tr(langue, `echelle.${s.id}.label`),
      hint: tr(langue, `echelle.${s.id}.hint`),
    })),
    defaultScale: DEFAULT_SCALE_ID,
    maxBodyLength: MAX_BODY,
    hibernationTempC: HIBERNATION_TEMP,
    lostProbability: LOST_PROBABILITY,
    weatherMode,
  });
});

/** Compteur communautaire affiche en page d accueil. */
metaRoutes.get('/stats', (_req, res) => {
  refreshCommunityCounter();
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    totalCrawledM: getStat('total_crawled_m'),
    enTransit: count(`SELECT COUNT(*) AS n FROM messages WHERE status = 'transit'`),
    arrives: count(`SELECT COUNT(*) AS n FROM messages WHERE status = 'delivered'`),
    perdus: count(`SELECT COUNT(*) AS n FROM messages WHERE status = 'lost'`),
    hibernants: count(`SELECT COUNT(*) AS n FROM messages WHERE paused_since IS NOT NULL AND status = 'transit'`),
    jardiniers: count('SELECT COUNT(*) AS n FROM users'),
  });
});
