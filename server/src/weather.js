import { nearestCity } from './cities.js';

/** En dessous de ce seuil, l'escargot s'enroule dans sa coquille et attend. */
export const HIBERNATION_TEMP = 5;

// auto  : on tente Open-Meteo (gratuit, sans cle), on retombe sur la simulation
// simule: jamais de reseau, climat plausible genere localement
// givre : simulation avec des coups de froid frequents, pour voir l'hibernation
const MODE = process.env.WEATHER_MODE || 'auto';
const BIAS = Number(process.env.WEATHER_BIAS || 0);
const CACHE_TTL_MS = 10 * 60 * 1000;
const REMOTE_COOLDOWN_MS = 5 * 60 * 1000;

const cache = new Map();
let remoteBrokenUntil = 0;

// --- bruit de valeur lisse, deterministe : pas de sautes de temperature ---
function hash(n) {
  const h = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(seed, t) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f); // smoothstep : transitions douces
  const a = hash(i + seed * 1.37);
  const b = hash(i + 1 + seed * 1.37);
  return a + (b - a) * u;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const coordSeed = (lat, lon) => Math.abs(lat * 73.7 + lon * 151.3);

/**
 * Climat simule : saison + latitude + cycle jour/nuit + errance,
 * plus des "coups de froid" passagers (une averse du petit matin) qui
 * declenchent l'hibernation meme en plein mois d'aout.
 */
export function simulateTemperature(lat, lon, now = Date.now()) {
  const date = new Date(now);
  const monthish = date.getMonth() + date.getDate() / 31;
  const hour = date.getHours() + date.getMinutes() / 60;
  const seed = coordSeed(lat, lon);

  const seasonal = 13 + 9 * Math.cos((2 * Math.PI * (monthish - 6.5)) / 12);
  const byLatitude = -(lat - 46.5) * 0.85;
  const diurnal = 4.5 * Math.cos((2 * Math.PI * (hour - 15)) / 24);
  const wander = (smoothNoise(seed, now / (11 * 60 * 1000)) - 0.5) * 7;

  const icy = MODE === 'givre';
  const snapNoise = smoothNoise(seed + 41, now / ((icy ? 9 : 23) * 60 * 1000));
  const snapStart = icy ? 0.42 : 0.66;
  const snapDepth = icy ? 26 : 17;
  const coldSnap = -smoothstep(snapStart, snapStart + 0.24, snapNoise) * snapDepth;

  return Math.round((seasonal + byLatitude + diurnal + wander + coldSnap + BIAS) * 10) / 10;
}

async function fetchOpenMeteo(lat, lon) {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  // Un proxy filtrant peut repondre 200 avec du texte : on valide la forme.
  const data = await res.json();
  const temp = data?.current?.temperature_2m;
  if (typeof temp !== 'number' || Number.isNaN(temp)) {
    throw new Error('open-meteo: reponse inattendue');
  }
  return temp;
}

/**
 * Meteo au point courant du trajet. Renvoie toujours quelque chose :
 * si le reseau manque, la simulation prend le relais sans bruit.
 */
export async function getWeather(point, now = Date.now()) {
  const key = `${point.lat.toFixed(1)},${point.lon.toFixed(1)}`;
  const cached = cache.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;

  const place = nearestCity(point)?.name ?? 'quelque part';
  let value = { tempC: simulateTemperature(point.lat, point.lon, now), place, source: 'simule' };

  if (MODE === 'auto' && now >= remoteBrokenUntil) {
    try {
      value = { tempC: await fetchOpenMeteo(point.lat, point.lon), place, source: 'open-meteo' };
    } catch {
      // Pas de panique : on laisse la simulation et on attend un peu
      // avant de re-tenter, pour ne pas marteler une API injoignable.
      remoteBrokenUntil = now + REMOTE_COOLDOWN_MS;
    }
  }

  cache.set(key, { at: now, value });
  return value;
}

export const weatherMode = MODE;
