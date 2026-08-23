// Contour approximatif de la France metropolitaine (lon, lat), trace a gros
// traits : ce n'est pas un fond de carte SIG, c'est un croquis de carnet.
const CONTOUR = [
  [2.38, 51.03], [1.85, 50.95], [1.6, 50.72], [1.55, 50.2], [1.08, 49.93],
  [0.1, 49.5], [-0.25, 49.34], [-1.28, 49.35], [-1.62, 49.68], [-1.6, 48.83],
  [-2.02, 48.65], [-3.05, 48.78], [-4.49, 48.39], [-4.73, 48.04], [-3.37, 47.75],
  [-2.2, 47.28], [-1.78, 46.5], [-1.15, 46.16], [-1.03, 45.62], [-1.16, 44.66],
  [-1.35, 44.0], [-1.56, 43.48], [-1.4, 43.05], [-0.36, 42.8], [0.6, 42.72],
  [1.5, 42.5], [2.2, 42.42], [3.05, 42.5], [3.0, 43.15], [3.9, 43.55],
  [4.85, 43.35], [5.35, 43.3], [5.93, 43.1], [6.65, 43.16], [7.27, 43.7],
  [6.9, 44.4], [6.9, 45.0], [6.87, 45.83], [6.14, 46.2], [6.1, 46.6],
  [7.0, 47.32], [7.59, 47.55], [7.75, 48.58], [7.95, 49.03], [6.36, 49.46],
  [5.5, 49.5], [4.8, 49.8], [4.2, 50.0], [3.97, 50.3], [3.06, 50.63],
];

const CORSE = [
  [9.35, 43.0], [9.55, 42.7], [9.45, 42.35], [9.55, 41.92], [9.28, 41.37],
  [8.8, 41.55], [8.7, 41.92], [8.55, 42.26], [8.7, 42.6], [9.1, 42.95],
];

// Cadre geographique de la carte, marges comprises.
const BOUNDS = { lonMin: -5.6, lonMax: 10.2, latMin: 41.0, latMax: 51.4 };
const LAT_MID = (BOUNDS.latMin + BOUNDS.latMax) / 2;

export const VIEW = { w: 620, h: 700 };

/**
 * Projection equirectangulaire, corrigee par le cosinus de la latitude
 * moyenne pour que la France ne soit pas ecrasee en largeur.
 */
export function project({ lat, lon }) {
  const kx = Math.cos((LAT_MID * Math.PI) / 180);
  const spanX = (BOUNDS.lonMax - BOUNDS.lonMin) * kx;
  const spanY = BOUNDS.latMax - BOUNDS.latMin;
  const pad = 26;
  const scale = Math.min((VIEW.w - pad * 2) / spanX, (VIEW.h - pad * 2) / spanY);
  const offsetX = (VIEW.w - spanX * scale) / 2;
  const offsetY = (VIEW.h - spanY * scale) / 2;
  return {
    x: offsetX + (lon - BOUNDS.lonMin) * kx * scale,
    y: offsetY + (BOUNDS.latMax - lat) * scale,
  };
}

/**
 * Lissage Catmull-Rom converti en courbes de Bezier : le contour ondule
 * au lieu d'etre une suite de segments raides.
 */
function smoothClosedPath(points) {
  const p = points.map((pt) => project({ lon: pt[0], lat: pt[1] }));
  const n = p.length;
  const at = (i) => p[(i + n) % n];
  let d = `M ${at(0).x.toFixed(2)} ${at(0).y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

export const FRANCE_PATH = smoothClosedPath(CONTOUR);
export const CORSE_PATH = smoothClosedPath(CORSE);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Angle du trajet, pour orienter l'escargot dans le bon sens. */
export function headingDeg(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}
