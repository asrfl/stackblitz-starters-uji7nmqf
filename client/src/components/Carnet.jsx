import { useState } from 'react';
import { api } from '../lib/api';
import { Feuille } from './Illustrations';

export default function Carnet({ contacts, onChange, user, cities, onVille }) {
  const [pseudo, setPseudo] = useState('');
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);

  async function ajouter(e) {
    e.preventDefault();
    setErreur(null);
    setOccupe(true);
    try {
      await api.addContact(pseudo.trim());
      setPseudo('');
      onChange();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setOccupe(false);
    }
  }

  async function retirer(id) {
    await api.removeContact(id);
    onChange();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1.2fr_1fr]">
      <section className="feuille rounded-feuille px-8 py-8">
        <h2 className="font-titre text-2xl">Carnet d’adresses</h2>
        <p className="etiquette mt-1">
          Les gens à qui vous pouvez confier un escargot.
        </p>

        <form onSubmit={ajouter} className="mt-6 flex flex-wrap gap-3">
          <input
            className="champ flex-1"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo de la personne"
            maxLength={24}
            required
          />
          <button className="bouton-sauge" disabled={occupe || !pseudo.trim()}>
            Ajouter
          </button>
        </form>

        {erreur && (
          <p className="mt-4 rounded-galet border border-corail-pale bg-corail-pale/30 px-4 py-2.5 font-corps text-[0.9rem] text-corail-fonce">
            {erreur}
          </p>
        )}

        <ul className="mt-7 space-y-3">
          {contacts.length === 0 && (
            <li className="feuille-creuse rounded-galet px-5 py-6 text-center">
              <Feuille className="mx-auto h-8 w-6 text-sauge opacity-60" />
              <p className="etiquette mt-2">
                Carnet vide. Ajoutez le pseudo d’une personne déjà inscrite.
              </p>
            </li>
          )}
          {contacts.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-galet border border-encre/15 bg-papier/70 px-5 py-3.5 animate-eclot"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span>
                <span className="block font-titre text-lg text-encre-fonce">{c.pseudo}</span>
                <span className="etiquette">{c.city || 'ville inconnue'}</span>
              </span>
              <button onClick={() => retirer(c.id)} className="bouton-nu text-base text-encre-pale">
                retirer
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="feuille h-fit rounded-petale px-8 py-8">
        <h2 className="font-titre text-xl">Votre adresse</h2>
        <p className="etiquette mt-1">Le point de départ de vos escargots.</p>
        <select
          className="champ mt-5"
          value={user.city || ''}
          onChange={(e) => onVille(e.target.value)}
        >
          <option value="" disabled>
            Choisir une ville
          </option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-5 font-corps text-[0.92rem] italic leading-relaxed text-encre-pale">
          Vous pouvez déménager quand vous voulez : les escargots déjà partis
          gardent le trajet pour lequel ils se sont engagés.
        </p>
      </section>
    </div>
  );
}
