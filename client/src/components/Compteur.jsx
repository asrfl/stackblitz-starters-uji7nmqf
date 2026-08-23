import { useEffect, useRef, useState } from 'react';
import { formatCounter } from '../lib/format';
import { Brin } from './Illustrations';

/** Compte doucement de l'ancienne valeur vers la nouvelle : rien ne saute. */
function useNombreQuiMonte(cible, duree = 1800) {
  const [valeur, setValeur] = useState(cible);
  const depart = useRef(cible);
  const raf = useRef(0);

  useEffect(() => {
    const de = depart.current;
    if (de === cible) return;
    const t0 = performance.now();
    const avance = (t) => {
      const k = Math.min(1, (t - t0) / duree);
      const doux = 1 - Math.pow(1 - k, 3); // ease-out : on arrive en douceur
      setValeur(de + (cible - de) * doux);
      if (k < 1) raf.current = requestAnimationFrame(avance);
      else depart.current = cible;
    };
    raf.current = requestAnimationFrame(avance);
    return () => cancelAnimationFrame(raf.current);
  }, [cible, duree]);

  return valeur;
}

export default function Compteur({ stats }) {
  const total = useNombreQuiMonte(stats?.totalCrawledM ?? 0);
  const { value, unit } = formatCounter(total);

  const lignes = [
    ['en chemin', stats?.enTransit ?? 0, 'text-sauge-fonce'],
    ['arrivés', stats?.arrives ?? 0, 'text-corail-fonce'],
    ['en hibernation', stats?.hibernants ?? 0, 'text-pluie-fonce'],
    ['partis voir ailleurs', stats?.perdus ?? 0, 'text-encre-pale'],
  ];

  return (
    <section className="feuille relative overflow-hidden rounded-petale px-8 py-9">
      <Brin className="absolute -right-3 top-4 h-12 w-28 rotate-12 text-sauge opacity-45" />
      <Brin className="absolute -left-6 bottom-3 h-10 w-24 -rotate-6 scale-x-[-1] text-sauge opacity-30" />

      <p className="etiquette">Depuis l’ouverture du bureau de poste</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <span
          className="font-titre text-[3.4rem] leading-none text-encre-fonce"
          style={{ textShadow: '0 2px 0 rgba(251,247,238,0.9)' }}
        >
          {value}
        </span>
        <span className="font-main text-2xl text-miel">{unit}</span>
      </p>
      <p className="mt-2 font-corps text-[0.95rem] italic leading-relaxed text-encre">
        parcourus par tous nos escargots réunis, un centimètre après l’autre.
      </p>

      <span className="filet my-5" />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {lignes.map(([label, n, couleur]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="etiquette">{label}</dt>
            <dd className={`font-titre text-xl ${couleur}`}>{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
