import { Escargot } from './Illustrations';
import SelecteurLangue from './SelecteurLangue';
import { useI18n } from '../lib/i18n';

const ONGLETS = ['accueil', 'ecrire', 'boite', 'carnet'];
const CLES = { accueil: 'nav.jardin', ecrire: 'nav.ecrire', boite: 'nav.boite', carnet: 'nav.carnet' };

export default function Entete({ user, vue, onVue, onSortir, enTransit }) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-encre/15 bg-papier/85 backdrop-blur-[2px]">
      {/* Deux rangées serrées sur téléphone, une seule dès que l'écran suit :
          l'ordre des blocs change, pas leur présence. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-2.5 sm:px-6 sm:py-3">
        <button
          onClick={() => onVue('accueil')}
          className="order-1 flex items-center gap-2.5 text-left"
          aria-label={t('nav.retour')}
        >
          <Escargot className="h-7 w-11 text-encre-fonce sm:h-8 sm:w-12" title="" />
          <span className="font-main text-2xl leading-none text-encre-fonce sm:text-3xl">
            Escargot <span className="text-sauge-fonce">Postal</span>
          </span>
        </button>

        <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 sm:order-2 sm:mx-0 sm:w-auto sm:flex-1 sm:overflow-visible sm:px-0">
          {ONGLETS.map((id) => (
            <button
              key={id}
              onClick={() => onVue(id)}
              className={`relative shrink-0 whitespace-nowrap rounded-caillou px-3 py-1.5 font-titre text-[0.9rem] sm:px-3.5 sm:text-[0.95rem] ${
                vue === id
                  ? 'bg-sauge-brume text-encre-fonce shadow-creuse'
                  : 'text-encre-pale hover:bg-sauge-brume/50 hover:text-encre'
              }`}
            >
              {t(CLES[id])}
              {id === 'boite' && enTransit > 0 && (
                <span className="ml-1.5 font-main text-base text-sauge-fonce">{enTransit}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:gap-3">
          <SelecteurLangue />
          <span className="etiquette hidden sm:inline">
            {user.pseudo}
            {user.city ? ` — ${user.city}` : ''}
          </span>
          <button onClick={onSortir} className="bouton-nu whitespace-nowrap text-base">
            <span className="sm:hidden">{t('nav.fermerCourt')}</span>
            <span className="hidden sm:inline">{t('nav.fermer')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
