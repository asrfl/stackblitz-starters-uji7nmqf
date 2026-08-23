import { useEffect, useState } from 'react';
import { formatDate, formatDistance, formatDuration, formatPercent, formatTemp } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { Goutte } from './Illustrations';

/** Barre de progression : un ruban de bave qui gagne du terrain. */
export function Progression({ message }) {
  const { t, langue, intl } = useI18n();
  const pct = Math.min(100, message.progress * 100);

  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-papier-ombre/70 shadow-creuse">
        <div
          className="h-full rounded-full transition-all ease-douce"
          style={{
            width: `${Math.max(1.5, pct)}%`,
            transitionDuration: '900ms',
            // un ruban de bave : mat au départ, brillant sous le museau
            background:
              'linear-gradient(90deg, rgba(147,169,180,0.55), rgba(107,142,111,0.7) 45%, rgba(185,205,182,0.95) 82%, rgba(251,247,238,1))',
            boxShadow: 'inset 0 1px 2px rgba(251,247,238,0.75)',
          }}
        />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <span className="etiquette">
          {t('lettre.progression', { pourcent: formatPercent(message.progress, intl) })}
        </span>
        <span className="etiquette text-right">
          {message.status === 'transit'
            ? message.hibernating
              ? t('lettre.enPause')
              : t('lettre.encore', { duree: formatDuration(message.remainingMs, langue) })
            : ''}
        </span>
      </div>
    </div>
  );
}

/** Bandeau d'hibernation : l'escargot a froid, il attend le redoux. */
export function Hibernation({ message }) {
  const { t, intl } = useI18n();
  if (!message.hibernating || !message.weather) return null;

  return (
    <div className="relative mt-3 overflow-hidden rounded-galet border border-pluie/50 bg-pluie-pale/40 px-4 py-3">
      <Goutte className="absolute -right-1 -top-1 h-10 w-8 text-pluie opacity-50" />
      <p className="font-corps text-[0.92rem] leading-relaxed text-pluie-fonce">
        {t('lettre.hibernation', {
          temp: formatTemp(message.weather.tempC, intl),
          lieu: message.weather.place,
        })}
      </p>
      <p className="etiquette mt-1 text-pluie-fonce/80">{t('lettre.hibernationNote')}</p>
    </div>
  );
}

const ETATS = {
  transit: { emoji: '🐌', cle: 'lettre.etatTransit', couleur: 'text-sauge-fonce bg-sauge-brume/70 border-sauge-pale' },
  delivered: { emoji: '📬', cle: 'lettre.etatArrive', couleur: 'text-corail-fonce bg-corail-pale/45 border-corail-pale' },
  lost: { emoji: '🐌💨', cle: 'lettre.etatPerdu', couleur: 'text-encre-pale bg-papier-creuse border-encre-pale/40' },
};

export function Etat({ message }) {
  const { t } = useI18n();
  const etat = message.hibernating
    ? { emoji: '❄️', cle: 'lettre.etatHibernation', couleur: 'text-pluie-fonce bg-pluie-pale/50 border-pluie/50' }
    : ETATS[message.status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-caillou border px-2.5 py-1 font-main text-[1.05rem] leading-none ${etat.couleur}`}
    >
      <span aria-hidden="true">{etat.emoji}</span>
      {t(etat.cle)}
    </span>
  );
}

/**
 * La lettre elle-même. Fermée, on ne voit que l'enveloppe ; à l'ouverture
 * le papier se déplie vers le bas et les plis s'effacent doucement.
 */
export function LettreDepliee({ message, autoOpen = false, onOpen }) {
  const { t, intl } = useI18n();
  const [ouverte, setOuverte] = useState(autoOpen);

  useEffect(() => {
    if (autoOpen) setOuverte(true);
  }, [autoOpen, message.id]);

  const ouvrir = () => {
    setOuverte(true);
    onOpen?.(message);
  };

  if (message.status !== 'delivered' && message.direction === 'recu') return null;

  if (!ouverte) {
    return (
      <button
        onClick={ouvrir}
        className="group mt-4 w-full rounded-feuille border border-corail-pale bg-corail-pale/25 px-5 py-6 text-left shadow-posee hover:shadow-souleve"
        style={{ transitionDuration: '600ms' }}
      >
        <span className="flex items-center gap-4">
          <svg viewBox="0 0 44 32" className="h-10 w-14 shrink-0" aria-hidden="true">
            <rect x="1.5" y="1.5" width="41" height="29" rx="3" fill="#FBF7EE" stroke="#BE6E60" strokeWidth="1.6" />
            <path
              d="M1.8 3 L 22 18 L 42.2 3"
              fill="none"
              stroke="#BE6E60"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="origin-top transition-transform duration-escargot ease-rampe group-hover:-translate-y-0.5"
            />
          </svg>
          <span>
            <span className="block font-titre text-lg text-encre-fonce">{t('lettre.deplier')}</span>
            <span className="etiquette">
              {t('lettre.deplierNote', {
                n: message.length,
                distance: formatDistance(message.distanceM, intl),
              })}
            </span>
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="mt-4 origin-top animate-deplie" style={{ transformStyle: 'preserve-3d' }}>
      <div className="relative overflow-hidden rounded-feuille border border-encre/25 bg-papier-clair px-6 py-6 shadow-feuille">
        {/* les plis de la feuille, encore visibles une seconde */}
        <span
          className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-encre/25 opacity-0"
          style={{ animation: 'luisance 1.4s ease-in-out 1' }}
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-encre/25 opacity-0"
          style={{ animation: 'luisance 1.8s ease-in-out 1' }}
        />
        <p className="etiquette mb-3">
          {t('lettre.entete', {
            ville: message.from.city,
            date: formatDate(message.departedAt, intl),
          })}
        </p>
        <p className="whitespace-pre-wrap font-corps text-[1.05rem] leading-[1.85] text-encre-fonce">
          {message.body}
        </p>
        <span className="filet my-5" />
        <p className="etiquette">
          {t('lettre.pied', {
            date: formatDate(message.deliveredAt, intl),
            distance: formatDistance(message.distanceM, intl),
            rampee: formatDistance(message.crawlDistanceM, intl),
          })}
        </p>
      </div>
    </div>
  );
}
