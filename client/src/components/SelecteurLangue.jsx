import { useI18n } from '../lib/i18n';

/**
 * Deux ou trois lettres tracées à la main, pas un menu déroulant : le choix
 * de langue doit rester aussi discret que le reste du mobilier.
 */
export default function SelecteurLangue({ className = '' }) {
  const { langue, setLangue, langues, t } = useI18n();

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role="group"
      aria-label={t('commun.langue')}
    >
      {langues.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLangue(l.code)}
          aria-pressed={l.code === langue}
          title={l.nom}
          className={`rounded-caillou px-2 py-1 font-main text-base leading-none ${
            l.code === langue
              ? 'bg-sauge-brume text-encre-fonce shadow-creuse'
              : 'text-encre-pale hover:bg-sauge-brume/50 hover:text-encre'
          }`}
        >
          {l.etiquette}
        </button>
      ))}
    </div>
  );
}
