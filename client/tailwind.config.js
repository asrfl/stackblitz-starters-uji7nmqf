/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Palette entierement redefinie : aucune couleur Tailwind par defaut.
    // Jamais de blanc pur ni de noir pur, tout est teinte et desature.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      papier: {
        DEFAULT: '#F5EFE0', // creme casse, papier ancien
        clair: '#FBF7EE', // page fraiche
        creuse: '#EBE1CD', // creux du papier, fonds imbriques
        ombre: '#DED2BA', // bord de feuille
      },
      encre: {
        DEFAULT: '#7A5C4A', // marron terre cuite, texte courant
        pale: '#A28B79', // legendes
        fonce: '#563E30', // titres
      },
      sauge: {
        DEFAULT: '#6B8E6F', // vert sauge profond, accent principal
        fonce: '#4E6C53',
        pale: '#B9CDB6',
        brume: '#DCE6D6',
      },
      corail: {
        DEFAULT: '#DC9184', // rose poudre, actions
        fonce: '#BE6E60',
        pale: '#F0C6BC',
      },
      pluie: {
        DEFAULT: '#93A9B4', // bleu-gris de petit matin, hibernation
        pale: '#C6D4D9',
        fonce: '#6B838F',
      },
      miel: '#D9A75B', // touche doree, compteur communautaire
    },
    fontFamily: {
      // Manuscrite pour le logo et les annotations en marge.
      main: ['"Caveat"', 'ui-rounded', 'cursive'],
      // Serif expressive pour les titres.
      titre: ['"Playfair Display Variable"', '"Playfair Display"', 'Georgia', 'serif'],
      // Serif chaleureuse et lisible pour le corps.
      corps: ['"Lora"', 'Georgia', 'serif'],
    },
    extend: {
      borderRadius: {
        // Coins volontairement irreguliers : rayons elliptiques asymetriques,
        // pour un contour trace a la main plutot qu'au compas.
        feuille: '58px 16px 48px 20px / 22px 52px 18px 44px',
        galet: '32px 12px 26px 18px / 16px 30px 14px 28px',
        petale: '14px 62px 18px 54px / 48px 20px 56px 22px',
        caillou: '16px 8px 14px 10px / 10px 16px 9px 15px',
        goutte: '60% 40% 55% 45% / 45% 55% 42% 58%',
      },
      boxShadow: {
        // Ombres diffuses, jamais dures : la feuille est juste soulevee.
        feuille: '0 22px 44px -30px rgba(86,62,48,0.55), 0 4px 12px -8px rgba(86,62,48,0.25)',
        posee: '0 10px 26px -20px rgba(86,62,48,0.6)',
        souleve: '0 30px 60px -34px rgba(86,62,48,0.6), 0 6px 16px -10px rgba(86,62,48,0.22)',
        creuse: 'inset 0 2px 8px -4px rgba(86,62,48,0.35)',
      },
      transitionDuration: {
        // Rien ne va vite ici.
        DEFAULT: '450ms',
        lent: '600ms',
        escargot: '900ms',
      },
      transitionTimingFunction: {
        douce: 'cubic-bezier(0.4, 0, 0.2, 1)',
        rampe: 'cubic-bezier(0.33, 0.02, 0.2, 1)',
      },
      keyframes: {
        respire: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-5px) rotate(1deg)' },
        },
        derive: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(4px, -6px)' },
        },
        luisance: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.95' },
        },
        deplie: {
          '0%': { transform: 'perspective(900px) rotateX(-88deg)', opacity: '0' },
          '55%': { opacity: '1' },
          '100%': { transform: 'perspective(900px) rotateX(0deg)', opacity: '1' },
        },
        eclot: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        goutte: {
          '0%': { transform: 'translateY(-6vh)', opacity: '0' },
          '12%': { opacity: '0.55' },
          '78%': { opacity: '0.35' },
          '100%': { transform: 'translateY(102vh)', opacity: '0' },
        },
      },
      animation: {
        respire: 'respire 7s ease-in-out infinite',
        derive: 'derive 11s ease-in-out infinite',
        luisance: 'luisance 5s ease-in-out infinite',
        deplie: 'deplie 900ms cubic-bezier(0.33, 0.02, 0.2, 1) forwards',
        eclot: 'eclot 600ms cubic-bezier(0.4, 0, 0.2, 1) both',
        goutte: 'goutte 13s cubic-bezier(0.5, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
