import { lerpPoint } from './cities.js';

/** Vitesse d'un escargot de jardin : ~0.048 km/h, soit 48 metres par heure. */
export const SNAIL_SPEED_M_PER_HOUR = 48;
export const SNAIL_SPEED_MPS = SNAIL_SPEED_M_PER_HOUR / 3600; // ~0.01333 m/s

/**
 * Echelles disponibles. A l'echelle 1 un Paris - Marseille demande ~18 mois :
 * authentique, mais injouable. Les echelles reduites racourcissent la distance
 * rampee sans toucher a la vitesse de l'escargot, qui reste sacree.
 */
export const SCALES = [
  { id: 'reel', label: 'Grandeur nature', hint: 'La vraie distance. Des mois de patience.', scale: 1 },
  { id: 'jardin', label: 'Échelle jardin', hint: 'Un millième du trajet. Quelques heures.', scale: 1 / 1000 },
  { id: 'potager', label: 'Échelle potager', hint: 'Un dix-millième. Une petite heure.', scale: 1 / 10000 },
  { id: 'demo', label: 'Échelle bocal', hint: 'Pour les impatients. Quelques minutes.', scale: 1 / 100000 },
];

export const DEFAULT_SCALE_ID = 'potager';
export const LOST_PROBABILITY = 0.02; // 2% de chance de partir voir ailleurs

export function findScale(id) {
  return SCALES.find((s) => s.id === id) || SCALES.find((s) => s.id === DEFAULT_SCALE_ID);
}

/** Duree de rampe pure (hors hibernation), en millisecondes. */
export function travelDurationMs(crawlDistanceM) {
  return (crawlDistanceM / SNAIL_SPEED_MPS) * 1000;
}

/**
 * Etat vivant d'un message : progression, position interpolee, temps restant.
 * Purement calcule a partir des colonnes stockees, donc toujours coherent
 * meme si le ticker n'a pas tourne depuis un moment.
 */
export function computeState(row, now = Date.now()) {
  const totalMs = travelDurationMs(row.crawl_distance_m);
  const hibernating = row.paused_since != null && row.status === 'transit';
  const pausedMs = row.paused_ms + (hibernating ? now - row.paused_since : 0);
  // Temps passe a ramper pour de vrai : on retranche toutes les siestes.
  const crawlingMs = Math.max(0, now - row.departed_at - pausedMs);

  let progress = totalMs > 0 ? Math.min(1, crawlingMs / totalMs) : 1;
  if (row.status === 'delivered') progress = 1;
  if (row.status === 'lost') progress = row.lost_at_progress ?? progress;

  const from = { lat: row.from_lat, lon: row.from_lon };
  const to = { lat: row.to_lat, lon: row.to_lon };
  const position = lerpPoint(from, to, progress);

  const remainingMs =
    row.status === 'transit' ? Math.max(0, totalMs - crawlingMs) : 0;
  const etaAt = row.status === 'transit' ? now + remainingMs : row.delivered_at;

  return {
    progress,
    position,
    hibernating,
    totalMs,
    pausedMs,
    remainingMs,
    etaAt,
    // metres reellement rampes a l'instant t (echelle reduite comprise)
    crawledM: row.crawl_distance_m * progress,
    // metres "sur la carte", ce que l'escargot pretend avoir couvert
    mapCrawledM: row.distance_m * progress,
  };
}

/** L'escargot doit-il se perdre maintenant ? */
export function shouldGetLost(row, progress) {
  return (
    row.status === 'transit' &&
    row.lost_at_progress != null &&
    progress >= row.lost_at_progress
  );
}

/** Tirage a l'envoi : 2% des escargots ne finiront jamais leur voyage. */
export function rollLostProgress(random = Math.random) {
  if (random() >= LOST_PROBABILITY) return null;
  // Il se perd quelque part entre 10% et 90% du trajet, jamais des le depart.
  return 0.1 + random() * 0.8;
}
