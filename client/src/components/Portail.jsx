import { useState } from 'react';
import { api, writeToken } from '../lib/api';
import { Escargot, Bruine, Feuille } from './Illustrations';
import Compteur from './Compteur';

export default function Portail({ cities, stats, onEntre }) {
  const [mode, setMode] = useState('ouvrir');
  const [pseudo, setPseudo] = useState('');
  const [pin, setPin] = useState('');
  const [ville, setVille] = useState('Paris');
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const nouvelle = mode === 'ouvrir';

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

  return (
    <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.15fr_1fr]">
      <Bruine className="opacity-70" />

      <div className="relative">
        <p className="etiquette mb-2 flex items-center gap-2">
          <Feuille className="h-5 w-4 text-sauge" />
          bureau de poste du jardin, ouvert par tous les temps
        </p>
        <h1 className="font-main text-[4.4rem] leading-[0.92] text-encre-fonce sm:text-[5.6rem]">
          Escargot
          <br />
          <span className="text-sauge-fonce">Postal</span>
        </h1>

        <Escargot className="my-6 h-24 w-36 animate-derive text-encre-fonce" />

        <p className="max-w-lg font-corps text-[1.08rem] leading-[1.9] text-encre">
          Vos mots voyagent à <strong className="font-semibold text-encre-fonce">48 mètres par heure</strong>,
          la vitesse honnête d’un escargot de jardin. Ils traversent la France à leur
          rythme, s’arrêtent quand il gèle, et arrivent quand ils arrivent.
        </p>
        <p className="mt-3 max-w-lg font-corps italic leading-[1.9] text-encre-pale">
          Écrivez le matin, relisez-vous à l’automne.
        </p>

        <div className="mt-10 max-w-md">
          <Compteur stats={stats} />
        </div>
      </div>

      <form onSubmit={envoyer} className="feuille relative rounded-feuille px-8 py-9 sm:px-10">
        <div className="mb-7 flex gap-2">
          {[
            ['ouvrir', 'Ouvrir une boîte'],
            ['retrouver', 'Retrouver la mienne'],
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
          <span className="etiquette">Votre pseudo</span>
          <input
            className="champ mt-1.5"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Colimacon"
            autoComplete="username"
            maxLength={24}
            required
          />
        </label>

        <label className="mt-5 block">
          <span className="etiquette">Code à 4 chiffres</span>
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
            <span className="etiquette">D’où écrivez-vous ?</span>
            <select className="champ mt-1.5" value={ville} onChange={(e) => setVille(e.target.value)}>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="etiquette mt-1.5 block text-encre-pale/90">
              Sert à calculer la distance que vos escargots devront ramper.
            </span>
          </label>
        )}

        {erreur && (
          <p className="mt-5 rounded-galet border border-corail-pale bg-corail-pale/30 px-4 py-3 font-corps text-[0.92rem] text-corail-fonce">
            {erreur}
          </p>
        )}

        <button className="bouton mt-7 w-full" disabled={occupe || pin.length !== 4 || !pseudo.trim()}>
          {occupe ? 'un instant…' : nouvelle ? 'Ouvrir ma boîte aux lettres' : 'Entrer'}
        </button>

        <p className="etiquette mt-4 text-center">
          Pas de mot de passe compliqué, pas de courriel. Juste un nom et quatre chiffres.
        </p>
      </form>
    </main>
  );
}
