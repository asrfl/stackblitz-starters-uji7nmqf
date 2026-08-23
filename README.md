# 🐌 Escargot Postal

Une messagerie qui livre les messages à la **vitesse réelle d'un escargot de
jardin** — 0,048 km/h, soit **48 mètres par heure** — au lieu de les livrer
instantanément.

Vous écrivez, vous choisissez un destinataire, et un escargot part avec votre
mot. Il rampe. Il s'arrête quand il gèle. Parfois il ne va jamais au bout.
Le destinataire ne peut rien lire avant son arrivée.

Disponible en **français et en anglais**, interface et API comprises.

---

## Lancer le projet

```bash
npm install
npm run dev
```

- Client (Vite) : http://localhost:5173
- API (Express) : http://localhost:3001

Le client appelle l'API en relatif (`/api/...`) via le proxy Vite : rien à
configurer. Une base SQLite est créée à la volée dans `server/data/`.

Autres commandes :

```bash
npm run dev:server   # l'API seule
npm run dev:client   # le client seul
npm run build        # build de production du client (client/dist)
npm start            # l'API seule, sans rechargement
```

## Structure

```
client/                 React + Vite + Tailwind
  src/
    components/         vues et illustrations SVG dessinées à la main
    lib/
      api.js            client HTTP + jeton de session
      geo.js            projection de la carte, contour de la France
      format.js         distances, durées et dates selon la langue active
      i18n.jsx          catalogue FR/EN + contexte React
server/                 Node + Express + better-sqlite3
  src/
    db.js               schéma SQLite
    cities.js           table statique de villes françaises + haversine
    snail.js            physique de l'escargot (vitesse, échelles, fugue)
    weather.js          météo Open-Meteo, avec repli sur une simulation
    i18n.js             catalogue des messages serveur + négociation de langue
    messages.js         sérialisation + ticker (hibernation, arrivées)
    routes/             auth, contacts, messages, méta
  data/                 base SQLite (créée au premier lancement, non versionnée)
```

## Comment ça marche

### La vitesse et les échelles

L'escargot avance toujours à 48 m/h. Ce qui change, c'est la **longueur du
trajet** : à l'échelle 1, un Paris — Marseille (660 km) demanderait environ un
an et demi. On replie donc la carte, jamais la bête.

| Échelle | Multiplicateur | Paris — Marseille |
| --- | --- | --- |
| Grandeur nature | 1 | ~18 mois |
| Échelle jardin | 1/1 000 | ~13 h 45 |
| Échelle potager | 1/10 000 | ~1 h 23 (défaut) |
| Échelle bocal | 1/100 000 | ~8 min |

La distance réelle vient d'un calcul haversine entre deux villes de la table
statique (`server/src/cities.js`), et deux personnes dans la même ville
obtiennent quand même 250 m — le tour du pâté de maisons.

### La position sur le trajet

Le serveur ne stocke pas la position : il stocke l'heure de départ, l'heure
d'arrivée estimée et le temps de sieste cumulé. La position est recalculée à
chaque lecture par interpolation linéaire dans le temps. Le trajet reste donc
cohérent même si le serveur a été arrêté pendant la nuit.

### L'hibernation

Un ticker passe toutes les 15 secondes et relève la météo **au point où se
trouve l'escargot**. Sous 5 °C, il s'enroule dans sa coquille : le trajet est
mis en pause et l'arrivée estimée recule d'autant. Il repart tout seul au
redoux.

La météo vient d'[Open-Meteo](https://open-meteo.com) (gratuit, sans clé). Si
l'API est injoignable, une simulation climatique prend le relais sans bruit —
saison, latitude, cycle jour/nuit, plus des coups de froid passagers.

```bash
WEATHER_MODE=auto    # défaut : Open-Meteo, repli sur la simulation
WEATHER_MODE=simule  # jamais de réseau
WEATHER_MODE=givre   # coups de froid fréquents, pour voir l'hibernation
WEATHER_BIAS=-8      # décalage en °C appliqué à la simulation
```

### Le twist

Chaque message a 2 % de chance de ne jamais arriver. Le tirage a lieu au
départ, mais l'escargot ne quitte la route qu'entre 10 % et 90 % du trajet :
« 🐌💨 Parti voir ailleurs ».

Le compteur communautaire de la page d'accueil additionne les distances
parcourues par tous les escargots. Il est recalculé à chaque tour plutôt
qu'accumulé, pour ne jamais dériver.

## Les langues

L'interface et les réponses de l'API existent en français et en anglais. La
langue se choisit dans l'en-tête (`FR` / `EN`) ; au premier passage elle est
devinée depuis `navigator.languages`, puis retenue dans le navigateur.

Ce que la langue change : tous les textes, mais aussi les séparateurs
décimaux (`44,7 km` contre `44.7 km`), l'ordre et le nom des dates, et
l'attribut `lang` du document. Les noms de villes, eux, restent français —
ce sont des noms propres.

Côté serveur, la langue vient de l'en-tête `Accept-Language` (pondérations
`q=` comprises), qu'un paramètre `?lang=fr|en` peut forcer — pratique en
curl. Une langue inconnue retombe sur le français. Les erreurs portent le
texte **et** un code stable, pour un client qui préfère formuler lui-même :

```bash
curl -X POST localhost:3001/api/auth/register -H 'content-type: application/json' \
     -H 'accept-language: en' -d '{"pseudo":"x","pin":"1"}'
# {"error":"A name of 2 to 24 characters, please.","code":"auth.pseudoInvalide"}
```

### Ajouter une langue

1. `client/src/lib/i18n.jsx` : une entrée dans `LANGUES`, un bloc de plus
   dans `DICTIONNAIRES` (une clé manquante retombe sur le français).
2. `server/src/i18n.js` : le code dans `LANGUES`, les traductions dans
   `CATALOGUE`.

Rien d'autre : le sélecteur, l'attribut `lang` et les formats suivent.

## L'API

Toutes les routes authentifiées attendent un en-tête
`Authorization: Bearer <jeton>` (le jeton est rendu à l'inscription et à la
connexion).

| Méthode | Route | Effet |
| --- | --- | --- |
| `POST` | `/api/auth/register` | pseudo + code PIN à 4 chiffres + ville |
| `POST` | `/api/auth/login` | rend un nouveau jeton |
| `GET` | `/api/auth/me` | le compte courant |
| `PATCH` | `/api/auth/me` | changer de ville |
| `POST` | `/api/auth/logout` | invalide le jeton |
| `GET` | `/api/contacts` | le carnet d'adresses |
| `POST` | `/api/contacts` | `{ pseudo }` |
| `DELETE` | `/api/contacts/:id` | retirer un contact |
| `GET` | `/api/messages` | boîte complète, positions à jour |
| `POST` | `/api/messages` | `{ to, body, fromCity, toCity, scale }` |
| `GET` | `/api/messages/:id` | un message |
| `POST` | `/api/messages/:id/read` | déplier la lettre (une fois arrivée) |
| `GET` | `/api/cities` | la table des villes |
| `GET` | `/api/config` | vitesse, échelles, seuils |
| `GET` | `/api/stats` | le compteur communautaire |

Le corps d'un message n'est jamais renvoyé au destinataire tant que
l'escargot n'est pas arrivé — la protection est côté serveur, pas seulement
dans l'affichage.

Une erreur a toujours la forme `{ error, code }` : `error` est rédigé dans la
langue négociée, `code` ne bouge jamais. Un message sérialisé porte `scaleId`
(`jardin`, `potager`…) et non un libellé : c'est le client qui l'habille, avec
les libellés traduits que `/api/config` lui a donnés.

### Authentification

Volontairement minimale : un pseudo et un code à 4 chiffres. Le code est haché
avec sel (scrypt), le jeton de session est un aléa de 24 octets. C'est assez
pour un jeu entre amis, ce n'est pas un modèle à copier pour du sérieux.

## Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3001` | port de l'API |
| `TICK_MS` | `15000` | intervalle du ticker |
| `WEATHER_MODE` | `auto` | `auto`, `simule` ou `givre` |
| `WEATHER_BIAS` | `0` | décalage de température de la simulation |
| `API_URL` | `http://localhost:3001` | cible du proxy Vite |

La langue ne se configure pas au lancement : elle est négociée par requête.

## Direction artistique

Un jardin anglais pluvieux au petit matin, façon carnet d'illustrateur
botanique — la même dans les deux langues. Palette crème / vert sauge / terre cuite / rose poudré, sans blanc
ni noir purs. Polices Caveat, Playfair Display et Lora, **embarquées avec
l'application** (`@fontsource`) : pas de CDN, rendu identique hors ligne.

Le grain de papier est un bruit fractal SVG, les coins des cartes ont des
rayons elliptiques asymétriques pour un contour tracé à la main, les ombres
sont diffuses et les transitions durent 450 à 900 ms — l'inverse d'une
interface pressée.

La trace de bave est un dégradé appliqué le long du trajet, en trois passes
(halo flou, corps nacré, reflet brillant animé) : elle est vive sous le
museau et s'estompe vers le point de départ.
