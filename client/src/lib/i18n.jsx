import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Une langue = une entrée ici et un bloc dans DICTIONNAIRES. Rien d'autre à
 * toucher : le sélecteur, l'attribut lang et les formats suivent.
 */
export const LANGUES = [
  { code: 'fr', etiquette: 'FR', nom: 'Français', intl: 'fr-FR' },
  { code: 'en', etiquette: 'EN', nom: 'English', intl: 'en-GB' },
];

export const LANGUE_PAR_DEFAUT = 'fr';
const CLE_STOCKAGE = 'escargot-postal:langue';

const DICTIONNAIRES = {
  fr: {
    commun: {
      chargement: 'on ouvre le bureau de poste…',
      choisirVille: 'Choisir une ville',
      langue: 'Langue',
      pied: 'Escargot Postal — {vitesse} m/h, par tous les temps. Météo : {source}.',
      meteoSimulee: 'simulée',
    },
    nav: {
      jardin: 'Le jardin',
      ecrire: 'Écrire',
      boite: 'Ma boîte',
      carnet: 'Carnet',
      retour: 'Retour au jardin',
      fermer: 'fermer la boîte',
      fermerCourt: 'fermer',
    },
    portail: {
      enseigne: 'bureau de poste du jardin, ouvert par tous les temps',
      accroche:
        'Vos mots voyagent à {vitesse} mètres par heure, la vitesse honnête d’un escargot de jardin. Ils traversent la France à leur rythme, s’arrêtent quand il gèle, et arrivent quand ils arrivent.',
      accrocheGras: '{vitesse} mètres par heure',
      murmure: 'Écrivez le matin, relisez-vous à l’automne.',
      ouvrir: 'Ouvrir une boîte',
      retrouver: 'Retrouver la mienne',
      pseudo: 'Votre pseudo',
      pseudoExemple: 'Colimaçon',
      code: 'Code à 4 chiffres',
      ou: 'D’où écrivez-vous ?',
      ouAide: 'Sert à calculer la distance que vos escargots devront ramper.',
      patiente: 'un instant…',
      valider: 'Ouvrir ma boîte aux lettres',
      entrer: 'Entrer',
      rassurance: 'Pas de mot de passe compliqué, pas de courriel. Juste un nom et quatre chiffres.',
    },
    accueil: {
      salut: 'Bonjour {pseudo}, il bruine sur le jardin.',
      titre: 'Vos mots avancent à {vitesse} mètres par heure.',
      chapeau:
        'C’est peu. C’est exactement la vitesse d’un escargot de jardin qui ne se presse pas, et c’est tout l’intérêt : le temps de l’attente fait partie du message.',
      confier: 'Confier un message',
      voirBoite: 'Voir ma boîte',
      vedette: 'Le plus avancé de vos escargots',
      aucun: 'Aucun escargot sur la route',
      calme: 'Le jardin est calme. Confiez un message pour animer la carte.',
      resume: '{depart} → {arrivee} · {distance} parcourus · {reste}',
      resumeHibernation: 'en hibernation',
      resumeReste: 'encore {duree}',
      commentTitre: 'Comment ça marche, au juste',
      regle1Titre: 'Une vitesse honnête',
      regle1:
        '{vitesse} mètres par heure, jamais plus. Sur la vraie distance, Paris — Marseille demanderait un an et demi : les échelles réduites replient la carte sans jamais presser la bête.',
      regle2Titre: 'Il hiberne au froid',
      regle2:
        'Sous {seuil} °C sur son trajet, l’escargot s’enroule et attend. La sieste suspend le compteur : elle rallonge l’arrivée, elle ne raccourcit pas la route.',
      regle3Titre: 'Parfois il s’en va',
      regle3:
        '{pourcent} escargots sur cent quittent la route en chemin, sans prévenir. Le message ne sera jamais remis. C’est le risque du courrier vivant.',
    },
    compteur: {
      depuis: 'Depuis l’ouverture du bureau de poste',
      legende: 'parcourus par tous nos escargots réunis, un centimètre après l’autre.',
      enChemin: 'en chemin',
      arrives: 'arrivés',
      hibernation: 'en hibernation',
      perdus: 'partis voir ailleurs',
    },
    composer: {
      videTitre: 'Personne à qui écrire',
      videTexte:
        'Ajoutez d’abord quelqu’un dans votre carnet d’adresses. Un escargot ne part jamais à l’aveugle.',
      titre: 'Confier un message',
      sousTitre: 'Écrivez, l’escargot fera le reste. Lentement.',
      pour: 'Pour',
      message: 'Votre message',
      restants: '{n} caractères restants',
      exemple: 'Il pleut sur le jardin, les limaces ont mangé les salades. Je pense à toi.',
      envoiEnCours: 'l’escargot s’échauffe…',
      envoyer: 'Confier à un escargot',
      itineraire: 'L’itinéraire',
      depart: 'Départ',
      arrivee: 'Arrivée',
      adresseConnue: 'Adresse connue de {pseudo}.',
      echelleTitre: 'L’échelle du voyage',
      echelleAide:
        'L’escargot garde toujours ses {vitesse} m/h. C’est la carte qu’on replie, pas la bête qu’on presse.',
      apercuTitre: 'Ce qui l’attend',
      distanceReelle: 'Distance réelle',
      distanceRampee: 'Distance rampée',
      dureeAnnoncee: 'Durée annoncée',
      apercuNote:
        'Hors hibernation : s’il gèle sur la route, il s’arrête et attend le redoux. Et {pourcent} fois sur cent, il part voir ailleurs.',
    },
    carnet: {
      titre: 'Carnet d’adresses',
      sousTitre: 'Les gens à qui vous pouvez confier un escargot.',
      champ: 'Pseudo de la personne',
      ajouter: 'Ajouter',
      vide: 'Carnet vide. Ajoutez le pseudo d’une personne déjà inscrite.',
      villeInconnue: 'ville inconnue',
      retirer: 'retirer',
      adresseTitre: 'Votre adresse',
      adresseSousTitre: 'Le point de départ de vos escargots.',
      adresseNote:
        'Vous pouvez déménager quand vous voulez : les escargots déjà partis gardent le trajet pour lequel ils se sont engagés.',
    },
    boite: {
      recus: 'Reçus',
      envoyes: 'Envoyés',
      attend: 'une lettre vous attend',
      arriveLe: 'arrivé le {date}',
      abandonne: 'abandonné à {distance} du départ',
      de: 'De {pseudo}',
      pour: 'Pour {pseudo}',
      entete: 'parti de {ville} le {date} — {echelle}',
      parcourus: 'Parcourus',
      restant: 'Restant',
      arriveePrevue: 'Arrivée prévue',
      suspendue: 'suspendue',
      siestes: 'Siestes cumulées',
      aucuneSieste: 'aucune',
      note: 'À l’échelle choisie, cela fait {total} réellement rampés, dont {fait} déjà derrière lui.',
      meteoOk: '🌡️ {temp} du côté de {lieu} — il avance bien.',
      distance: 'Distance',
      rampe: 'Réellement rampé',
      voyage: 'Voyage',
      dontSiestes: 'Dont siestes',
      perduTitre: '🐌💨 Parti voir ailleurs',
      perduTexte:
        'Il a quitté la route au bout de {distance}. Ce message ne sera jamais remis.',
      luLe: 'Lu le {date}.',
      pasEncoreLu: 'Arrivé. La lettre n’a pas encore été dépliée.',
      enRoute: 'En route. Le destinataire ne peut rien lire avant l’arrivée.',
      videRecus: 'Rien dans la boîte. Les escargots prennent leur temps.',
      videEnvoyes: 'Vous n’avez encore confié aucun message.',
      aucunTitre: 'Aucun escargot sur la route',
      aucunTexte: 'Confiez un message pour voir la carte s’animer.',
    },
    lettre: {
      progression: '{pourcent} du chemin',
      enPause: 'en pause',
      encore: 'encore {duree}',
      hibernation: '🐌 L’escargot fait une pause, il fait trop froid ({temp} à {lieu}).',
      hibernationNote:
        'Il repartira au redoux. Sa sieste ne compte pas dans le temps de trajet.',
      etatTransit: 'en chemin',
      etatArrive: 'arrivé',
      etatPerdu: 'parti voir ailleurs',
      etatHibernation: 'en hibernation',
      deplier: 'Déplier la lettre',
      deplierNote: '{n} caractères portés sur {distance}',
      entete: '{ville}, le {date}',
      pied: 'Remis par escargot le {date} — {distance} à vol d’oiseau, {rampee} réellement rampés.',
    },
    carte: {
      resume: 'Trajet de {depart} à {arrivee}, {pourcent} pour cent parcourus',
      arrive: 'arrivé !',
      dort: 'zzz',
      fugue: 'hop !',
    },
    unite: {
      metres: 'mètres',
      kilometres: 'kilomètres',
    },
    duree: {
      instant: 'à l’instant',
      moinsMinute: 'moins d’une minute',
      min: '{n} min',
      heures: '{h} h',
      heuresMinutes: '{h} h {min} min',
      jours: '{n} jours',
      joursHeures: '{j} j {h} h',
      mois: '{n} mois',
      moisJours: '{mois} mois {j} j',
    },
  },

  en: {
    commun: {
      chargement: 'opening the post office…',
      choisirVille: 'Choose a town',
      langue: 'Language',
      pied: 'Escargot Postal — {vitesse} m/h, in all weathers. Weather: {source}.',
      meteoSimulee: 'simulated',
    },
    nav: {
      jardin: 'The garden',
      ecrire: 'Write',
      boite: 'My mailbox',
      carnet: 'Address book',
      retour: 'Back to the garden',
      fermer: 'close the mailbox',
      fermerCourt: 'close',
    },
    portail: {
      enseigne: 'the garden post office, open in all weathers',
      accroche:
        'Your words travel at {vitesse} metres per hour, the honest pace of a garden snail. They cross France in their own time, stop when it freezes, and arrive when they arrive.',
      accrocheGras: '{vitesse} metres per hour',
      murmure: 'Write in the morning, read yourself again in autumn.',
      ouvrir: 'Open a mailbox',
      retrouver: 'Find mine again',
      pseudo: 'Your name',
      pseudoExemple: 'Colimaçon',
      code: '4-digit code',
      ou: 'Where are you writing from?',
      ouAide: 'Used to work out how far your snails will have to crawl.',
      patiente: 'one moment…',
      valider: 'Open my mailbox',
      entrer: 'Come in',
      rassurance: 'No complicated password, no email address. Just a name and four digits.',
    },
    accueil: {
      salut: 'Hello {pseudo}, it is drizzling on the garden.',
      titre: 'Your words move at {vitesse} metres per hour.',
      chapeau:
        'That is not much. It is exactly the pace of a garden snail in no hurry, and that is the whole point: the waiting is part of the message.',
      confier: 'Entrust a message',
      voirBoite: 'Open my mailbox',
      vedette: 'Your furthest-along snail',
      aucun: 'No snail on the road',
      calme: 'The garden is quiet. Send a message to bring the map to life.',
      resume: '{depart} → {arrivee} · {distance} covered · {reste}',
      resumeHibernation: 'hibernating',
      resumeReste: '{duree} to go',
      commentTitre: 'How it actually works',
      regle1Titre: 'An honest pace',
      regle1:
        '{vitesse} metres per hour, never more. At full distance, Paris — Marseille would take a year and a half: the reduced scales fold the map, never hurry the animal.',
      regle2Titre: 'It hibernates in the cold',
      regle2:
        'Below {seuil} °C on its route, the snail curls up and waits. The nap suspends the clock: it pushes back the arrival, it never shortens the road.',
      regle3Titre: 'Sometimes it wanders off',
      regle3:
        '{pourcent} snails in a hundred leave the road along the way, without warning. That message will never be delivered. Such is the risk of living mail.',
    },
    compteur: {
      depuis: 'Since the post office opened',
      legende: 'covered by all our snails together, one centimetre at a time.',
      enChemin: 'on their way',
      arrives: 'arrived',
      hibernation: 'hibernating',
      perdus: 'gone wandering',
    },
    composer: {
      videTitre: 'Nobody to write to',
      videTexte:
        'Add someone to your address book first. A snail never sets off blind.',
      titre: 'Entrust a message',
      sousTitre: 'Write, and the snail will do the rest. Slowly.',
      pour: 'To',
      message: 'Your message',
      restants: '{n} characters left',
      exemple: 'It is raining on the garden, the slugs have eaten the lettuces. I think of you.',
      envoiEnCours: 'the snail is warming up…',
      envoyer: 'Entrust it to a snail',
      itineraire: 'The route',
      depart: 'From',
      arrivee: 'To',
      adresseConnue: 'Known address for {pseudo}.',
      echelleTitre: 'The scale of the journey',
      echelleAide:
        'The snail always keeps its {vitesse} m/h. It is the map we fold, not the animal we rush.',
      apercuTitre: 'What lies ahead',
      distanceReelle: 'Real distance',
      distanceRampee: 'Distance crawled',
      dureeAnnoncee: 'Estimated time',
      apercuNote:
        'Hibernation aside: if it freezes on the way, it stops and waits for milder weather. And {pourcent} times in a hundred, it wanders off.',
    },
    carnet: {
      titre: 'Address book',
      sousTitre: 'The people you can entrust a snail to.',
      champ: 'Their name',
      ajouter: 'Add',
      vide: 'Empty book. Add the name of someone already registered.',
      villeInconnue: 'town unknown',
      retirer: 'remove',
      adresseTitre: 'Your address',
      adresseSousTitre: 'Where your snails set off from.',
      adresseNote:
        'You can move house whenever you like: snails already on their way keep the journey they signed up for.',
    },
    boite: {
      recus: 'Received',
      envoyes: 'Sent',
      attend: 'a letter is waiting for you',
      arriveLe: 'arrived on {date}',
      abandonne: 'abandoned {distance} from the start',
      de: 'From {pseudo}',
      pour: 'To {pseudo}',
      entete: 'left {ville} on {date} — {echelle}',
      parcourus: 'Covered',
      restant: 'Remaining',
      arriveePrevue: 'Expected arrival',
      suspendue: 'suspended',
      siestes: 'Total naps',
      aucuneSieste: 'none',
      note: 'At the chosen scale that is {total} truly crawled, {fait} of it already behind it.',
      meteoOk: '🌡️ {temp} around {lieu} — it is making good progress.',
      distance: 'Distance',
      rampe: 'Truly crawled',
      voyage: 'Journey',
      dontSiestes: 'Naps included',
      perduTitre: '🐌💨 Gone wandering',
      perduTexte:
        'It left the road after {distance}. This message will never be delivered.',
      luLe: 'Read on {date}.',
      pasEncoreLu: 'Arrived. The letter has not been unfolded yet.',
      enRoute: 'On its way. The recipient cannot read a word before it arrives.',
      videRecus: 'Nothing in the mailbox. Snails take their time.',
      videEnvoyes: 'You have not entrusted a message to anyone yet.',
      aucunTitre: 'No snail on the road',
      aucunTexte: 'Send a message to see the map come alive.',
    },
    lettre: {
      progression: '{pourcent} of the way',
      enPause: 'paused',
      encore: '{duree} to go',
      hibernation: '🐌 The snail is taking a break, it is too cold ({temp} in {lieu}).',
      hibernationNote:
        'It will set off again when it warms up. Its nap does not count towards the journey.',
      etatTransit: 'on its way',
      etatArrive: 'arrived',
      etatPerdu: 'gone wandering',
      etatHibernation: 'hibernating',
      deplier: 'Unfold the letter',
      deplierNote: '{n} characters carried over {distance}',
      entete: '{ville}, {date}',
      pied: 'Delivered by snail on {date} — {distance} as the crow flies, {rampee} truly crawled.',
    },
    carte: {
      resume: 'Journey from {depart} to {arrivee}, {pourcent} per cent covered',
      arrive: 'arrived!',
      dort: 'zzz',
      fugue: 'off!',
    },
    unite: {
      metres: 'metres',
      kilometres: 'kilometres',
    },
    duree: {
      instant: 'just now',
      moinsMinute: 'less than a minute',
      min: '{n} min',
      heures: '{h} h',
      heuresMinutes: '{h} h {min} min',
      jours: '{n} days',
      joursHeures: '{j} d {h} h',
      mois: '{n} months',
      moisJours: '{mois} months {j} d',
    },
  },
};

/** Résout « boite.recus » dans l'arbre, sans planter si la clé manque. */
function resoudre(arbre, chemin) {
  return chemin.split('.').reduce((noeud, part) => (noeud == null ? undefined : noeud[part]), arbre);
}

function interpoler(modele, valeurs) {
  if (!valeurs) return modele;
  return modele.replace(/\{(\w+)\}/g, (brut, cle) =>
    valeurs[cle] === undefined ? brut : String(valeurs[cle])
  );
}

export function traduire(langue, cle, valeurs) {
  const modele =
    resoudre(DICTIONNAIRES[langue], cle) ??
    resoudre(DICTIONNAIRES[LANGUE_PAR_DEFAUT], cle) ??
    cle; // la clé nue plutôt qu'un trou dans la page
  return interpoler(modele, valeurs);
}

/** Langue retenue au dernier passage, sinon celle du navigateur, sinon FR. */
export function langueInitiale() {
  try {
    const gardee = localStorage.getItem(CLE_STOCKAGE);
    if (gardee && LANGUES.some((l) => l.code === gardee)) return gardee;
  } catch {
    // navigation privée : on continue sans mémoire
  }
  const preferees = typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language];
  for (const balise of preferees) {
    const court = String(balise || '').slice(0, 2).toLowerCase();
    if (LANGUES.some((l) => l.code === court)) return court;
  }
  return LANGUE_PAR_DEFAUT;
}

const ContexteI18n = createContext(null);

export function FournisseurI18n({ children }) {
  const [langue, setLangueEtat] = useState(langueInitiale);

  const setLangue = useCallback((code) => {
    setLangueEtat(code);
    try {
      localStorage.setItem(CLE_STOCKAGE, code);
    } catch {
      // sans mémoire, le choix ne vaut que pour cette visite
    }
  }, []);

  // L'attribut lang du document suit : lecteurs d'écran, césure, correcteurs.
  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);

  const valeur = useMemo(() => {
    const intl = LANGUES.find((l) => l.code === langue)?.intl ?? 'fr-FR';
    return {
      langue,
      setLangue,
      langues: LANGUES,
      intl,
      t: (cle, valeurs) => traduire(langue, cle, valeurs),
    };
  }, [langue, setLangue]);

  return <ContexteI18n.Provider value={valeur}>{children}</ContexteI18n.Provider>;
}

export function useI18n() {
  const contexte = useContext(ContexteI18n);
  if (!contexte) throw new Error('useI18n hors du FournisseurI18n');
  return contexte;
}
