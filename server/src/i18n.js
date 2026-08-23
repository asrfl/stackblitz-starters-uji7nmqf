/**
 * Catalogue serveur. Chaque entrée est un code stable (ce que le client peut
 * tester) et ses formulations par langue (ce qu'un humain lit dans un curl).
 * Les réponses d'erreur portent les deux.
 */
export const LANGUES = ['fr', 'en'];
export const LANGUE_PAR_DEFAUT = 'fr';

const CATALOGUE = {
  'auth.requise': {
    fr: 'Il faut d’abord ouvrir sa boîte aux lettres.',
    en: 'You need to open a mailbox first.',
  },
  'auth.pseudoInvalide': {
    fr: 'Un pseudo de 2 à 24 caractères, s’il vous plaît.',
    en: 'A name of 2 to 24 characters, please.',
  },
  'auth.codeInvalide': {
    fr: 'Le code doit faire exactement 4 chiffres.',
    en: 'The code must be exactly 4 digits.',
  },
  'auth.pseudoPris': {
    fr: 'Ce pseudo a déjà une boîte aux lettres.',
    en: 'That name already has a mailbox.',
  },
  'auth.identifiants': {
    fr: 'Pseudo ou code inconnu.',
    en: 'Unknown name or code.',
  },
  'ville.inconnue': {
    fr: 'Cette ville n’est pas sur notre carte.',
    en: 'That town is not on our map.',
  },
  'contact.inconnu': {
    fr: 'Personne de ce nom dans le jardin.',
    en: 'Nobody by that name in the garden.',
  },
  'contact.soiMeme': {
    fr: 'Vous êtes déjà en très bons termes avec vous-même.',
    en: 'You are already on excellent terms with yourself.',
  },
  'contact.doublon': {
    fr: 'Ce contact est déjà dans votre carnet.',
    en: 'That contact is already in your book.',
  },
  'contact.introuvable': {
    fr: 'Contact introuvable.',
    en: 'Contact not found.',
  },
  'message.vide': {
    fr: 'Un message vide ne mérite pas un escargot.',
    en: 'An empty message does not deserve a snail.',
  },
  'message.tropLong': {
    fr: '{max} caractères maximum, l’escargot ne porte pas plus.',
    en: '{max} characters maximum, the snail carries no more.',
  },
  'message.destinataireInconnu': {
    fr: 'Ce destinataire n’a pas de boîte aux lettres.',
    en: 'That recipient has no mailbox.',
  },
  'message.departManquant': {
    fr: 'Indiquez d’où part l’escargot.',
    en: 'Say where the snail sets off from.',
  },
  'message.arriveeManquante': {
    fr: 'Indiquez où vit le destinataire.',
    en: 'Say where the recipient lives.',
  },
  'message.introuvable': {
    fr: 'Message introuvable.',
    en: 'Message not found.',
  },
  'message.pasArrive': {
    fr: 'L’escargot n’est pas encore arrivé.',
    en: 'The snail has not arrived yet.',
  },
  'route.inconnue': {
    fr: 'Rien par ici.',
    en: 'Nothing over here.',
  },
  'serveur.incident': {
    fr: 'Un incident dans le potager.',
    en: 'An incident in the vegetable patch.',
  },
  'echelle.reel.label': { fr: 'Grandeur nature', en: 'Life size' },
  'echelle.reel.hint': {
    fr: 'La vraie distance. Des mois de patience.',
    en: 'The real distance. Months of patience.',
  },
  'echelle.jardin.label': { fr: 'Échelle jardin', en: 'Garden scale' },
  'echelle.jardin.hint': {
    fr: 'Un millième du trajet. Quelques heures.',
    en: 'One thousandth of the journey. A few hours.',
  },
  'echelle.potager.label': { fr: 'Échelle potager', en: 'Kitchen-garden scale' },
  'echelle.potager.hint': {
    fr: 'Un dix-millième. Une petite heure.',
    en: 'One ten-thousandth. About an hour.',
  },
  'echelle.demo.label': { fr: 'Échelle bocal', en: 'Jar scale' },
  'echelle.demo.hint': {
    fr: 'Pour les impatients. Quelques minutes.',
    en: 'For the impatient. A few minutes.',
  },
};

/**
 * Langue de la requête : « Accept-Language », ou le paramètre ?lang= qui
 * prime, pour qu'un curl puisse forcer la langue sans bricoler d'en-tête.
 */
export function langueDe(req) {
  const force = String(req?.query?.lang || '').slice(0, 2).toLowerCase();
  if (LANGUES.includes(force)) return force;

  const entete = req?.get?.('accept-language') || '';
  // « en-GB,en;q=0.9,fr;q=0.8 » : on garde l'ordre de préférence annoncé.
  const preferees = entete
    .split(',')
    .map((morceau) => {
      const [balise, q] = morceau.trim().split(';q=');
      return { code: balise.slice(0, 2).toLowerCase(), poids: q === undefined ? 1 : Number(q) || 0 };
    })
    .sort((a, b) => b.poids - a.poids);

  return preferees.find((p) => LANGUES.includes(p.code))?.code ?? LANGUE_PAR_DEFAUT;
}

export function tr(langue, code, valeurs) {
  const entree = CATALOGUE[code];
  if (!entree) return code;
  const modele = entree[langue] ?? entree[LANGUE_PAR_DEFAUT];
  if (!valeurs) return modele;
  return modele.replace(/\{(\w+)\}/g, (brut, cle) =>
    valeurs[cle] === undefined ? brut : String(valeurs[cle])
  );
}

/**
 * Réponse d'erreur normalisée : `error` pour l'humain, `code` pour le client
 * qui préfère décider lui-même de la formulation.
 */
export function echec(res, statut, req, code, valeurs) {
  return res.status(statut).json({ error: tr(langueDe(req), code, valeurs), code });
}
