import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { formatDistance, formatDuration } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { Escargot, Brin } from './Illustrations';

const rad = (d) => (d * Math.PI) / 180;

/** Même calcul que le serveur, pour annoncer le trajet avant de s'engager. */
function haversine(a, b) {
  const R = 6371008.8;
  const s =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export default function Composer({ user, contacts, cities, config, onEnvoye }) {
  const { t, langue, intl } = useI18n();
  const [destinataire, setDestinataire] = useState(contacts[0]?.pseudo ?? '');
  const [texte, setTexte] = useState('');
  const [villeDepart, setVilleDepart] = useState(user.city || cities[0]?.name || '');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [echelle, setEchelle] = useState(config.defaultScale);
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const contact = contacts.find((c) => c.pseudo === destinataire);
  const arriveeEffective = villeArrivee || contact?.city || '';
  const max = config.maxBodyLength;
  const restants = max - texte.length;

  // Aperçu du trajet : distance réelle, distance rampée, durée annoncée.
  const apercu = useMemo(() => {
    const a = cities.find((c) => c.name === villeDepart);
    const b = cities.find((c) => c.name === arriveeEffective);
    const scale = config.scales.find((s) => s.id === echelle)?.scale ?? 1;
    if (!a || !b) return null;
    const distance = Math.max(250, haversine(a, b));
    const rampee = distance * scale;
    const heures = rampee / config.speedMetersPerHour;
    return { distance, rampee, dureeMs: heures * 3600 * 1000 };
  }, [cities, villeDepart, arriveeEffective, echelle, config]);

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    try {
      const message = await api.send({
        to: destinataire,
        body: texte,
        fromCity: villeDepart,
        toCity: arriveeEffective || undefined,
        scale: echelle,
      });
      setTexte('');
      setVilleArrivee('');
      onEnvoye(message);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setOccupe(false);
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="feuille mx-auto max-w-xl rounded-petale px-8 py-10 text-center">
        <Escargot className="mx-auto h-20 w-28 text-encre-fonce opacity-70" />
        <h2 className="mt-4 font-titre text-2xl">{t('composer.videTitre')}</h2>
        <p className="mt-2 font-corps leading-relaxed text-encre">{t('composer.videTexte')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
      <section className="feuille relative rounded-feuille px-8 py-8 sm:px-10">
        <Brin className="absolute right-4 top-3 h-9 w-24 text-sauge opacity-35" />
        <h2 className="font-titre text-2xl">{t('composer.titre')}</h2>
        <p className="etiquette mt-1">{t('composer.sousTitre')}</p>

        <label className="mt-7 block">
          <span className="etiquette">{t('composer.pour')}</span>
          <select
            className="champ mt-1.5"
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.pseudo}>
                {c.pseudo}
                {c.city ? ` — ${c.city}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-6 block">
          <span className="etiquette flex items-baseline justify-between gap-3">
            <span>{t('composer.message')}</span>
            <span className={restants < 40 ? 'text-corail-fonce' : ''}>
              {t('composer.restants', { n: restants })}
            </span>
          </span>
          <textarea
            className="champ mt-1.5 min-h-[13rem] resize-y leading-[1.9]"
            value={texte}
            onChange={(e) => setTexte(e.target.value.slice(0, max))}
            placeholder={t('composer.exemple')}
            required
          />
        </label>

        {erreur && (
          <p className="mt-5 rounded-galet border border-corail-pale bg-corail-pale/30 px-4 py-3 font-corps text-[0.92rem] text-corail-fonce">
            {erreur}
          </p>
        )}

        <button className="bouton mt-7 w-full sm:w-auto" disabled={occupe || !texte.trim() || !apercu}>
          {occupe ? t('composer.envoiEnCours') : t('composer.envoyer')}
        </button>
      </section>

      <section className="space-y-6">
        <div className="feuille rounded-galet px-7 py-7">
          <h3 className="font-titre text-lg">{t('composer.itineraire')}</h3>
          <label className="mt-4 block">
            <span className="etiquette">{t('composer.depart')}</span>
            <select
              className="champ mt-1.5"
              value={villeDepart}
              onChange={(e) => setVilleDepart(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="etiquette">{t('composer.arrivee')}</span>
            <select
              className="champ mt-1.5"
              value={villeArrivee || contact?.city || ''}
              onChange={(e) => setVilleArrivee(e.target.value)}
            >
              <option value="" disabled>
                {t('commun.choisirVille')}
              </option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {contact?.city && !villeArrivee && (
              <span className="etiquette mt-1.5 block">
                {t('composer.adresseConnue', { pseudo: contact.pseudo })}
              </span>
            )}
          </label>
        </div>

        <div className="feuille rounded-galet px-7 py-7">
          <h3 className="font-titre text-lg">{t('composer.echelleTitre')}</h3>
          <p className="etiquette mt-1">
            {t('composer.echelleAide', { vitesse: config.speedMetersPerHour })}
          </p>
          <div className="mt-4 space-y-2.5">
            {config.scales.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-3 rounded-caillou border px-4 py-3 ${
                  echelle === s.id
                    ? 'border-sauge bg-sauge-brume/70 shadow-creuse'
                    : 'border-encre/15 bg-papier/60 hover:border-sauge-pale'
                }`}
                style={{ transitionDuration: '480ms' }}
              >
                <input
                  type="radio"
                  name="echelle"
                  className="sr-only"
                  checked={echelle === s.id}
                  onChange={() => setEchelle(s.id)}
                />
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-goutte border ${
                    echelle === s.id ? 'border-sauge-fonce bg-sauge' : 'border-encre-pale bg-papier'
                  }`}
                />
                <span>
                  <span className="block font-titre text-[0.98rem] text-encre-fonce">{s.label}</span>
                  <span className="etiquette">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {apercu && (
          <div className="feuille animate-eclot rounded-petale px-7 py-7">
            <h3 className="font-titre text-lg">{t('composer.apercuTitre')}</h3>
            <dl className="mt-4 space-y-2.5">
              {[
                [t('composer.distanceReelle'), formatDistance(apercu.distance, intl)],
                [t('composer.distanceRampee'), formatDistance(apercu.rampee, intl)],
                [t('composer.dureeAnnoncee'), formatDuration(apercu.dureeMs, langue)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="etiquette">{k}</dt>
                  <dd className="font-titre text-[1.05rem] text-encre-fonce">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 font-corps text-[0.88rem] italic leading-relaxed text-encre-pale">
              {t('composer.apercuNote', { pourcent: Math.round(config.lostProbability * 100) })}
            </p>
          </div>
        )}
      </section>
    </form>
  );
}
