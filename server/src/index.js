import express from 'express';
import cors from 'cors';
import { attachUser } from './auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { contactRoutes } from './routes/contacts.routes.js';
import { messageRoutes } from './routes/messages.routes.js';
import { metaRoutes } from './routes/meta.routes.js';
import { tick } from './messages.js';
import { weatherMode } from './weather.js';
import { echec } from './i18n.js';

const PORT = Number(process.env.PORT || 3001);
const TICK_MS = Number(process.env.TICK_MS || 15000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true, weatherMode }));
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', metaRoutes);

app.use('/api', (req, res) => echec(res, 404, req, 'route.inconnue'));

app.use((err, req, res, _next) => {
  console.error('[escargot]', err);
  echec(res, 500, req, 'serveur.incident');
});

// Le ticker fait vivre les trajets meme quand personne ne regarde :
// hibernations, arrivees et fugues avancent en arriere-plan.
let ticking = false;
const loop = async () => {
  if (ticking) return;
  ticking = true;
  try {
    await tick();
  } catch (err) {
    console.error('[escargot] ticker', err);
  } finally {
    ticking = false;
  }
};

app.listen(PORT, () => {
  console.log(`🐌 Escargot Postal - API sur http://localhost:${PORT} (meteo: ${weatherMode})`);
  loop();
  setInterval(loop, TICK_MS).unref();
});
