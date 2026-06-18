import { useEffect, useState } from "react";
import { api, auth } from "./api";
import Home from "./Home";
import Explore from "./Explore";
import OrganInfo from "./OrganInfo";
import "./App.css";

const INTENT_MESSAGE = {
  donate: "Log in or register to donate blood.",
  request: "Log in or register to request blood.",
  respond: "Log in or register to respond to this request.",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home | explore | organ | auth
  const [authIntent, setAuthIntent] = useState(null);

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
    setView("home");
    setAuthIntent(null);
  }

  function goAuth(intent) {
    setAuthIntent(intent || null);
    setView("auth");
  }

  if (loading) return <div className="center">Loading…</div>;

  // Logged-out flow: Home -> Explore -> Auth (auth only on Donate/Request).
  if (!user) {
    if (view === "home") return <Home onGetStarted={() => setView("explore")} />;
    if (view === "explore")
      return (
        <Explore
          onHome={() => setView("home")}
          onAuth={goAuth}
          onOrgan={() => setView("organ")}
        />
      );
    if (view === "organ")
      return <OrganInfo onBack={() => setView("explore")} onAuth={goAuth} />;
    return (
      <div className="app">
        <header className="header">
          <h1>🩺 SaveLife</h1>
          <button className="ghost" onClick={() => setView("explore")}>
            ← Explore
          </button>
        </header>
        {authIntent && INTENT_MESSAGE[authIntent] && (
          <p className="intent-banner">{INTENT_MESSAGE[authIntent]}</p>
        )}
        <AuthFlow onAuthed={setUser} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🩺 SaveLife</h1>
        <div className="userbar">
          <span>{user.name}</span>
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <DonorProfile user={user} />
    </div>
  );
}

/* ----------------------------- Auth flow ----------------------------- */

function AuthFlow({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [creds, setCreds] = useState(null); // { user_code, password }
  const [pendingUser, setPendingUser] = useState(null);

  // After registering, show the generated credentials before entering the app.
  if (creds) {
    return (
      <CredentialsReveal
        creds={creds}
        user={pendingUser}
        onContinue={() => onAuthed(pendingUser)}
      />
    );
  }

  if (mode === "register") {
    return (
      <RegisterForm
        switchToLogin={() => setMode("login")}
        onRegistered={({ credentials, user, token }) => {
          auth.setToken(token);
          setPendingUser(user);
          setCreds(credentials);
        }}
      />
    );
  }

  return <LoginForm onAuthed={onAuthed} switchToRegister={() => setMode("register")} />;
}

function LoginForm({ onAuthed, switchToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Backend matches on email; send it as the identifier.
      const { token, user } = await api.login({
        identifier: form.email,
        password: form.password,
      });
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
      <h2>Donor login</h2>
      <p className="hint">Log in with your email and the password you received when you signed up.</p>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={set("email")}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={set("password")}
        required
      />
      {error && <p className="error">{error}</p>}
      <button disabled={busy} type="submit">
        {busy ? "…" : "Log in"}
      </button>
      <p className="switch">
        New donor?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); switchToRegister(); }}>
          Create an account
        </a>
      </p>
    </form>
  );
}

function RegisterForm({ onRegistered, switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    weight: "",
    blood_type: "",
    donation_count: "",
    last_donation: "",
    donation_history: "",
    drug_addicted: "no",
    medical_conditions: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{11}$/.test(form.phone)) {
      setError("Phone must be an 11-digit number (e.g. 01712345678).");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, drug_addicted: form.drug_addicted === "yes" };
      const result = await api.register(payload);
      onRegistered(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Become a donor</h2>
      <p className="hint">
        Fill in your details. We'll generate a User ID and password for you — no
        need to choose one.
      </p>

      <label className="field-label">Full name *</label>
      <input placeholder="Your full name" value={form.name} onChange={set("name")} required />

      <div className="row">
        <div className="col">
          <label className="field-label">Email *</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
        </div>
        <div className="col">
          <label className="field-label">Phone (11 digits) *</label>
          <input
            placeholder="01712345678"
            value={form.phone}
            onChange={set("phone")}
            inputMode="numeric"
            maxLength={11}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label className="field-label">Age</label>
          <input type="number" min="0" placeholder="Age" value={form.age} onChange={set("age")} />
        </div>
        <div className="col">
          <label className="field-label">Gender</label>
          <select value={form.gender} onChange={set("gender")}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div className="col">
          <label className="field-label">Weight (kg)</label>
          <input type="number" min="0" step="0.1" placeholder="Weight" value={form.weight} onChange={set("weight")} />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label className="field-label">Blood group</label>
          <select value={form.blood_type} onChange={set("blood_type")}>
            <option value="">Select</option>
            {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="col">
          <label className="field-label">Times donated before</label>
          <input type="number" min="0" placeholder="0" value={form.donation_count} onChange={set("donation_count")} />
        </div>
        <div className="col">
          <label className="field-label">Last donation date</label>
          <input type="date" value={form.last_donation} onChange={set("last_donation")} />
        </div>
      </div>

      <label className="field-label">Donation history (optional)</label>
      <textarea
        rows={2}
        placeholder="e.g. Donated blood twice in 2024 at Dhaka Medical"
        value={form.donation_history}
        onChange={set("donation_history")}
      />

      <label className="field-label">Are you drug addicted?</label>
      <div className="toggle">
        <button
          type="button"
          className={form.drug_addicted === "no" ? "on" : ""}
          onClick={() => setForm({ ...form, drug_addicted: "no" })}
        >
          No
        </button>
        <button
          type="button"
          className={form.drug_addicted === "yes" ? "on danger" : ""}
          onClick={() => setForm({ ...form, drug_addicted: "yes" })}
        >
          Yes
        </button>
      </div>

      <label className="field-label">Any sickness / medical conditions?</label>
      <textarea
        rows={2}
        placeholder="e.g. Diabetes, hepatitis, none"
        value={form.medical_conditions}
        onChange={set("medical_conditions")}
      />

      {error && <p className="error">{error}</p>}
      <button disabled={busy} type="submit">
        {busy ? "Creating account…" : "Create my donor account"}
      </button>
      <p className="switch">
        Already registered?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }}>
          Log in
        </a>
      </p>
    </form>
  );
}

function CredentialsReveal({ creds, user, onContinue }) {
  const [copied, setCopied] = useState("");
  function copy(label, value) {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }
  return (
    <div className="card creds-card">
      <h2>🎉 Account created!</h2>
      <p className="warn">
        Log in with your <strong>email and password</strong>. Save the password —
        it's shown <strong>only once</strong>.
      </p>
      <div className="cred">
        <span className="cred-label">Email</span>
        <code>{user.email}</code>
        <button className="ghost" onClick={() => copy("em", user.email)}>
          {copied === "em" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="cred">
        <span className="cred-label">Password</span>
        <code>{creds.password}</code>
        <button className="ghost" onClick={() => copy("pw", creds.password)}>
          {copied === "pw" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="cred">
        <span className="cred-label">Donor ID</span>
        <code>{creds.user_code}</code>
        <button className="ghost" onClick={() => copy("id", creds.user_code)}>
          {copied === "id" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="hint">Your Donor ID identifies you for donation matching.</p>
      <button onClick={onContinue}>Continue to my profile →</button>
    </div>
  );
}

/* ---------------------------- Donor profile ---------------------------- */

function DonorProfile({ user }) {
  const rows = [
    ["User ID", user.user_code],
    ["Name", user.name],
    ["Phone", user.phone],
    ["Email", user.email],
    ["Age", user.age],
    ["Gender", user.gender],
    ["Weight", user.weight ? `${user.weight} kg` : null],
    ["Blood group", user.blood_type],
    ["Times donated", user.donation_count ?? 0],
    ["Last donation", user.last_donation ? new Date(user.last_donation).toLocaleDateString() : null],
    ["Donation history", user.donation_history],
    ["Drug addicted", user.drug_addicted ? "Yes" : "No"],
    ["Medical conditions", user.medical_conditions],
    ["Member since", user.created_at ? new Date(user.created_at).toLocaleDateString() : null],
  ];

  const initials = (user.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="card profile-card">
      <div className="profile-head">
        <div className="avatar">{initials}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="hint">
            {user.blood_type ? `🩸 ${user.blood_type} · ` : ""}Donor ID: {user.user_code}
          </p>
        </div>
      </div>

      <table className="profile-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>
                {value === null || value === undefined || value === "" ? (
                  <span className="muted">—</span>
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
