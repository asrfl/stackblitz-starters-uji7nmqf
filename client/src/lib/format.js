import { traduire } from './i18n';

const nf = (intl, digits = 0) =>
  new Intl.NumberFormat(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * Toutes les mises en forme prennent la langue active : séparateurs, ordre
 * des dates et unités changent avec elle. On passe l'étiquette Intl
 * (« fr-FR », « en-GB ») plutôt que le code court, pour garder la main sur
 * la variante régionale.
 */
export function formatDistance(meters, intl = 'fr-FR') {
  if (meters == null) return '—';
  // aux petites échelles un trajet entier tient dans quelques centimètres :
  // arrondir à l'unité afficherait « 0 m » pendant tout le voyage.
  if (meters < 1) return `${nf(intl, 2).format(meters)} m`;
  if (meters < 10) return `${nf(intl, 1).format(meters)} m`;
  if (meters < 1000) return `${nf(intl, 0).format(Math.round(meters))} m`;
  const km = meters / 1000;
  return `${nf(intl, km < 100 ? 1 : 0).format(km)} km`;
}

/** Durée lisible, arrondie à l'unité qui compte vraiment. */
export function formatDuration(ms, langue = 'fr') {
  const t = (cle, valeurs) => traduire(langue, `duree.${cle}`, valeurs);
  if (ms == null) return '—';
  if (ms <= 0) return t('instant');

  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return t('moinsMinute');
  if (minutes < 60) return t('min', { n: minutes });

  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  if (hours < 24) return restMin ? t('heuresMinutes', { h: hours, min: restMin }) : t('heures', { h: hours });

  const days = Math.floor(hours / 24);
  const restH = hours % 24;
  if (days < 31) return restH ? t('joursHeures', { j: days, h: restH }) : t('jours', { n: days });

  const months = Math.floor(days / 30.44);
  const restD = Math.round(days - months * 30.44);
  return restD ? t('moisJours', { mois: months, j: restD }) : t('mois', { n: months });
}

export const formatDate = (ts, intl = 'fr-FR') =>
  ts
    ? new Intl.DateTimeFormat(intl, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(ts))
    : '—';

export const formatPercent = (p, intl = 'fr-FR') =>
  `${nf(intl, p < 0.1 ? 1 : 0).format(p * 100)} %`;

export const formatTemp = (t, intl = 'fr-FR') =>
  `${nf(intl, t % 1 === 0 ? 0 : 1).format(t)} °C`;

/** Compteur communautaire : gros chiffres, unité traduite à part. */
export function formatCounter(meters, intl = 'fr-FR', langue = 'fr') {
  const petit = meters < 1000;
  return {
    value: nf(intl, petit ? 0 : 1).format(petit ? Math.round(meters) : meters / 1000),
    unit: traduire(langue, petit ? 'unite.metres' : 'unite.kilometres'),
  };
}
