import { useEffect, useState } from "react";
import { api } from "./api";
import "./Explore.css";

const HOW_IT_WORKS = [
  { n: "1", title: "Browse or post", text: "See urgent blood requests near you, or post your own when you need blood." },
  { n: "2", title: "Get matched", text: "We match requests with compatible donors by blood type and location." },
  { n: "3", title: "Connect & donate", text: "Log in to reveal contact details, coordinate, and save a life." },
];

const URGENCY_LABEL = { critical: "Critical", urgent: "Urgent", normal: "Normal" };

export default function Explore({ onHome, onAuth, onOrgan }) {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.publicStats(), api.publicRequests()])
      .then(([s, r]) => {
        setStats(s);
        setRequests(r.requests);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="explore">
      <header className="ex-nav">
        <a className="brand" onClick={onHome} role="button">
          🩺 <span>SaveLife</span>
        </a>
        <div className="ex-nav-actions">
          <a className="ex-navlink" onClick={onOrgan} role="button">Organ Donation</a>
          <button className="btn btn-outline" onClick={() => onAuth("request")}>
            Request Blood
          </button>
          <button className="btn btn-primary" onClick={() => onAuth("donate")}>
            Donate
          </button>
        </div>
      </header>

      <section className="ex-hero">
        <h1>Explore SaveLife</h1>
        <p>Browse live blood requests and see our community — no account needed to look around.</p>
      </section>

      {/* Stats */}
      <section className="ex-stats">
        <Stat value={stats?.donors} label="Registered donors" />
        <Stat value={stats?.openRequests} label="Open requests" />
        <Stat value={stats?.criticalRequests} label="Critical now" accent />
        <Stat value={stats?.unitsNeeded} label="Units needed" />
      </section>

      {/* Urgent requests (read-only) */}
      <section className="ex-section">
        <div className="ex-head">
          <h2>🩸 Urgent blood requests</h2>
          <span className="ex-readonly">Read-only · log in to respond</span>
        </div>
        {error && <p className="ex-error">{error}</p>}
        {!error && requests.length === 0 && <p className="ex-muted">No open requests right now.</p>}
        <div className="req-grid">
          {requests.map((r) => (
            <div className={`req-card urg-${r.urgency}`} key={r.id}>
              <div className="req-top">
                <span className="blood-badge">{r.blood_type}</span>
                <span className={`urg-badge urg-${r.urgency}`}>{URGENCY_LABEL[r.urgency] || r.urgency}</span>
              </div>
              <p className="req-units">{r.units_needed} unit{r.units_needed > 1 ? "s" : ""} needed</p>
              <p className="req-where">
                {r.hospital ? `🏥 ${r.hospital}` : ""}
                {r.location ? ` · 📍 ${r.location}` : ""}
              </p>
              <p className="req-time">{timeAgo(r.created_at)}</p>
              <button className="btn btn-sm btn-outline" onClick={() => onAuth("respond")}>
                Log in to help
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Organ donation awareness teaser */}
      <section className="ex-section">
        <div className="og-teaser">
          <div>
            <h2>🫀 Learn about organ donation</h2>
            <p>One donor can save up to 8 lives. Read our awareness guide — no account needed.</p>
          </div>
          <button className="btn btn-outline" onClick={onOrgan}>Read more →</button>
        </div>
      </section>

      {/* How it works */}
      <section className="ex-section alt">
        <div className="ex-head"><h2>How it works</h2></div>
        <div className="how-grid">
          {HOW_IT_WORKS.map((s) => (
            <div className="how-card" key={s.n}>
              <div className="how-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ex-cta">
        <h2>Ready to make a difference?</h2>
        <p>Create a free account to donate or request blood.</p>
        <div className="ex-cta-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => onAuth("donate")}>
            Donate Blood
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onAuth("request")}>
            Request Blood
          </button>
        </div>
        <button className="ex-back" onClick={onHome}>← Back to home</button>
      </section>
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div className={`ex-stat ${accent ? "accent" : ""}`}>
      <strong>{value ?? "—"}</strong>
      <span>{label}</span>
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
