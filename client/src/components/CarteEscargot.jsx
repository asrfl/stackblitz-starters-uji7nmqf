import { useId, useMemo } from 'react';
import { FRANCE_PATH, CORSE_PATH, VIEW, project, lerp, headingDeg } from '../lib/geo';
import { Escargot } from './Illustrations';

/**
 * Un escargot ne marche jamais droit. La position « officielle » reste une
 * interpolation linéaire dans le temps ; on la fait juste serpenter autour
 * de la ligne, et la trace comme le marqueur suivent exactement ce même
 * chemin — sinon la bave ne collerait plus à la bête.
 */
function makeRoute(a, b, seed, echelle) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // normale unitaire au trajet
  const ny = dx / len;
  const amplitude = Math.min(24 * echelle, len * 0.08);
  const freq = 2 + (seed % 3);
  const phase = (seed % 7) * 0.9;

  return (t) => {
    const k = Math.max(0, Math.min(1, t));
    // l'enveloppe sin(pi*t) ramène la courbe exactement sur les deux villes
    const wobble = Math.sin(k * freq * 2 * Math.PI + phase) * Math.sin(Math.PI * k) * amplitude;
    return { x: lerp(a.x, b.x, k) + nx * wobble, y: lerp(a.y, b.y, k) + ny * wobble };
  };
}

function pathBetween(route, from, to, steps = 64) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = route(from + ((to - from) * i) / steps);
    d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
  }
  return d.trim();
}

const RATIO = 1.6;

/**
 * Cadrage : on zoome sur le trajet plutôt que d'afficher toute la France,
 * sinon un Marseille - Aix tient dans un timbre-poste. Le contour du pays
 * reste dessiné autour, pour garder le repère géographique.
 */
function cadrer(a, b) {
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y);

  let w = Math.max(len * 1.9, 260);
  let h = w / RATIO;
  const hMin = Math.abs(b.y - a.y) * 1.9 + 70;
  if (h < hMin) {
    h = hMin;
    w = Math.max(w, h * RATIO);
  }
  const wMin = Math.abs(b.x - a.x) * 1.9 + 70;
  if (w < wMin) {
    w = wMin;
    h = Math.max(h, w / RATIO);
  }
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export default function CarteEscargot({ message, cities = [], className = '' }) {
  const uid = useId().replace(/:/g, '');
  const perdu = message.status === 'lost';
  const arrive = message.status === 'delivered';

  const { depart, arrivee, box, z, traversee, restant, ici, cap } = useMemo(() => {
    const depart = project(message.from);
    const arrivee = project(message.to);
    const box = cadrer(depart, arrivee);
    // z : facteur de zoom. Tout ce qui doit garder une taille constante à
    // l'écran (traits, libellés, escargot) est multiplié par z.
    const z = box.w / VIEW.w;
    const route = makeRoute(depart, arrivee, message.id, z);
    const t = message.progress;
    // Arrive, l'escargot se gare a cote de la boite aux lettres plutot que
    // dessus : sur un trajet court il la recouvrait entierement.
    let ici = route(t);
    if (t >= 0.99) {
      const dx = arrivee.x - depart.x;
      const dy = arrivee.y - depart.y;
      const n = Math.hypot(dx, dy) || 1;
      ici = { x: ici.x - (dy / n) * 15 * z, y: ici.y + (dx / n) * 15 * z };
    }
    // on regarde un peu plus loin sur la courbe pour orienter la bête
    const cap = headingDeg(route(Math.max(0, t - 0.02)), route(Math.min(1, t + 0.02)));
    return {
      depart,
      arrivee,
      box,
      z,
      ici,
      cap,
      traversee: pathBetween(route, 0, Math.max(t, 0.0005)),
      restant: pathBetween(route, t, 1),
    };
  }, [message.from, message.to, message.id, message.progress]);

  // Reperes : les villes visibles dans le cadre, sauf les deux extremites du
  // trajet qui ont deja leur etiquette. Elles donnent l'echelle et evitent
  // qu'un fort zoom ne montre qu'une tache verte sans nom.
  const reperes = useMemo(() => {
    const marge = box.w * 0.04;
    const dansLeCadre = ({ p }) =>
      p.x > box.x + marge &&
      p.x < box.x + box.w - marge &&
      p.y > box.y + marge &&
      p.y < box.y + box.h - marge;

    const candidats = cities
      .filter((c) => c.name !== message.from.city && c.name !== message.to.city)
      .map((c) => ({ name: c.name, p: project(c) }))
      .filter(dansLeCadre);

    // Sur un trajet qui traverse la France, les cinquante villes se marchent
    // dessus. On garde les plus grandes (la table est classee par taille) en
    // exigeant un ecart minimal entre deux etiquettes.
    const ecartMin = box.w * 0.075;
    const gardes = [];
    for (const c of candidats) {
      const colle = gardes.some(
        (g) => Math.hypot(g.p.x - c.p.x, g.p.y - c.p.y) < ecartMin
      );
      const surUneExtremite =
        Math.hypot(depart.x - c.p.x, depart.y - c.p.y) < ecartMin * 1.3 ||
        Math.hypot(arrivee.x - c.p.x, arrivee.y - c.p.y) < ecartMin * 1.3;
      if (!colle && !surUneExtremite) gardes.push(c);
    }
    return gardes;
  }, [cities, box, depart, arrivee, message.from.city, message.to.city]);

  const retourne = Math.abs(cap) > 90;
  // Un escargot reste a peu pres d'aplomb : on ne garde du cap qu'une
  // inclinaison, sinon il grimpe a la verticale sur un Marseille - Lille.
  const inclinaison = Math.max(-22, Math.min(22, retourne ? cap + 180 : cap));

  // Une etiquette poussee vers l'exterieur peut sortir du cadre : on la
  // ramene dedans en tenant compte de sa largeur approximative.
  const dansLeCadre = (x, y, texte, taille, ancre = 'middle') => {
    const large = texte.length * 0.29 * taille;
    const demi = (ancre === 'middle' ? large : large * 2) / 2 + 5 * z;
    const gauche = ancre === 'start' ? box.x + 5 * z : box.x + demi;
    const droite = ancre === 'start' ? box.x + box.w - large - 5 * z : box.x + box.w - demi;
    const cx = Math.min(Math.max(x, gauche), droite);
    // Si le recadrage a ramene l'etiquette sur son propre marqueur, on la
    // descend d'une ligne plutot que de la laisser se superposer.
    const decale = Math.abs(cx - x) > demi * 0.4 ? taille * 0.9 : 0;
    return {
      x: cx,
      y: Math.min(Math.max(y + decale, box.y + taille), box.y + box.h - taille * 0.6),
    };
  };

  // Ecartement des deux etiquettes de ville, chacune fuyant l'autre bout,
  // et perpendiculaire au trajet : l'escargot se gare d'un cote de la boite
  // aux lettres, la mention « arrive ! » se pose de l'autre.
  const { ecart, perp } = (() => {
    const dx = depart.x - arrivee.x;
    const dy = depart.y - arrivee.y;
    const n = Math.hypot(dx, dy) || 1;
    return {
      ecart: { x: (dx / n) * 20 * z, y: (dy / n) * 20 * z + 6 * z },
      perp: { x: dy / n, y: -dx / n },
    };
  })();

  return (
    <svg
      viewBox={`${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}`}
      className={className}
      role="img"
      aria-label={`Trajet de ${message.from.city} à ${message.to.city}, ${Math.round(
        message.progress * 100
      )} pour cent parcourus`}
    >
      <defs>
        {/* La bave : nacrée, translucide, elle s'estompe vers le point de départ. */}
        <linearGradient
          id={`bave-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={depart.x}
          y1={depart.y}
          x2={ici.x}
          y2={ici.y}
        >
          <stop offset="0%" stopColor="#B9CDB6" stopOpacity="0" />
          <stop offset="26%" stopColor="#C6D4D9" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#DCE6D6" stopOpacity="0.64" />
          <stop offset="100%" stopColor="#FBF7EE" stopOpacity="0.95" />
        </linearGradient>

        {/* Reflet plus clair : ce qui donne le côté humide et brillant. */}
        <linearGradient
          id={`reflet-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={depart.x}
          y1={depart.y}
          x2={ici.x}
          y2={ici.y}
        >
          <stop offset="0%" stopColor="#FBF7EE" stopOpacity="0" />
          <stop offset="78%" stopColor="#FBF7EE" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFDF8" stopOpacity="0.92" />
        </linearGradient>

        <filter id={`halo-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={4.5 * z} />
        </filter>
        <filter id={`flou-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.6 * z} />
        </filter>

        {/* Grain d'aquarelle sur le fond de carte. */}
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="bruit" />
          <feColorMatrix in="bruit" type="saturate" values="0" result="gris" />
          <feComposite in="gris" in2="SourceGraphic" operator="in" result="masque" />
          <feBlend in="SourceGraphic" in2="masque" mode="multiply" />
        </filter>
      </defs>

      {/* ---- fond de carte : la France au lavis, cernée au crayon ---- */}
      <g>
        <path d={FRANCE_PATH} fill="rgba(185,205,182,0.32)" filter={`url(#grain-${uid})`} />
        <path
          d={FRANCE_PATH}
          fill="none"
          stroke="rgba(122,92,74,0.28)"
          strokeWidth={3.2 * z}
          filter={`url(#flou-${uid})`}
        />
        <path
          d={FRANCE_PATH}
          fill="none"
          stroke="rgba(86,62,48,0.55)"
          strokeWidth={1.5 * z}
          strokeLinejoin="round"
        />
        <path d={CORSE_PATH} fill="rgba(185,205,182,0.32)" filter={`url(#grain-${uid})`} />
        <path d={CORSE_PATH} fill="none" stroke="rgba(86,62,48,0.5)" strokeWidth={1.4 * z} />
      </g>

      {/* ---- les villes voisines, notees au crayon ---- */}
      <g>
        {reperes.map(({ name, p }) => (
          <g key={name}>
            <circle cx={p.x} cy={p.y} r={2 * z} fill="rgba(122,92,74,0.4)" />
            <text
              x={p.x + 4.5 * z}
              y={p.y + 4.5 * z}
              className="font-main"
              fontSize={13 * z}
              fill="rgba(122,92,74,0.72)"
            >
              {name}
            </text>
          </g>
        ))}
      </g>

      {/* ---- ce qu'il reste à ramper ---- */}
      <path
        d={restant}
        fill="none"
        stroke="rgba(122,92,74,0.45)"
        strokeWidth={1.7 * z}
        strokeDasharray={`${2 * z} ${9 * z}`}
        strokeLinecap="round"
      />

      {/* ---- la trace baveuse : halo, corps, reflet ---- */}
      <g>
        <path
          d={traversee}
          fill="none"
          stroke={`url(#bave-${uid})`}
          strokeWidth={15 * z}
          strokeLinecap="round"
          filter={`url(#halo-${uid})`}
          opacity={perdu ? 0.4 : 0.85}
        />
        <path
          d={traversee}
          fill="none"
          stroke={`url(#bave-${uid})`}
          strokeWidth={7.5 * z}
          strokeLinecap="round"
          opacity={perdu ? 0.45 : 0.95}
        />
        <path
          d={traversee}
          fill="none"
          stroke={`url(#reflet-${uid})`}
          strokeWidth={2.2 * z}
          strokeLinecap="round"
          className="animate-luisance"
        />
      </g>

      {/* ---- ville de départ ---- */}
      <g>
        <circle cx={depart.x} cy={depart.y} r={7 * z} fill="rgba(107,142,111,0.25)" />
        <circle cx={depart.x} cy={depart.y} r={3.6 * z} fill="#4E6C53" />
        <text
          {...dansLeCadre(depart.x + ecart.x, depart.y + ecart.y, message.from.city, 20 * z)}
          textAnchor="middle"
          className="font-main"
          fontSize={20 * z}
          fill="#563E30"
        >
          {message.from.city}
        </text>
      </g>

      {/* ---- l'escargot, là où il en est ---- */}
      <g
        transform={`translate(${ici.x} ${ici.y})`}
        className={message.hibernating ? '' : 'animate-respire'}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <ellipse rx={17 * z} ry={9 * z} fill="rgba(251,247,238,0.6)" filter={`url(#halo-${uid})`} />
        <g transform={`rotate(${inclinaison}) scale(${retourne ? -z : z}, ${z})`}>
          <Escargot className="text-encre-fonce" title="" x={-21} y={-16} width={42} height={30} />
        </g>
        {message.hibernating && (
          <text x={15 * z} y={-14 * z} fontSize={18 * z} className="font-main" fill="#6B838F">
            zzz
          </text>
        )}
        {perdu && (
          <text x={16 * z} y={-13 * z} fontSize={17 * z} className="font-main" fill="#BE6E60">
            hop !
          </text>
        )}
      </g>

      {/* ---- boîte aux lettres d'arrivée (au-dessus de l'escargot) ---- */}
      <g>
        <circle cx={arrivee.x} cy={arrivee.y} r={9 * z} fill="rgba(220,145,132,0.28)" />
        <g transform={`translate(${arrivee.x - 8 * z} ${arrivee.y - 6 * z}) scale(${z})`}>
          <rect width="16" height="12" rx="2.2" fill="#FBF7EE" stroke="#BE6E60" strokeWidth="1.5" />
          <path
            d="M0.8 1 L 8 7 L 15.2 1"
            fill="none"
            stroke="#BE6E60"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
        <text
          {...dansLeCadre(arrivee.x - ecart.x, arrivee.y - ecart.y + 12 * z, message.to.city, 20 * z)}
          textAnchor="middle"
          className="font-main"
          fontSize={20 * z}
          fill="#563E30"
        >
          {message.to.city}
        </text>
        {arrive && (
          <text
            {...dansLeCadre(
              arrivee.x - perp.x * 34 * z,
              arrivee.y - perp.y * 34 * z + 7 * z,
              'arrivé !',
              21 * z
            )}
            textAnchor="middle"
            fontSize={21 * z}
            className="font-main"
            fill="#4E6C53"
          >
            arrivé !
          </text>
        )}
      </g>
    </svg>
  );
}
