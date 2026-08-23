// Table statique de villes francaises (lat/lon approximatifs, WGS84).
// Pas de geolocalisation reelle : l'utilisateur choisit une ville dans la liste.
export const CITIES = [
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
  { name: 'Lyon', lat: 45.764, lon: 4.8357 },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
  { name: 'Nice', lat: 43.7102, lon: 7.262 },
  { name: 'Nantes', lat: 47.2184, lon: -1.5536 },
  { name: 'Montpellier', lat: 43.6108, lon: 3.8767 },
  { name: 'Strasbourg', lat: 48.5734, lon: 7.7521 },
  { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
  { name: 'Lille', lat: 50.6292, lon: 3.0573 },
  { name: 'Rennes', lat: 48.1173, lon: -1.6778 },
  { name: 'Reims', lat: 49.2583, lon: 4.0317 },
  { name: 'Saint-Étienne', lat: 45.4397, lon: 4.3872 },
  { name: 'Toulon', lat: 43.1242, lon: 5.928 },
  { name: 'Le Havre', lat: 49.4944, lon: 0.1079 },
  { name: 'Grenoble', lat: 45.1885, lon: 5.7245 },
  { name: 'Dijon', lat: 47.322, lon: 5.0415 },
  { name: 'Angers', lat: 47.4784, lon: -0.5632 },
  { name: 'Nîmes', lat: 43.8367, lon: 4.3601 },
  { name: 'Clermont-Ferrand', lat: 45.7772, lon: 3.087 },
  { name: 'Le Mans', lat: 48.0061, lon: 0.1996 },
  { name: 'Aix-en-Provence', lat: 43.5297, lon: 5.4474 },
  { name: 'Brest', lat: 48.3904, lon: -4.4861 },
  { name: 'Tours', lat: 47.3941, lon: 0.6848 },
  { name: 'Amiens', lat: 49.8941, lon: 2.2958 },
  { name: 'Limoges', lat: 45.8336, lon: 1.2611 },
  { name: 'Annecy', lat: 45.8992, lon: 6.1294 },
  { name: 'Perpignan', lat: 42.6887, lon: 2.8948 },
  { name: 'Besançon', lat: 47.238, lon: 6.0243 },
  { name: 'Metz', lat: 49.1193, lon: 6.1757 },
  { name: 'Orléans', lat: 47.9029, lon: 1.9093 },
  { name: 'Rouen', lat: 49.4432, lon: 1.0999 },
  { name: 'Mulhouse', lat: 47.7508, lon: 7.3359 },
  { name: 'Caen', lat: 49.1829, lon: -0.3707 },
  { name: 'Nancy', lat: 48.6921, lon: 6.1844 },
  { name: 'Poitiers', lat: 46.5802, lon: 0.3404 },
  { name: 'La Rochelle', lat: 46.1603, lon: -1.1511 },
  { name: 'Avignon', lat: 43.9493, lon: 4.8055 },
  { name: 'Chambéry', lat: 45.5646, lon: 5.9178 },
  { name: 'Bayonne', lat: 43.4933, lon: -1.4748 },
  { name: 'Pau', lat: 43.2951, lon: -0.3708 },
  { name: 'Colmar', lat: 48.0794, lon: 7.3585 },
  { name: 'Troyes', lat: 48.2973, lon: 4.0744 },
  { name: 'Lorient', lat: 47.7477, lon: -3.3702 },
  { name: 'Quimper', lat: 47.9962, lon: -4.0985 },
  { name: 'Valence', lat: 44.9334, lon: 4.8924 },
  { name: 'Cherbourg', lat: 49.6386, lon: -1.6164 },
  { name: 'Ajaccio', lat: 41.9192, lon: 8.7386 },
  { name: 'Bastia', lat: 42.7028, lon: 9.4508 },
  { name: 'Biarritz', lat: 43.4832, lon: -1.5586 },
];

const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const INDEX = new Map(CITIES.map((c) => [normalize(c.name), c]));

export function findCity(name) {
  if (!name) return null;
  return INDEX.get(normalize(name)) || null;
}

const R = 6371008.8; // rayon terrestre moyen, en metres
const rad = (d) => (d * Math.PI) / 180;

/** Distance orthodromique (haversine) entre deux points, en metres. */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Interpolation lineaire entre deux coordonnees (suffisant a l'echelle de la France). */
export function lerpPoint(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return { lat: a.lat + (b.lat - a.lat) * k, lon: a.lon + (b.lon - a.lon) * k };
}

/** Ville de la table la plus proche d'un point : sert a nommer la meteo. */
export function nearestCity(point) {
  let best = null;
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = haversine(point, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}
