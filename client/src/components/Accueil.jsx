import Compteur from './Compteur';
import CarteEscargot from './CarteEscargot';
import { Escargot, Feuille, Goutte, Brin } from './Illustrations';
import { formatDistance, formatDuration } from '../lib/format';
import { Progression, Etat } from './Lettre';

function Regle({ illustration, titre, texte }) {
  return (
    <li className="feuille rounded-galet px-6 py-6">
      <span className="mb-3 block text-sauge">{illustration}</span>
      <h3 className="font-titre text-lg">{titre}</h3>
      <p className="mt-1.5 font-corps text-[0.95rem] leading-[1.8] text-encre">{texte}</p>
    </li>
  );
}

export default function Accueil({ user, stats, config, messages, cities, onVue, onSelection }) {
  const enRoute = messages.recus
    .concat(messages.envoyes)
    .filter((m) => m.status === 'transit')
    .sort((a, b) => b.progress - a.progress);
  const vedette = enRoute[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="feuille relative overflow-hidden rounded-petale px-8 py-10 sm:px-12">
        <Brin className="absolute -right-4 top-6 h-14 w-36 rotate-6 text-sauge opacity-35" />
        <Escargot className="pointer-events-none absolute -bottom-3 right-10 hidden h-36 w-52 animate-derive text-encre-fonce/20 lg:block" />
        <p className="etiquette">Bonjour {user.pseudo}, il bruine sur le jardin.</p>
        <h1 className="mt-2 max-w-2xl font-main text-[3rem] leading-[1.02] text-encre-fonce sm:text-[3.8rem]">
          Vos mots avancent à {config.speedMetersPerHour} mètres par heure.
        </h1>
        <p className="mt-4 max-w-xl font-corps text-[1.05rem] leading-[1.9] text-encre">
          C’est peu. C’est exactement la vitesse d’un escargot de jardin qui ne se presse
          pas, et c’est tout l’intérêt : le temps de l’attente fait partie du message.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => onVue('ecrire')} className="bouton">
            Confier un message
          </button>
          <button onClick={() => onVue('boite')} className="bouton-sauge">
            Voir ma boîte
          </button>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.25fr]">
        <Compteur stats={stats} />

        <section className="feuille rounded-feuille px-7 py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-titre text-xl">
              {vedette ? 'Le plus avancé de vos escargots' : 'Aucun escargot sur la route'}
            </h2>
            {vedette && <Etat message={vedette} />}
          </div>

          {vedette ? (
            <button
              className="mt-4 block w-full text-left"
              onClick={() => {
                onSelection(vedette.id);
                onVue('boite');
              }}
            >
              <div className="overflow-hidden rounded-galet border border-encre/15 bg-papier/60 shadow-creuse">
                <CarteEscargot message={vedette} cities={cities} className="h-52 w-full sm:h-72" />
              </div>
              <p className="etiquette mt-3">
                {vedette.from.city} → {vedette.to.city} ·{' '}
                {formatDistance(vedette.distanceM * vedette.progress)} parcourus ·{' '}
                {vedette.hibernating
                  ? 'en hibernation'
                  : `encore ${formatDuration(vedette.remainingMs)}`}
              </p>
              <div className="mt-3">
                <Progression message={vedette} />
              </div>
            </button>
          ) : (
            <div className="mt-6 text-center">
              <Escargot className="mx-auto h-20 w-28 animate-derive text-encre-fonce opacity-55" />
              <p className="etiquette mt-3">
                Le jardin est calme. Confiez un message pour animer la carte.
              </p>
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-5 font-titre text-2xl">Comment ça marche, au juste</h2>
        <ul className="grid gap-6 md:grid-cols-3">
          <Regle
            illustration={<Escargot className="h-10 w-16 text-encre-fonce" />}
            titre="Une vitesse honnête"
            texte={`${config.speedMetersPerHour} mètres par heure, jamais plus. Sur la vraie distance, Paris — Marseille demanderait un an et demi : les échelles réduites replient la carte sans jamais presser la bête.`}
          />
          <Regle
            illustration={<Goutte className="h-10 w-8 text-pluie" />}
            titre="Il hiberne au froid"
            texte={`Sous ${config.hibernationTempC} °C sur son trajet, l’escargot s’enroule et attend. La sieste suspend le compteur : elle rallonge l’arrivée, elle ne raccourcit pas la route.`}
          />
          <Regle
            illustration={<Feuille className="h-10 w-8 text-sauge" />}
            titre="Parfois il s’en va"
            texte={`${Math.round(config.lostProbability * 100)} escargots sur cent quittent la route en chemin, sans prévenir. Le message ne sera jamais remis. C’est le risque du courrier vivant.`}
          />
        </ul>
      </section>
    </div>
  );
}
