import { useEffect, useState } from "react";
import { api, auth } from "./api";
import Home from "./Home";
import Explore from "./Explore";
import OrganInfo from "./OrganInfo";
import Hospitals from "./Hospitals";
import Ambulance from "./Ambulance";
import Profile from "./Profile";
import Doctors from "./Doctors";
import Medicines from "./Medicines";
import "./App.css";

const INTENT_MESSAGE = {
  donate: "Log in or register to donate blood.",
  request: "Log in or register to request blood.",
  respond: "Log in or register to respond to this request.",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function App() {
  const [user, setUser] = useState(null);
  const [emailNotifications, setEmailNotifications] = useState(false);
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
      .then((d) => { setUser(d.user); setEmailNotifications(d.emailNotifications ?? false); })
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

  // Login or signup: store the user and land on the Explore page.
  function onAuthed(u) {
    setUser(u);
    setAuthIntent(null);
    setView("explore");
  }

  if (loading) return <div className="center">Loading…</div>;

  // ---- Logged-in: Explore is home; Profile and Organ are reachable from it ----
  if (user) {
    if (view === "organ")
      return <OrganInfo onBack={() => setView("explore")} onAuth={() => setView("profile")} />;
    if (view === "hospitals")
      return <Hospitals user={user} onBack={() => setView("explore")} onAuth={goAuth} />;
    if (view === "ambulance")
      return <Ambulance onBack={() => setView("explore")} />;
    if (view === "doctors")
      return <Doctors user={user} onBack={() => setView("explore")} onAuth={goAuth} />;
    if (view === "medicines")
      return <Medicines user={user} onBack={() => setView("explore")} onAuth={goAuth} />;
    if (view === "profile")
      return (
        <Profile
          user={user}
          emailNotifications={emailNotifications}
          onBack={() => setView("explore")}
          onLogout={logout}
          onUserUpdate={(u) => setUser(u)}
        />
      );
    return (
      <Explore
        user={user}
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onOrgan={() => setView("organ")}
        onProfile={() => setView("profile")}
        onLogout={logout}
        onHospitals={() => setView("hospitals")}
        onAmbulance={() => setView("ambulance")}
        onDoctors={() => setView("doctors")}
        onMedicines={() => setView("medicines")}
      />
    );
  }

  // ---- Logged-out: Home -> Explore -> Auth (auth only on Donate/Request) ----
  if (view === "home") return <Home onGetStarted={() => setView("explore")} />;
  if (view === "explore")
    return (
      <Explore
        onHome={() => setView("home")}
        onAuth={goAuth}
        onOrgan={() => setView("organ")}
        onHospitals={() => setView("hospitals")}
        onAmbulance={() => setView("ambulance")}
        onDoctors={() => setView("doctors")}
        onMedicines={() => setView("medicines")}
      />
    );
  if (view === "organ")
    return <OrganInfo onBack={() => setView("explore")} onAuth={goAuth} />;
  if (view === "hospitals")
    return <Hospitals user={null} onBack={() => setView("explore")} onAuth={goAuth} />;
  if (view === "ambulance")
    return <Ambulance onBack={() => setView("explore")} />;
  if (view === "doctors")
    return <Doctors user={null} onBack={() => setView("explore")} onAuth={goAuth} />;
  if (view === "medicines")
    return <Medicines user={null} onBack={() => setView("explore")} onAuth={goAuth} />;
  return (
    <div className="app">
      <header className="header">
        <h1>🩺 SaveLife</h1>
        <button className="ghost" onClick={() => setView("explore")}>← Explore</button>
      </header>
      {authIntent && INTENT_MESSAGE[authIntent] && (
        <p className="intent-banner">{INTENT_MESSAGE[authIntent]}</p>
      )}
      <AuthFlow onAuthed={onAuthed} />
    </div>
  );
}

/* ----------------------------- Auth flow ----------------------------- */

function AuthFlow({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  if (mode === "register") {
    return (
      <RegisterForm
        switchToLogin={() => setMode("login")}
        onRegistered={({ user, token }) => {
          // Auto-login: store the token and enter the app immediately.
          auth.setToken(token);
          onAuthed(user);
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
      <p className="hint">Log in with the email and password you chose when you signed up.</p>
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
    password: "",
    confirm: "",
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
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { confirm, ...rest } = form;
      const payload = { ...rest, drug_addicted: form.drug_addicted === "yes" };
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
        Fill in your details and choose a password — you'll log in with your
        email and password. We'll also give you a Donor ID for matching.
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
          <label className="field-label">Password * (min 6 chars)</label>
          <input type="password" placeholder="Choose a password" value={form.password} onChange={set("password")} required />
        </div>
        <div className="col">
          <label className="field-label">Confirm password *</label>
          <input type="password" placeholder="Re-enter password" value={form.confirm} onChange={set("confirm")} required />
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

