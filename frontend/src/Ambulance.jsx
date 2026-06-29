import { useEffect, useState } from "react";
import { api } from "./api";
import ThemeToggle from "./ThemeToggle";
import "./Ambulance.css";

export default function Ambulance({ onBack }) {
  const [ambulances, setAmbulances] = useState([]);
  const [city, setCity] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    api.publicAmbulances().then((d) => setAmbulances(d.ambulances)).catch((e) => setError(e.message));
  }, []);

  const national = ambulances.find((a) => a.phone === "999");
  const others = ambulances.filter((a) => a.phone !== "999");
  const cities = ["All", ...Array.from(new Set(others.map((a) => a.city)))];
  const shown = city === "All" ? others : others.filter((a) => a.city === city);

  return (
    <div className="amb">
      <header className="amb-nav">
        <a className="brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
        <div style={{ flex: 1 }} />
        <ThemeToggle />
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </header>

      <section className="amb-hero">
        <span className="amb-tag">🚑 Emergency</span>
        <h1>Call an Ambulance</h1>
        <p>In a medical emergency, call immediately. Tap a number to dial.</p>
      </section>

      {/* National emergency banner */}
      {national && (
        <a className="amb-emergency" href={`tel:${national.phone}`}>
          <div>
            <small>National Emergency Service</small>
            <strong>{national.phone}</strong>
          </div>
          <span className="amb-call-big">📞 Call now</span>
        </a>
      )}

      {error && <p className="amb-error">{error}</p>}

      <section className="amb-section">
        <div className="amb-head">
          <h2>Ambulance services</h2>
          {cities.length > 2 && (
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="amb-grid">
          {shown.map((a) => (
            <div className="amb-card" key={a.id}>
              <div>
                <h3>{a.name}</h3>
                <p>📍 {a.city}{a.available_24_7 ? " · 🕒 24/7" : ""}</p>
                <p className="amb-phone">{a.phone}</p>
                {a.email && <p className="amb-email">✉️ <a href={`mailto:${a.email}`}>{a.email}</a></p>}
              </div>
              <a className="btn btn-primary" href={`tel:${a.phone}`}>📞 Call</a>
            </div>
          ))}
          {shown.length === 0 && <p className="amb-muted">No services listed for this city.</p>}
        </div>
      </section>

      <p className="amb-disclaimer">
        If this is a life-threatening emergency, call your national emergency number immediately.
        SaveLife lists contacts for convenience but is not an emergency dispatch service.
      </p>
    </div>
  );
}
