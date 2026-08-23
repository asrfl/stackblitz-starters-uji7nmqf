const TOKEN_KEY = 'escargot-postal:jeton';

export const readToken = () => localStorage.getItem(TOKEN_KEY);
export const writeToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const token = readToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Le facteur n’a pas répondu.');
    err.status = res.status;
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
