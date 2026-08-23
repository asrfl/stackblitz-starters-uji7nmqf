const nf = (digits = 0) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Distance en francais courant : metres en dessous du kilometre. */
export function formatDistance(meters) {
  if (meters == null) return '—';
  // aux petites échelles un trajet entier tient dans quelques centimètres :
  // arrondir à l'unité afficherait « 0 m » pendant tout le voyage.
  if (meters < 1) return `${nf(2).format(meters)} m`;
  if (meters < 10) return `${nf(1).format(meters)} m`;
  if (meters < 1000) return `${nf(0).format(Math.round(meters))} m`;
  const km = meters / 1000;
  return `${nf(km < 100 ? 1 : 0).format(km)} km`;
}

/** Duree lisible, arrondie a l'unite qui compte vraiment. */
export function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms <= 0) return 'à l’instant';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'moins d’une minute';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  if (hours < 24) return restMin ? `${hours} h ${restMin} min` : `${hours} h`;

  const days = Math.floor(hours / 24);
  const restH = hours % 24;
  if (days < 31) return restH ? `${days} j ${restH} h` : `${days} jours`;

  const months = Math.floor(days / 30.44);
  const restD = Math.round(days - months * 30.44);
  return restD ? `${months} mois ${restD} j` : `${months} mois`;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (ts) => (ts ? dateFmt.format(new Date(ts)) : '—');

export const formatPercent = (p) => `${nf(p < 0.1 ? 1 : 0).format(p * 100)} %`;

export const formatTemp = (t) => `${nf(t % 1 === 0 ? 0 : 1).format(t)} °C`;

/** Compteur communautaire : gros chiffres, avec les espaces insecables. */
export function formatCounter(meters) {
  if (meters < 1000) return { value: nf(0).format(Math.round(meters)), unit: 'mètres' };
  return { value: nf(1).format(meters / 1000), unit: 'kilomètres' };
}
