import { useCallback, useEffect, useState } from 'react';
import { api, readToken, setLangueApi, writeToken } from './lib/api';
import { FournisseurI18n, useI18n } from './lib/i18n';
import Portail from './components/Portail';
import Entete from './components/Entete';
import Accueil from './components/Accueil';
import Composer from './components/Composer';
import Carnet from './components/Carnet';
import BoiteAuxLettres from './components/BoiteAuxLettres';
import { Escargot } from './components/Illustrations';

/** Rythme du rafraîchissement : un escargot n'a pas besoin de websockets. */
const POLL_MS = 7000;
const VIDE = { recus: [], envoyes: [] };

function Jardin() {
  const { t, langue } = useI18n();
  const [pret, setPret] = useState(false);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState(VIDE);
  const [vue, setVue] = useState('accueil');
  const [selection, setSelection] = useState(null);

  // Le client HTTP doit connaître la langue avant le premier appel : les
  // erreurs et les libellés d'échelle arrivent traduits du serveur.
  useEffect(() => {
    setLangueApi(langue);
  }, [langue]);

  // Référence : villes, échelles, seuils. Rechargé quand la langue change,
  // parce que les libellés d'échelle en dépendent.
  useEffect(() => {
    setLangueApi(langue);
    Promise.all([api.config(), api.cities(), api.stats()])
      .then(([c, v, s]) => {
        setConfig(c);
        setCities(v);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setPret(true));
  }, [langue]);

  // Reprise de session : le jeton vit dans le navigateur.
  useEffect(() => {
    if (!readToken()) return;
    api.me().then(setUser).catch(() => writeToken(null));
  }, []);

  const rafraichir = useCallback(async () => {
    if (!readToken()) return;
    const [m, s] = await Promise.all([api.messages(), api.stats()]).catch(() => [null, null]);
    if (m) setMessages({ recus: m.recus, envoyes: m.envoyes });
    if (s) setStats(s);
  }, []);

  const rechargerContacts = useCallback(() => {
    api.contacts().then(setContacts).catch(() => {});
  }, []);

  // Sondage régulier : c'est là que les escargots avancent à l'écran.
  useEffect(() => {
    if (!user) {
      setMessages(VIDE);
      setContacts([]);
      return;
    }
    rechargerContacts();
    rafraichir();
    const id = setInterval(rafraichir, POLL_MS);
    return () => clearInterval(id);
  }, [user, rafraichir, rechargerContacts]);

  // Le compteur communautaire continue de tourner même sans être connecté.
  useEffect(() => {
    if (user) return;
    const id = setInterval(() => api.stats().then(setStats).catch(() => {}), POLL_MS);
    return () => clearInterval(id);
  }, [user]);

  async function sortir() {
    await api.logout().catch(() => {});
    writeToken(null);
    setUser(null);
    setVue('accueil');
  }

  async function changerVille(city) {
    const maj = await api.setCity(city).catch(() => null);
    if (maj) setUser(maj);
  }

  if (!pret || !config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Escargot className="h-16 w-24 animate-derive text-encre-fonce opacity-70" />
        <p className="etiquette">{t('commun.chargement')}</p>
      </div>
    );
  }

  if (!user) {
    return <Portail cities={cities} stats={stats} config={config} onEntre={setUser} />;
  }

  const enTransit = messages.recus
    .concat(messages.envoyes)
    .filter((m) => m.status === 'transit').length;

  return (
    <div className="min-h-screen">
      <Entete user={user} vue={vue} onVue={setVue} onSortir={sortir} enTransit={enTransit} />

      <main className="px-6 py-10">
        {vue === 'accueil' && (
          <Accueil
            user={user}
            stats={stats}
            config={config}
            messages={messages}
            cities={cities}
            onVue={setVue}
            onSelection={setSelection}
          />
        )}

        {vue === 'ecrire' && (
          <Composer
            user={user}
            contacts={contacts}
            cities={cities}
            config={config}
            onEnvoye={(message) => {
              setSelection(message.id);
              rafraichir();
              setVue('boite');
            }}
          />
        )}

        {vue === 'boite' && (
          <BoiteAuxLettres
            messages={messages}
            cities={cities}
            config={config}
            selection={selection}
            onSelection={setSelection}
            onRafraichir={rafraichir}
          />
        )}

        {vue === 'carnet' && (
          <Carnet
            contacts={contacts}
            onChange={rechargerContacts}
            user={user}
            cities={cities}
            onVille={changerVille}
          />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-12 pt-4">
        <span className="filet mb-4" />
        <p className="etiquette text-center">
          {t('commun.pied', {
            vitesse: config.speedMetersPerHour,
            source:
              config.weatherMode === 'simule' || config.weatherMode === 'givre'
                ? t('commun.meteoSimulee')
                : 'Open-Meteo',
          })}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FournisseurI18n>
      <Jardin />
    </FournisseurI18n>
  );
}
