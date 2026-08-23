import { useState } from 'react';
import { api, writeToken } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { Escargot, Bruine, Feuille } from './Illustrations';
import SelecteurLangue from './SelecteurLangue';
import Compteur from './Compteur';

export default function Portail({ cities, stats, config, onEntre }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('ouvrir');
  const [pseudo, setPseudo] = useState('');
  const [pin, setPin] = useState('');
  const [ville, setVille] = useState('Paris');
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const nouvelle = mode === 'ouvrir';
  const vitesse = config?.speedMetersPerHour ?? 48;

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    try {
      const user = nouvelle
        ? await api.register({ pseudo, pin, city: ville })
        : await api.login({ pseudo, pin });
      writeToken(user.token);
      onEntre(user);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setOccupe(false);
    }
  }

  // L'accroche met la vitesse en gras au milieu de la phrase : on découpe
  // la traduction sur ce fragment plutôt que d'y injecter du balisage.
  const accroche = t('portail.accroche', { vitesse });
  const gras = t('portail.accrocheGras', { vitesse });
  const [avant, apres] = accroche.includes(gras) ? accroche.split(gras) : [accroche, ''];

  return (
    <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.15fr_1fr]">
      <Bruine className="opacity-70" />

      <SelecteurLangue className="absolute right-6 top-6 z-10" />

      <div className="relative">
        <p className="etiquette mb-2 flex items-center gap-2">
          <Feuille className="h-5 w-4 text-sauge" />
          {t('portail.enseigne')}
        </p>
        <h1 className="font-main text-[4.4rem] leading-[0.92] text-encre-fonce sm:text-[5.6rem]">
          Escargot
          <br />
          <span className="text-sauge-fonce">Postal</span>
        </h1>

        <Escargot className="my-6 h-24 w-36 animate-derive text-encre-fonce" />

        <p className="max-w-lg font-corps text-[1.08rem] leading-[1.9] text-encre">
          {avant}
          <strong className="font-semibold text-encre-fonce">{gras}</strong>
          {apres}
        </p>
        <p className="mt-3 max-w-lg font-corps italic leading-[1.9] text-encre-pale">
          {t('portail.murmure')}
        </p>

        <div className="mt-10 max-w-md">
          <Compteur stats={stats} />
        </div>
      </div>

      <form onSubmit={envoyer} className="feuille relative rounded-feuille px-8 py-9 sm:px-10">
        <div className="mb-7 flex gap-2">
          {[
            ['ouvrir', t('portail.ouvrir')],
            ['retrouver', t('portail.retrouver')],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setErreur(null);
              }}
              className={`rounded-caillou px-4 py-2 font-main text-lg ${
                mode === id
                  ? 'bg-sauge-brume text-encre-fonce shadow-creuse'
                  : 'text-encre-pale hover:text-encre'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="etiquette">{t('portail.pseudo')}</span>
          <input
            className="champ mt-1.5"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder={t('portail.pseudoExemple')}
            autoComplete="username"
            maxLength={24}
            required
          />
        </label>

        <label className="mt-5 block">
          <span className="etiquette">{t('portail.code')}</span>
          <input
            className="champ mt-1.5 font-titre tracking-[0.6em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            inputMode="numeric"
            autoComplete={nouvelle ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {nouvelle && (
          <label className="mt-5 block animate-eclot">
            <span className="etiquette">{t('portail.ou')}</span>
            <select className="champ mt-1.5" value={ville} onChange={(e) => setVille(e.target.value)}>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="etiquette mt-1.5 block text-encre-pale/90">{t('portail.ouAide')}</span>
          </label>
        )}

        {erreur && (
          <p className="mt-5 rounded-galet border border-corail-pale bg-corail-pale/30 px-4 py-3 font-corps text-[0.92rem] text-corail-fonce">
            {erreur}
          </p>
        )}

        <button className="bouton mt-7 w-full" disabled={occupe || pin.length !== 4 || !pseudo.trim()}>
          {occupe ? t('portail.patiente') : nouvelle ? t('portail.valider') : t('portail.entrer')}
        </button>

        <p className="etiquette mt-4 text-center">{t('portail.rassurance')}</p>
      </form>
    </main>
  );
}
