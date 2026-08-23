import { db, setStat } from './db.js';
import { SCALES, computeState, shouldGetLost } from './snail.js';
import { getWeather, HIBERNATION_TEMP } from './weather.js';

const WEATHER_REFRESH_MS = 4 * 60 * 1000;

const scaleLabel = (scale) =>
  SCALES.find((s) => Math.abs(s.scale - scale) < 1e-12)?.label ?? `x${scale}`;

const selectMessage = `
  SELECT m.*, s.pseudo AS sender_pseudo, r.pseudo AS recipient_pseudo
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  JOIN users r ON r.id = m.recipient_id
`;

export const getMessageRow = (id) =>
  db.prepare(`${selectMessage} WHERE m.id = ?`).get(id);

export const listMessageRows = (where, ...params) =>
  db.prepare(`${selectMessage} ${where}`).all(...params);

/**
 * Vue d'un message pour un lecteur donne. Le corps du message n'est joint
 * qu'a l'arrivee : c'est tout le principe de la maison.
 */
export function serialize(row, viewerId, now = Date.now()) {
  const state = computeState(row, now);
  const isSender = row.sender_id === viewerId;
  const readable = row.status === 'delivered' || isSender;

  return {
    id: row.id,
    direction: isSender ? 'envoye' : 'recu',
    sender: row.sender_pseudo,
    recipient: row.recipient_pseudo,
    from: { city: row.from_city, lat: row.from_lat, lon: row.from_lon },
    to: { city: row.to_city, lat: row.to_lat, lon: row.to_lon },
    distanceM: row.distance_m,
    crawlDistanceM: row.crawl_distance_m,
    scale: row.scale,
    scaleLabel: scaleLabel(row.scale),
    status: row.status,
    hibernating: state.hibernating,
    progress: state.progress,
    position: state.position,
    departedAt: row.departed_at,
    etaAt: row.status === 'transit' ? state.etaAt : row.delivered_at,
    remainingMs: state.remainingMs,
    pausedMs: state.pausedMs,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    lostAt: row.lost_at,
    body: readable ? row.body : null,
    length: row.body.length,
    weather:
      row.weather_temp == null
        ? null
        : {
            tempC: row.weather_temp,
            place: row.weather_place,
            source: row.weather_source,
            checkedAt: row.weather_checked_at,
          },
  };
}

const markDelivered = db.prepare(
  `UPDATE messages SET status = 'delivered', delivered_at = ?, paused_since = NULL WHERE id = ?`
);
const markLost = db.prepare(
  `UPDATE messages SET status = 'lost', lost_at = ?, paused_since = NULL WHERE id = ?`
);
const startHibernation = db.prepare(`UPDATE messages SET paused_since = ? WHERE id = ?`);
const endHibernation = db.prepare(
  `UPDATE messages SET paused_ms = paused_ms + ?, paused_since = NULL WHERE id = ?`
);
const saveWeather = db.prepare(
  `UPDATE messages SET weather_temp = ?, weather_place = ?, weather_source = ?, weather_checked_at = ? WHERE id = ?`
);
const saveEta = db.prepare(`UPDATE messages SET eta_at = ? WHERE id = ?`);

/**
 * Un tour de ticker : fait avancer chaque escargot en transit, decide des
 * hibernations, des arrivees et des fugues, puis rafraichit le compteur
 * communautaire. Idempotent : tout est recalcule depuis les colonnes.
 */
export async function tick(now = Date.now()) {
  const rows = db.prepare(`SELECT * FROM messages WHERE status = 'transit'`).all();

  for (const row of rows) {
    const state = computeState(row, now);

    if (shouldGetLost(row, state.progress)) {
      markLost.run(now, row.id);
      continue;
    }

    if (state.progress >= 1) {
      markDelivered.run(now, row.id);
      continue;
    }

    const stale =
      row.weather_checked_at == null || now - row.weather_checked_at > WEATHER_REFRESH_MS;
    if (!stale) continue;

    const weather = await getWeather(state.position, now);
    saveWeather.run(weather.tempC, weather.place, weather.source, now, row.id);

    const tooCold = weather.tempC < HIBERNATION_TEMP;
    if (tooCold && row.paused_since == null) {
      startHibernation.run(now, row.id);
    } else if (!tooCold && row.paused_since != null) {
      endHibernation.run(now - row.paused_since, row.id);
    }

    // L'ETA stockee suit les siestes : elle recule d'autant qu'on a dormi.
    const fresh = db.prepare('SELECT * FROM messages WHERE id = ?').get(row.id);
    saveEta.run(computeState(fresh, now).etaAt, row.id);
  }

  refreshCommunityCounter(now);
}

/**
 * Compteur communautaire : somme des distances "carte" parcourues par tous
 * les escargots. Recalcule a chaque tour plutot qu'accumule, pour ne jamais
 * deriver si le serveur redemarre.
 */
export function refreshCommunityCounter(now = Date.now()) {
  const rows = db.prepare('SELECT * FROM messages').all();
  let total = 0;
  for (const row of rows) total += computeState(row, now).mapCrawledM;
  setStat('total_crawled_m', total);
  return total;
}
