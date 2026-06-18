import { useEffect, useState } from "react";
import { api, auth, getLocation } from "./api";
import "./App.css";

const ALERT_TYPES = [
  { value: "medical", label: "🚑 Medical" },
  { value: "accident", label: "💥 Accident" },
  { value: "fire", label: "🔥 Fire" },
  { value: "crime", label: "🚓 Crime" },
  { value: "other", label: "❗ Other" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => auth.clear())
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    auth.clear();
    setUser(null);
  }

  if (loading) return <div className="center">Loading…</div>;

  return (
    <div className="app">
      <header className="header">
        <h1>🩺 SaveLife</h1>
        {user && (
          <div className="userbar">
            <span>
              {user.name} <em className="role">{user.role}</em>
            </span>
            <button className="ghost" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      {!user && <AuthForm onAuthed={setUser} />}
      {user?.role === "responder" && <ResponderDashboard />}
      {user?.role === "user" && <UserDashboard user={user} onUser={setUser} />}
    </div>
  );
}

/* ------------------------------ Auth ------------------------------ */

function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    blood_type: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fn = mode === "login" ? api.login : api.register;
      const { token, user } = await fn(form);
      auth.setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{mode === "login" ? "Welcome back" : "Create an account"}</h2>

      {mode === "register" && (
        <>
          <input placeholder="Full name" value={form.name} onChange={set("name")} required />
          <input placeholder="Phone number" value={form.phone} onChange={set("phone")} />
          <div className="row">
            <select value={form.blood_type} onChange={set("blood_type")}>
              <option value="">Blood type (optional)</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select value={form.role} onChange={set("role")}>
              <option value="user">I need help (user)</option>
              <option value="responder">I'm a responder</option>
            </select>
          </div>
        </>
      )}

      <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={set("password")}
        required
      />

      {error && <p className="error">{error}</p>}
      <button disabled={busy} type="submit">
        {busy ? "…" : mode === "login" ? "Log in" : "Sign up"}
      </button>

      <p className="switch">
        {mode === "login" ? "No account?" : "Already have an account?"}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setError("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </a>
      </p>
    </form>
  );
}

/* -------------------------- User dashboard -------------------------- */

function UserDashboard({ user, onUser }) {
  const [type, setType] = useState("medical");
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAlerts() {
    const { alerts } = await api.myAlerts();
    setAlerts(alerts);
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function sendSOS() {
    setBusy(true);
    setStatus("Getting your location…");
    try {
      const loc = await getLocation();
      setStatus("Sending alert…");
      await api.raiseAlert({ type, message, ...loc });
      setStatus("🚨 Alert sent! Responders have been notified.");
      setMessage("");
      loadAlerts();
    } catch (err) {
      setStatus("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    await api.cancelAlert(id);
    loadAlerts();
  }

  const activeAlert = alerts.find((a) => a.status === "active" || a.status === "responded");

  return (
    <>
      <section className="card sos-card">
        <h2>Emergency SOS</h2>
        <div className="row">
          {ALERT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`chip ${type === t.value ? "chip-active" : ""}`}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Describe the emergency (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
        />
        <button className="sos-button" disabled={busy} onClick={sendSOS}>
          {busy ? "…" : "🚨 SEND SOS"}
        </button>
        {status && <p className="hint">{status}</p>}
      </section>

      {activeAlert && (
        <section className="card">
          <h2>Active alert</h2>
          <AlertStatus alert={activeAlert} />
          <button className="ghost" onClick={() => cancel(activeAlert.id)}>
            Cancel alert
          </button>
        </section>
      )}

      <ContactsManager />
      <ProfileCard user={user} onUser={onUser} />

      <section className="card">
        <h2>History</h2>
        <ul className="items">
          {alerts.length === 0 && <li className="empty">No alerts yet.</li>}
          {alerts.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{labelFor(a.type)}</strong> · {a.status}
                <p>{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function AlertStatus({ alert }) {
  return (
    <div>
      <p>
        <strong>{labelFor(alert.type)}</strong> — <StatusBadge status={alert.status} />
      </p>
      {alert.message && <p className="hint">“{alert.message}”</p>}
      {alert.responder_name ? (
        <p className="hint">
          Responder: {alert.responder_name} ({alert.responder_phone || "no phone"})
        </p>
      ) : (
        <p className="hint">Waiting for a responder to accept…</p>
      )}
      <MapLink lat={alert.latitude} lng={alert.longitude} />
    </div>
  );
}

/* ----------------------- Responder dashboard ----------------------- */

function ResponderDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { alerts } = await api.activeAlerts();
      setAlerts(alerts);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(id);
  }, []);

  async function respond(id) {
    await api.respondAlert(id);
    load();
  }
  async function resolve(id) {
    await api.resolveAlert(id);
    load();
  }

  return (
    <section className="card">
      <h2>Active emergencies</h2>
      <p className="hint">Auto-refreshes every 10 seconds.</p>
      {error && <p className="error">{error}</p>}
      <ul className="items">
        {alerts.length === 0 && <li className="empty">No active emergencies right now.</li>}
        {alerts.map((a) => (
          <li key={a.id} className="alert-row">
            <div>
              <strong>{labelFor(a.type)}</strong> <StatusBadge status={a.status} />
              <p>
                {a.requester_name} · {a.requester_phone || "no phone"}
                {a.requester_blood_type ? ` · 🩸 ${a.requester_blood_type}` : ""}
              </p>
              {a.message && <p className="hint">“{a.message}”</p>}
              <p className="hint">{new Date(a.created_at).toLocaleString()}</p>
              <MapLink lat={a.latitude} lng={a.longitude} />
            </div>
            <div className="actions">
              {a.status === "active" && <button onClick={() => respond(a.id)}>Respond</button>}
              <button className="ghost" onClick={() => resolve(a.id)}>
                Resolve
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------- Shared bits --------------------------- */

function ContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "" });

  async function load() {
    const { contacts } = await api.listContacts();
    setContacts(contacts);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    await api.addContact(form);
    setForm({ name: "", phone: "", relationship: "" });
    load();
  }
  async function remove(id) {
    await api.deleteContact(id);
    load();
  }

  return (
    <section className="card">
      <h2>Emergency contacts</h2>
      <form className="row" onSubmit={add}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Relationship"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>
      <ul className="items">
        {contacts.length === 0 && <li className="empty">No contacts yet.</li>}
        {contacts.map((c) => (
          <li key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <p>
                {c.phone}
                {c.relationship ? ` · ${c.relationship}` : ""}
              </p>
            </div>
            <button className="ghost" onClick={() => remove(c.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileCard({ user, onUser }) {
  const [phone, setPhone] = useState(user.phone || "");
  const [bloodType, setBloodType] = useState(user.blood_type || "");
  const [saved, setSaved] = useState(false);

  async function save(e) {
    e.preventDefault();
    const { user: updated } = await api.updateProfile({ phone, blood_type: bloodType });
    onUser((prev) => ({ ...prev, ...updated }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="card">
      <h2>My profile</h2>
      <form className="row" onSubmit={save}>
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
          <option value="">Blood type</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button type="submit">{saved ? "Saved ✓" : "Save"}</button>
      </form>
    </section>
  );
}

function MapLink({ lat, lng }) {
  if (lat == null || lng == null) return <p className="hint">📍 Location unavailable</p>;
  return (
    <a
      className="map-link"
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noreferrer"
    >
      📍 View location on map
    </a>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function labelFor(type) {
  return ALERT_TYPES.find((t) => t.value === type)?.label || type;
}
