import Compteur from './Compteur';
import CarteEscargot from './CarteEscargot';
import { Escargot, Feuille, Goutte, Brin } from './Illustrations';
import { formatDistance, formatDuration } from '../lib/format';
import { useI18n } from '../lib/i18n';
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
  const { t, langue, intl } = useI18n();

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
        <p className="etiquette">{t('accueil.salut', { pseudo: user.pseudo })}</p>
        <h1 className="mt-2 max-w-2xl font-main text-[3rem] leading-[1.02] text-encre-fonce sm:text-[3.8rem]">
          {t('accueil.titre', { vitesse: config.speedMetersPerHour })}
        </h1>
        <p className="mt-4 max-w-xl font-corps text-[1.05rem] leading-[1.9] text-encre">
          {t('accueil.chapeau')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => onVue('ecrire')} className="bouton">
            {t('accueil.confier')}
          </button>
          <button onClick={() => onVue('boite')} className="bouton-sauge">
            {t('accueil.voirBoite')}
          </button>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.25fr]">
        <Compteur stats={stats} />

        <section className="feuille rounded-feuille px-7 py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-titre text-xl">
              {vedette ? t('accueil.vedette') : t('accueil.aucun')}
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
                {t('accueil.resume', {
                  depart: vedette.from.city,
                  arrivee: vedette.to.city,
                  distance: formatDistance(vedette.distanceM * vedette.progress, intl),
                  reste: vedette.hibernating
                    ? t('accueil.resumeHibernation')
                    : t('accueil.resumeReste', {
                        duree: formatDuration(vedette.remainingMs, langue),
                      }),
                })}
              </p>
              <div className="mt-3">
                <Progression message={vedette} />
              </div>
            </button>
          ) : (
            <div className="mt-6 text-center">
              <Escargot className="mx-auto h-20 w-28 animate-derive text-encre-fonce opacity-55" />
              <p className="etiquette mt-3">{t('accueil.calme')}</p>
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-5 font-titre text-2xl">{t('accueil.commentTitre')}</h2>
        <ul className="grid gap-6 md:grid-cols-3">
          <Regle
            illustration={<Escargot className="h-10 w-16 text-encre-fonce" />}
            titre={t('accueil.regle1Titre')}
            texte={t('accueil.regle1', { vitesse: config.speedMetersPerHour })}
          />
          <Regle
            illustration={<Goutte className="h-10 w-8 text-pluie" />}
            titre={t('accueil.regle2Titre')}
            texte={t('accueil.regle2', { seuil: config.hibernationTempC })}
          />
          <Regle
            illustration={<Feuille className="h-10 w-8 text-sauge" />}
            titre={t('accueil.regle3Titre')}
            texte={t('accueil.regle3', { pourcent: Math.round(config.lostProbability * 100) })}
          />
        </ul>
      </section>
    </div>
  );
}
