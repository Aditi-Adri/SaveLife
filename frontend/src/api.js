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

async function upload(path, formData) {
  const headers = {};
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method: "POST", headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

export const api = {
  // public (no auth) — for the Explore page
  publicStats: () => request("/public/stats"),
  publicRequests: (filters = {}) => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v !== false && v != null) q.set(k, v); });
    const qs = q.toString();
    return request(`/public/requests${qs ? "?" + qs : ""}`);
  },
  publicProfile: (id) => request(`/public/profile/${id}`),

  // reveal a request's contact (auth required) — also fires push notification to requester
  requestContact: (id) => request(`/requests/${id}/contact`),

  // blood / plasma requests
  createRequest: (payload) => request("/requests", { method: "POST", body: payload }),
  myRequests: () => request("/requests/mine"),
  cancelRequest: (id) => request(`/requests/${id}`, { method: "DELETE" }),

  // hospitals & ambulances
  registerHospital: (payload) => request("/hospitals", { method: "POST", body: payload }),
  publicHospitals: () => request("/public/hospitals"),
  publicAmbulances: () => request("/public/ambulances"),
  bookHospital: (id, payload) => request(`/hospitals/${id}/book`, { method: "POST", body: payload }),
  myBookings: () => request("/hospitals/bookings"),
  bookingDocuments: (bookingId) => request(`/hospitals/bookings/${bookingId}/documents`),
  uploadBookingDocs: (bookingId, files, docLabel) => {
    const fd = new FormData();
    files.forEach(f => fd.append("docs", f));
    fd.append("doc_label", docLabel || "medical");
    const headers = {};
    const token = auth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`/api/hospitals/bookings/${bookingId}/documents`, { method: "POST", headers, body: fd })
      .then(r => r.json());
  },

  // doctors & appointments
  publicDoctors: (filters = {}) => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
    const qs = q.toString();
    return request(`/doctors${qs ? "?" + qs : ""}`);
  },
  bookAppointment: (payload) => request("/doctors/appointments", { method: "POST", body: payload }),
  myAppointments: () => request("/doctors/appointments/mine"),

  // auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: payload }),
  testEmail: () => request("/auth/test-email", { method: "POST" }),

  // uploads
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return upload("/uploads/avatar", fd);
  },
  uploadDocument: (file, docType) => {
    const fd = new FormData();
    fd.append("document", file);
    fd.append("doc_type", docType);
    return upload("/uploads/document", fd);
  },
  myDocuments: () => request("/uploads/documents"),
  deleteDocument: (id) => request(`/uploads/documents/${id}`, { method: "DELETE" }),

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
