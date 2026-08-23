import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import CarteEscargot from './CarteEscargot';
import { Etat, Hibernation, LettreDepliee, Progression } from './Lettre';
import { Escargot, Feuille } from './Illustrations';
import { formatDate, formatDistance, formatDuration, formatTemp } from '../lib/format';
import { useI18n } from '../lib/i18n';

function Vignette({ message, actif, onClick, echelleLabel }) {
  const { t, intl } = useI18n();
  const perdu = message.status === 'lost';

  return (
    <button
      onClick={onClick}
      className={`feuille w-full rounded-galet px-5 py-4 text-left ${
        actif ? 'shadow-souleve ring-1 ring-sauge/45' : 'hover:shadow-souleve'
      } ${perdu ? 'opacity-70' : ''}`}
      style={{ transform: actif ? 'translateY(-2px) rotate(-0.25deg)' : undefined }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-titre text-[1.05rem] text-encre-fonce">
          {message.direction === 'recu' ? message.sender : message.recipient}
        </span>
        <Etat message={message} />
      </div>
      <p className="etiquette mt-1.5">
        {message.from.city} → {message.to.city} · {formatDistance(message.distanceM, intl)}
        {echelleLabel && (
          <span className="text-encre-pale/80"> · {echelleLabel.toLowerCase()}</span>
        )}
      </p>
      {message.status === 'transit' && (
        <div className="mt-3">
          <Progression message={message} />
        </div>
      )}
      {message.status === 'delivered' && (
        <p className="etiquette mt-2">
          {message.direction === 'recu' && !message.readAt ? (
            <span className="text-corail-fonce">{t('boite.attend')}</span>
          ) : (
            t('boite.arriveLe', { date: formatDate(message.deliveredAt, intl) })
          )}
        </p>
      )}
      {perdu && (
        <p className="etiquette mt-2">
          {t('boite.abandonne', {
            distance: formatDistance(message.distanceM * message.progress, intl),
          })}
        </p>
      )}
    </button>
  );
}

function Detail({ message, cities, onLu, echelleLabel }) {
  const { t, langue, intl } = useI18n();
  const perdu = message.status === 'lost';

  return (
    <section className="feuille animate-eclot rounded-feuille px-7 py-7 sm:px-9" key={message.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-titre text-2xl">
          {message.direction === 'recu'
            ? t('boite.de', { pseudo: message.sender })
            : t('boite.pour', { pseudo: message.recipient })}
        </h2>
        <Etat message={message} />
      </div>
      <p className="etiquette mt-1">
        {t('boite.entete', {
          ville: message.from.city,
          date: formatDate(message.departedAt, intl),
          echelle: echelleLabel ?? '',
        })}
      </p>

      <div className="my-6 overflow-hidden rounded-petale border border-encre/15 bg-papier/60 shadow-creuse">
        <CarteEscargot message={message} cities={cities} className="h-56 w-full sm:h-80 lg:h-[26rem]" />
      </div>

      {message.status === 'transit' && (
        <>
          <Progression message={message} />
          <Hibernation message={message} />
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {[
              [t('boite.parcourus'), formatDistance(message.distanceM * message.progress, intl)],
              [t('boite.restant'), formatDistance(message.distanceM * (1 - message.progress), intl)],
              [
                t('boite.arriveePrevue'),
                message.hibernating ? t('boite.suspendue') : formatDate(message.etaAt, intl),
              ],
              [
                t('boite.siestes'),
                message.pausedMs ? formatDuration(message.pausedMs, langue) : t('boite.aucuneSieste'),
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="etiquette">{k}</dt>
                <dd className="font-titre text-[0.98rem] text-encre-fonce">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="etiquette mt-4">
            {t('boite.note', {
              total: formatDistance(message.crawlDistanceM, intl),
              fait: formatDistance(message.crawlDistanceM * message.progress, intl),
            })}
          </p>
          {!message.hibernating && message.weather && (
            <p className="etiquette mt-1.5">
              {t('boite.meteoOk', {
                temp: formatTemp(message.weather.tempC, intl),
                lieu: message.weather.place,
              })}
            </p>
          )}
        </>
      )}

      {message.status === 'delivered' && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {[
            [t('boite.distance'), formatDistance(message.distanceM, intl)],
            [t('boite.rampe'), formatDistance(message.crawlDistanceM, intl)],
            [t('boite.voyage'), formatDuration(message.deliveredAt - message.departedAt, langue)],
            [
              t('boite.dontSiestes'),
              message.pausedMs ? formatDuration(message.pausedMs, langue) : t('boite.aucuneSieste'),
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="etiquette">{k}</dt>
              <dd className="font-titre text-[0.98rem] text-encre-fonce">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {perdu && (
        <div className="rounded-galet border border-encre-pale/40 bg-papier-creuse/70 px-5 py-5 text-center">
          <Escargot className="mx-auto h-14 w-20 text-encre-pale" />
          <p className="mt-2 font-titre text-lg text-encre">{t('boite.perduTitre')}</p>
          <p className="etiquette mt-1.5">
            {t('boite.perduTexte', {
              distance: formatDistance(message.distanceM * message.progress, intl),
            })}
          </p>
        </div>
      )}

      <LettreDepliee
        message={message}
        autoOpen={message.direction === 'envoye' ? false : Boolean(message.readAt)}
        onOpen={onLu}
      />

      {message.direction === 'envoye' && message.status !== 'lost' && (
        <p className="etiquette mt-4">
          {message.status === 'delivered'
            ? message.readAt
              ? t('boite.luLe', { date: formatDate(message.readAt, intl) })
              : t('boite.pasEncoreLu')
            : t('boite.enRoute')}
        </p>
      )}
    </section>
  );
}

export default function BoiteAuxLettres({
  messages,
  cities,
  config,
  selection,
  onSelection,
  onRafraichir,
}) {
  const { t } = useI18n();
  const [onglet, setOnglet] = useState('recus');
  const liste = onglet === 'recus' ? messages.recus : messages.envoyes;
  const courant = liste.find((m) => m.id === selection) ?? liste[0] ?? null;

  // Le libellé d'échelle vient de /api/config, déjà traduit par le serveur.
  const echelleDe = (message) =>
    config?.scales?.find((s) => s.id === message.scaleId)?.label ?? null;

  useEffect(() => {
    if (courant && courant.id !== selection) onSelection(courant.id);
  }, [courant, selection, onSelection]);

  async function marquerLu(message) {
    if (message.direction !== 'recu' || message.readAt) return;
    await api.read(message.id).catch(() => {});
    onRafraichir();
  }

  const nonLus = messages.recus.filter((m) => m.status === 'delivered' && !m.readAt).length;

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[22rem_1fr]">
      <div>
        <div className="mb-5 flex gap-2">
          {[
            ['recus', t('boite.recus'), messages.recus.length],
            ['envoyes', t('boite.envoyes'), messages.envoyes.length],
          ].map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => setOnglet(id)}
              className={`rounded-caillou px-4 py-2 font-titre text-[0.95rem] ${
                onglet === id
                  ? 'bg-sauge-brume text-encre-fonce shadow-creuse'
                  : 'text-encre-pale hover:bg-sauge-brume/50'
              }`}
            >
              {label} <span className="font-main text-base">{n}</span>
              {id === 'recus' && nonLus > 0 && (
                <span className="ml-1.5 inline-block h-2 w-2 rounded-goutte bg-corail align-middle" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {liste.length === 0 && (
            <div className="feuille-creuse rounded-galet px-6 py-10 text-center">
              <Feuille className="mx-auto h-9 w-7 text-sauge opacity-60" />
              <p className="etiquette mt-3">
                {onglet === 'recus' ? t('boite.videRecus') : t('boite.videEnvoyes')}
              </p>
            </div>
          )}
          {liste.map((m, i) => (
            <div key={m.id} className="animate-eclot" style={{ animationDelay: `${i * 60}ms` }}>
              <Vignette
                message={m}
                actif={courant?.id === m.id}
                onClick={() => onSelection(m.id)}
                echelleLabel={echelleDe(m)}
              />
            </div>
          ))}
        </div>
      </div>

      {courant ? (
        <Detail message={courant} cities={cities} onLu={marquerLu} echelleLabel={echelleDe(courant)} />
      ) : (
        <section className="feuille flex flex-col items-center justify-center rounded-feuille px-8 py-16 text-center">
          <Escargot className="h-20 w-28 animate-derive text-encre-fonce opacity-60" />
          <p className="mt-4 font-titre text-xl text-encre">{t('boite.aucunTitre')}</p>
          <p className="etiquette mt-1.5">{t('boite.aucunTexte')}</p>
        </section>
      )}
    </div>
  );
}
