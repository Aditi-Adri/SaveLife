import { useEffect, useState } from "react";
import { api } from "./api";
import LeafletMap from "./LeafletMap";
import "./Explore.css";

const HOW_IT_WORKS = [
  { n: "1", title: "Browse or post", text: "See urgent blood requests near you, or post your own when you need blood." },
  { n: "2", title: "Get matched", text: "Use your location to find the nearest compatible requests by distance." },
  { n: "3", title: "Connect & donate", text: "Accept a request to reveal the contact and coordinate to save a life." },
];

const URGENCY_LABEL = { critical: "Critical", urgent: "Urgent", normal: "Normal" };

// Haversine distance in km between two {lat,lng} points.
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtKm(km) {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export default function Explore({ user, onHome, onAuth, onOrgan, onProfile, onLogout }) {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState({});
  const [revealing, setRevealing] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    Promise.all([api.publicStats(), api.publicRequests()])
      .then(([s, r]) => {
        setStats(s);
        setRequests(r.requests);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function accept(id) {
    if (!user) return onAuth("respond");
    setRevealing(id);
    try {
      const data = await api.requestContact(id);
      setRevealed((m) => ({ ...m, [id]: data }));
    } catch (e) {
      setError(e.message);
    } finally {
      setRevealing(null);
    }
  }

  function findNearest() {
    if (!navigator.geolocation) {
      setLocError("Geolocation isn't supported by your browser.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Couldn't get your location. Please allow location access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Attach distance (if we know the user's location) and sort nearest-first.
  const decorated = requests.map((r) => {
    const hasGeo = r.latitude != null && r.longitude != null;
    const distance =
      userLocation && hasGeo
        ? distanceKm(userLocation, { lat: r.latitude, lng: r.longitude })
        : null;
    return { ...r, hasGeo, distance };
  });
  const ordered = userLocation
    ? [...decorated].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : decorated;

  const markers = decorated
    .filter((r) => r.hasGeo)
    .map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      label: r.blood_type,
      popupHtml:
        `<b>${r.blood_type}</b> · ${r.units_needed} unit(s)<br>` +
        `${[r.hospital, r.location].filter(Boolean).join(", ")}` +
        (r.distance != null ? `<br>~${fmtKm(r.distance)} away` : ""),
    }));

  return (
    <div className="explore">
      <header className="ex-nav">
        <a className="brand" onClick={onHome} role="button">
          🩺 <span>SaveLife</span>
        </a>
        <div className="ex-nav-actions">
          <a className="ex-navlink" onClick={onOrgan} role="button">Organ Donation</a>
          {user ? (
            <>
              <span className="ex-greet">Hi, {user.name.split(" ")[0]}</span>
              <button className="btn btn-outline" onClick={onProfile}>My Profile</button>
              <button className="btn btn-primary" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => onAuth("request")}>Request Blood</button>
              <button className="btn btn-primary" onClick={() => onAuth("donate")}>Donate</button>
            </>
          )}
        </div>
      </header>

      <section className="ex-hero">
        <h1>Explore SaveLife</h1>
        <p>Browse live blood requests on the map and find the ones nearest to you.</p>
      </section>

      {/* Stats */}
      <section className="ex-stats">
        <Stat value={stats?.donors} label="Registered donors" />
        <Stat value={stats?.openRequests} label="Open requests" />
        <Stat value={stats?.criticalRequests} label="Critical now" accent />
        <Stat value={stats?.unitsNeeded} label="Units needed" />
      </section>

      {/* Urgent requests + map */}
      <section className="ex-section">
        <div className="ex-head">
          <h2>🩸 Urgent blood requests</h2>
          <button className="btn btn-sm btn-outline" disabled={locating} onClick={findNearest}>
            {locating ? "Locating…" : "📍 Find nearest to me"}
          </button>
        </div>
        {locError && <p className="ex-error">{locError}</p>}
        {userLocation && <p className="ex-muted">Showing distance from your location · nearest first.</p>}

        {/* Live map of all requests */}
        {markers.length > 0 && (
          <LeafletMap markers={markers} userLocation={userLocation} height={340} />
        )}

        {error && <p className="ex-error">{error}</p>}
        {!error && requests.length === 0 && <p className="ex-muted">No open requests right now.</p>}

        <div className="req-grid">
          {ordered.map((r) => {
            const info = revealed[r.id];
            return (
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
                {r.distance != null && <p className="req-distance">🧭 ~{fmtKm(r.distance)} away</p>}
                <p className={`req-phone ${info ? "revealed" : ""}`}>
                  📞 {info ? <a href={`tel:${info.contact_phone}`}>{info.contact_phone}</a> : "**********"}
                </p>
                {info && <p className="req-patient">Patient: {info.patient_name}</p>}
                <p className="req-time">{timeAgo(r.created_at)}</p>
                {!info && (
                  <button
                    className={`btn btn-sm ${user ? "btn-primary" : "btn-outline"}`}
                    disabled={revealing === r.id}
                    onClick={() => accept(r.id)}
                  >
                    {revealing === r.id ? "…" : user ? "Accept to donate — show contact" : "Log in to donate"}
                  </button>
                )}
              </div>
            );
          })}
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
      {!user && (
        <section className="ex-cta">
          <h2>Ready to make a difference?</h2>
          <p>Create a free account to donate or request blood.</p>
          <div className="ex-cta-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => onAuth("donate")}>Donate Blood</button>
            <button className="btn btn-outline btn-lg" onClick={() => onAuth("request")}>Request Blood</button>
          </div>
          <button className="ex-back" onClick={onHome}>← Back to home</button>
        </section>
      )}
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
