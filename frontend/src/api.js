// API client for the SaveLife donation app.
// In dev, Vite proxies /api -> backend (see vite.config.js). In production the
// backend serves this app, so relative /api paths work there too.

const TOKEN_KEY = "savelife_token";

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // public (no auth) — for the Explore page
  publicStats: () => request("/public/stats"),
  publicRequests: () => request("/public/requests"),

  // reveal a request's contact (auth required)
  requestContact: (id) => request(`/requests/${id}/contact`),

  // auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: payload }),

  // emergency contacts
  listContacts: () => request("/contacts"),
  addContact: (payload) => request("/contacts", { method: "POST", body: payload }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),

  // alerts (SOS)
  raiseAlert: (payload) => request("/alerts", { method: "POST", body: payload }),
  myAlerts: () => request("/alerts/mine"),
  activeAlerts: () => request("/alerts/active"),
  respondAlert: (id) => request(`/alerts/${id}/respond`, { method: "PATCH" }),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: "PATCH" }),
  cancelAlert: (id) => request(`/alerts/${id}/cancel`, { method: "PATCH" }),
};

// Wraps the browser geolocation API in a promise.
export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ latitude: null, longitude: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: null, longitude: null }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
