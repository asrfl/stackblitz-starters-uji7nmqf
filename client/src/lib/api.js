const TOKEN_KEY = 'escargot-postal:jeton';

export const readToken = () => localStorage.getItem(TOKEN_KEY);
export const writeToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

/**
 * Langue courante, poussée par le fournisseur i18n. Les messages d'erreur et
 * les libellés d'échelle arrivent du serveur déjà traduits, sans que chaque
 * appel ait à la passer en paramètre.
 */
let langueCourante = 'fr';
export const setLangueApi = (code) => {
  langueCourante = code;
};

async function request(path, { method = 'GET', body } = {}) {
  const token = readToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'accept-language': langueCourante,
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Escargot Postal');
    err.status = res.status;
    err.code = data.code; // code stable, si l'appelant préfère décider lui-même
    throw err;
  }
  return data;
}

export const api = {
  config: () => request('/config'),
  cities: () => request('/cities'),
  stats: () => request('/stats'),

  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  setCity: (city) => request('/auth/me', { method: 'PATCH', body: { city } }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  contacts: () => request('/contacts'),
  addContact: (pseudo) => request('/contacts', { method: 'POST', body: { pseudo } }),
  removeContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  messages: () => request('/messages'),
  send: (payload) => request('/messages', { method: 'POST', body: payload }),
  read: (id) => request(`/messages/${id}/read`, { method: 'POST' }),
};
