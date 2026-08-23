// Petites illustrations dessinees a la main, en SVG : pas d'icon pack.

/** Spirale d'Archimede : la coquille est construite, pas approximee. */
function spiralPath(cx, cy, tours = 2.4, a = 1.4, b = 2.6) {
  const steps = 140;
  const end = tours * 2 * Math.PI;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * end;
    const r = a + b * t;
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
}

export function Escargot({ className = '', title = 'un escargot', ...rest }) {
  return (
    <svg viewBox="0 0 120 84" className={className} role="img" aria-label={title} {...rest}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* le pied, une longue vague qui s'etire vers l'avant */}
        <path
          d="M10 68 C 12 54, 26 50, 38 52 C 44 53, 48 56, 52 60 C 58 66, 70 70, 84 68"
          fill="rgba(220,145,132,0.22)"
        />
        <path d="M10 68 C 26 74, 62 76, 88 68" />
        {/* le cou et la tete */}
        <path d="M84 68 C 94 66, 100 58, 100 50" />
        <path d="M100 50 C 102 44, 108 42, 112 44" />
        {/* les tentacules */}
        <path d="M104 44 C 106 34, 104 28, 100 23" />
        <path d="M110 46 C 115 38, 116 32, 114 27" />
        <circle cx="99.5" cy="21.5" r="2.6" fill="currentColor" stroke="none" />
        <circle cx="113.7" cy="25.6" r="2.6" fill="currentColor" stroke="none" />
        {/* la coquille */}
        <circle cx="46" cy="34" r="24" fill="rgba(185,205,182,0.35)" />
        <path d={spiralPath(46, 34, 2.35, 1.2, 3.1)} strokeWidth="2" opacity="0.85" />
      </g>
    </svg>
  );
}

export function Feuille({ className = '' }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M24 62 C 24 44, 22 24, 24 4" />
        <path
          d="M24 6 C 40 14, 46 32, 24 50 C 2 32, 8 14, 24 6 Z"
          fill="rgba(107,142,111,0.18)"
        />
        <path d="M24 18 L 34 14 M24 28 L 38 25 M24 38 L 34 37" opacity="0.7" />
        <path d="M24 18 L 14 14 M24 28 L 10 25 M24 38 L 14 37" opacity="0.7" />
      </g>
    </svg>
  );
}

export function Goutte({ className = '' }) {
  return (
    <svg viewBox="0 0 24 34" className={className} aria-hidden="true">
      <path
        d="M12 2 C 18 12, 22 18, 22 23 A 10 10 0 0 1 2 23 C 2 18, 6 12, 12 2 Z"
        fill="rgba(147,169,180,0.35)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8 22 C 8 18, 9 16, 11 13" stroke="rgba(251,247,238,0.85)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Brin({ className = '' }) {
  return (
    <svg viewBox="0 0 90 40" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2 34 C 24 30, 50 20, 88 6" />
        <path d="M22 30 C 22 22, 28 18, 34 18 C 30 24, 28 29, 22 30 Z" fill="rgba(107,142,111,0.2)" />
        <path d="M44 23 C 44 15, 50 11, 57 11 C 52 17, 50 22, 44 23 Z" fill="rgba(107,142,111,0.2)" />
        <path d="M66 15 C 66 8, 72 4, 79 4 C 74 10, 72 14, 66 15 Z" fill="rgba(107,142,111,0.2)" />
      </g>
    </svg>
  );
}

/** Pluie fine de petit matin, en fond de page d'accueil. */
export function Bruine({ className = '' }) {
  // Reparties a la main, avec des retards inegaux : une pluie reguliere
  // aurait l'air d'une animation, pas d'une averse.
  const gouttes = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.7 + (i % 3) * 2.4 + 2) % 100}%`,
    delay: `${((i * 1.37) % 13).toFixed(2)}s`,
    duree: `${(10 + ((i * 3) % 7)).toFixed(1)}s`,
    scale: 0.5 + ((i * 37) % 11) / 16,
  }));
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {gouttes.map((g, i) => (
        <span
          key={i}
          className="absolute top-0 animate-goutte text-pluie"
          style={{
            left: g.left,
            animationDelay: g.delay,
            animationDuration: g.duree,
            transform: `scale(${g.scale})`,
          }}
        >
          <Goutte className="h-4 w-3" />
        </span>
      ))}
    </div>
  );
}
