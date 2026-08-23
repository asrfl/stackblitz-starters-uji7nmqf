import { Escargot } from './Illustrations';

const ONGLETS = [
  ['accueil', 'Le jardin'],
  ['ecrire', 'Écrire'],
  ['boite', 'Ma boîte'],
  ['carnet', 'Carnet'],
];

export default function Entete({ user, vue, onVue, onSortir, enTransit }) {
  return (
    <header className="sticky top-0 z-40 border-b border-encre/15 bg-papier/85 backdrop-blur-[2px]">
      {/* Deux rangees serrees sur telephone, une seule des que l'ecran suit :
          l'ordre des blocs change, pas leur presence. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-2.5 sm:px-6 sm:py-3">
        <button
          onClick={() => onVue('accueil')}
          className="order-1 flex items-center gap-2.5 text-left"
          aria-label="Retour au jardin"
        >
          <Escargot className="h-7 w-11 text-encre-fonce sm:h-8 sm:w-12" title="" />
          <span className="font-main text-2xl leading-none text-encre-fonce sm:text-3xl">
            Escargot <span className="text-sauge-fonce">Postal</span>
          </span>
        </button>

        <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 sm:order-2 sm:mx-0 sm:w-auto sm:flex-1 sm:overflow-visible sm:px-0">
          {ONGLETS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onVue(id)}
              className={`relative shrink-0 whitespace-nowrap rounded-caillou px-3 py-1.5 font-titre text-[0.9rem] sm:px-3.5 sm:text-[0.95rem] ${
                vue === id
                  ? 'bg-sauge-brume text-encre-fonce shadow-creuse'
                  : 'text-encre-pale hover:bg-sauge-brume/50 hover:text-encre'
              }`}
            >
              {label}
              {id === 'boite' && enTransit > 0 && (
                <span className="ml-1.5 font-main text-base text-sauge-fonce">{enTransit}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
          <span className="etiquette hidden sm:inline">
            {user.pseudo}
            {user.city ? ` — ${user.city}` : ''}
          </span>
          <button onClick={onSortir} className="bouton-nu text-base">
            fermer la boîte
          </button>
        </div>
      </div>
    </header>
  );
}
