import { useState, useEffect } from "react";
import { api, getLocation } from "./api";
import "./SOS.css";

const BD_EMERGENCY = [
  { label: "Police",    number: "999",   emoji: "🚔" },
  { label: "Ambulance", number: "16430", emoji: "🚑" },
  { label: "Fire",      number: "199",   emoji: "🚒" },
  { label: "DGHS",      number: "16257", emoji: "🏥" },
];

export default function SOSWidget({ user }) {
  const [stage, setStage]       = useState("idle"); // idle|confirm|loading|active|safe
  const [alertId, setAlertId]   = useState(null);
  const [loc, setLoc]           = useState(null);
  const [contacts, setContacts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [notified, setNotified] = useState(false);
  const [err, setErr]           = useState("");
  const [secs, setSecs]         = useState(0);

  useEffect(() => {
    if (user) api.listContacts().then(d => setContacts(d.contacts || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (stage !== "active") return;
    setSecs(0);
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [stage]);

  async function trigger() {
    setStage("loading");
    setErr("");

    const position = await getLocation();
    setLoc(position);

    if (position.latitude) {
      api.publicHospitals().then(d => {
        const sorted = (d.hospitals || [])
          .filter(h => h.latitude && h.longitude)
          .map(h => {
            const cosLat = Math.cos(position.latitude * Math.PI / 180);
            const dist = Math.sqrt(
              Math.pow((position.latitude - h.latitude) * 111, 2) +
              Math.pow((position.longitude - h.longitude) * 111 * cosLat, 2)
            );
            return { ...h, dist };
          })
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 5);
        setHospitals(sorted);
      }).catch(() => {});
    }

    try {
      const { alert } = await api.raiseAlert({
        type: "medical",
        latitude: position.latitude,
        longitude: position.longitude,
        message: "SOS from SaveLife app",
      });
      setAlertId(alert.id);
      setNotified(true);
    } catch {
      setErr("Network issue — alert could not be logged");
    }

    setStage("active");
  }

  async function markSafe() {
    if (alertId) { try { await api.cancelAlert(alertId); } catch {} }
    setStage("safe");
    setTimeout(() => {
      setStage("idle");
      setAlertId(null);
      setLoc(null);
      setNotified(false);
      setErr("");
      setSecs(0);
    }, 2200);
  }

  const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const mapsUrl = loc?.latitude
    ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
    : null;

  if (!user) return null;

  return (
    <>
      {stage === "idle" && (
        <button className="sos-fab" onClick={() => setStage("confirm")} title="Emergency SOS">
          <span>🚨</span>
          <span className="sos-fab-label">SOS</span>
        </button>
      )}

      {stage !== "idle" && (
        <div className="sos-overlay">

          {stage === "confirm" && (
            <div className="sos-dialog">
              <div className="sos-icon-big">🚨</div>
              <h2>Send Emergency Alert?</h2>
              <p>
                This will get your GPS location, log an emergency alert, notify
                your saved contacts, and show nearby hospitals &amp; emergency numbers.
              </p>
              {contacts.length > 0 && (
                <p className="sos-contacts-preview">
                  {contacts.length} contact{contacts.length > 1 ? "s" : ""} will be shown:{" "}
                  {contacts.map(c => c.name).join(", ")}
                </p>
              )}
              <div className="sos-dialog-actions">
                <button className="sos-btn-cancel" onClick={() => setStage("idle")}>Not now</button>
                <button className="sos-btn-go" onClick={trigger}>🚨 YES, SEND SOS</button>
              </div>
            </div>
          )}

          {stage === "loading" && (
            <div className="sos-dialog">
              <div className="sos-icon-big sos-bounce">📍</div>
              <h2>Getting your location…</h2>
              <p>Please allow location access if prompted</p>
            </div>
          )}

          {stage === "active" && (
            <div className="sos-active-panel">
              <div className="sos-active-header">
                <div className="sos-pulse-dot" />
                <div>
                  <h1>🚨 SOS ACTIVE</h1>
                  <span className="sos-timer">{elapsed}</span>
                </div>
              </div>

              <div className="sos-card">
                <div className="sos-card-title">📍 Your Location</div>
                {loc?.latitude ? (
                  <div className="sos-loc-row">
                    <span className="sos-coords">
                      {loc.latitude.toFixed(5)}°N,&nbsp;{loc.longitude.toFixed(5)}°E
                    </span>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="sos-maps-btn">
                      Open Maps ↗
                    </a>
                  </div>
                ) : (
                  <span className="sos-muted">Location unavailable — share your address manually</span>
                )}
              </div>

              <div className="sos-card">
                <div className="sos-card-title">📞 Emergency Numbers (Bangladesh)</div>
                <div className="sos-nums-grid">
                  {BD_EMERGENCY.map(n => (
                    <a key={n.number} href={`tel:${n.number}`} className="sos-num-btn">
                      <span className="sos-num-emoji">{n.emoji}</span>
                      <span className="sos-num-label">{n.label}</span>
                      <strong className="sos-num-num">{n.number}</strong>
                    </a>
                  ))}
                </div>
              </div>

              <div className="sos-card">
                <div className="sos-card-title">
                  {notified ? "✅ Alert Logged & Email Sent" : "⏳ Logging Alert…"}
                </div>
                {contacts.length === 0 ? (
                  <p className="sos-muted">
                    No emergency contacts saved.{" "}
                    Add them in <strong>Profile → Emergency</strong>.
                  </p>
                ) : (
                  contacts.map(c => (
                    <div key={c.id} className="sos-contact-row">
                      <div>
                        <strong>{c.name}</strong>
                        {c.relationship && <span className="sos-muted"> ({c.relationship})</span>}
                      </div>
                      <a href={`tel:${c.phone}`} className="sos-call-pill">📞 {c.phone}</a>
                    </div>
                  ))
                )}
              </div>

              {hospitals.length > 0 && (
                <div className="sos-card">
                  <div className="sos-card-title">🏥 Nearest Hospitals</div>
                  {hospitals.map(h => (
                    <div key={h.id} className="sos-hosp-row">
                      <div>
                        <strong>{h.name}</strong>
                        <span className="sos-muted"> · {h.city}</span>
                      </div>
                      <div className="sos-hosp-right">
                        <span className="sos-dist">{h.dist.toFixed(1)} km</span>
                        {h.phone && (
                          <a href={`tel:${h.phone}`} className="sos-call-pill-sm">{h.phone}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {err && <p className="sos-err">{err}</p>}

              <button className="sos-safe-btn" onClick={markSafe}>
                ✅ I'm Safe — Cancel Alert
              </button>
            </div>
          )}

          {stage === "safe" && (
            <div className="sos-dialog">
              <div className="sos-icon-big">✅</div>
              <h2>Alert Cancelled</h2>
              <p>Glad you're safe! Take care. ❤️</p>
            </div>
          )}

        </div>
      )}
    </>
  );
}
