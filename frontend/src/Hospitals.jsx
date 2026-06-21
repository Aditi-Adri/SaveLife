import { useEffect, useState } from "react";
import { api } from "./api";
import LeafletMap from "./LeafletMap";
import { distanceKm, fmtKm, getCurrentLocation, fetchRoute } from "./geo";
import "./Hospitals.css";

const FACILITIES = [
  { key: "all", label: "All" },
  { key: "blood", label: "🩸 Blood bank" },
  { key: "ambulance", label: "🚑 Ambulance" },
  { key: "beds", label: "🛏 Beds available" },
];

function matchesFacility(h, key) {
  if (key === "blood") return h.has_blood_bank;
  if (key === "ambulance") return h.has_ambulance;
  if (key === "beds") return h.beds_available > 0;
  return true;
}

export default function Hospitals({ user, onBack, onAuth }) {
  const [hospitals, setHospitals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [bookingFor, setBookingFor] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [facility, setFacility] = useState("all");
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routingId, setRoutingId] = useState(null);

  function loadBookings() {
    if (!user) return;
    api.myBookings().then((d) => setBookings(d.bookings)).catch(() => {});
  }

  useEffect(() => {
    api.publicHospitals().then((d) => setHospitals(d.hospitals)).catch((e) => setError(e.message));
    loadBookings();
  }, []);

  async function useMyLocation() {
    setLocating(true);
    setError("");
    try {
      setUserLocation(await getCurrentLocation());
    } catch (e) {
      setError(e.message);
    } finally {
      setLocating(false);
    }
  }

  async function directions(h) {
    if (!userLocation) {
      setError("Tap “Use my location” first to get directions.");
      return;
    }
    if (h.latitude == null) return;
    setRoutingId(h.id);
    setError("");
    try {
      const r = await fetchRoute(userLocation, { lat: h.latitude, lng: h.longitude });
      if (!r) {
        setError("No route found to this hospital.");
        return;
      }
      setRoute(r.coords);
      setRouteInfo({ name: h.name, km: r.km, min: r.min });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setRoutingId(null);
    }
  }

  // Filter by facility, attach distance, and sort nearest-first when located.
  const filtered = hospitals
    .filter((h) => matchesFacility(h, facility))
    .map((h) => ({
      ...h,
      distance:
        userLocation && h.latitude != null
          ? distanceKm(userLocation, { lat: h.latitude, lng: h.longitude })
          : null,
    }));
  const ordered = userLocation
    ? [...filtered].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : filtered;

  const markers = ordered
    .filter((h) => h.latitude != null)
    .map((h) => ({
      id: h.id,
      lat: h.latitude,
      lng: h.longitude,
      label: "🏥",
      popupHtml: `<b>${h.name}</b><br>${h.city || ""}<br>${h.beds_available} beds` +
        (h.distance != null ? `<br>~${fmtKm(h.distance)} away` : ""),
    }));

  return (
    <div className="hosp">
      <header className="hosp-nav">
        <a className="brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
        <button className="btn btn-outline" onClick={onBack}>← Back</button>
      </header>

      <section className="hosp-hero">
        <h1>🏥 Book a Hospital</h1>
        <p>Find hospitals by facility, see the nearest to you, and get directions.</p>
      </section>

      {error && <p className="hosp-error">{error}</p>}

      {/* Controls: location + facility filter */}
      <section className="hosp-section">
        <div className="hosp-controls">
          <button className="btn btn-primary btn-sm" disabled={locating} onClick={useMyLocation}>
            {locating ? "Locating…" : userLocation ? "📍 Location set — nearest first" : "📍 Use my location"}
          </button>
          <div className="facility-chips">
            {FACILITIES.map((f) => (
              <button
                key={f.key}
                className={`chip ${facility === f.key ? "chip-on" : ""}`}
                onClick={() => setFacility(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {routeInfo && (
          <div className="route-banner">
            🧭 Route to <strong>{routeInfo.name}</strong>: {fmtKm(routeInfo.km)} · ~{routeInfo.min} min by car
            <button className="route-clear" onClick={() => { setRoute(null); setRouteInfo(null); }}>✕ clear</button>
          </div>
        )}

        {markers.length > 0 && (
          <LeafletMap markers={markers} userLocation={userLocation} route={route} height={320} />
        )}
      </section>

      {/* Logged-in user's bookings */}
      {user && bookings.length > 0 && (
        <section className="hosp-section">
          <h2>My bookings</h2>
          <div className="booking-list">
            {bookings.map((b) => (
              <div className="booking-row" key={b.id}>
                <div>
                  <strong>{b.hospital_name}</strong> · {b.hospital_city}
                  <p>
                    {b.patient_name}
                    {b.booking_date ? ` · ${new Date(b.booking_date).toLocaleDateString()}` : ""}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </p>
                </div>
                <span className={`bk-badge bk-${b.status}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="hosp-section">
        <h2>Hospitals {facility !== "all" && <span className="hosp-count">({ordered.length})</span>}</h2>
        <div className="hosp-grid">
          {ordered.map((h) => {
            const mapsHref = userLocation
              ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${h.latitude},${h.longitude}`
              : `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`;
            return (
              <div className="hosp-card" key={h.id}>
                <h3>{h.name}</h3>
                <p className="hosp-where">📍 {h.address || h.city}</p>
                {h.distance != null && <p className="hosp-dist">🧭 ~{fmtKm(h.distance)} away</p>}
                <div className="hosp-badges">
                  <span className="hb">🛏 {h.beds_available} beds</span>
                  {h.has_blood_bank && <span className="hb ok">🩸 Blood bank</span>}
                  {h.has_ambulance && <span className="hb ok">🚑 Ambulance</span>}
                </div>
                {h.email && (
                  <p className="hosp-email">✉️ <a href={`mailto:${h.email}`}>{h.email}</a></p>
                )}
                <div className="hosp-actions">
                  {h.phone && <a className="btn btn-outline btn-sm" href={`tel:${h.phone}`}>📞 Call</a>}
                  {h.latitude != null && (
                    <button className="btn btn-outline btn-sm" disabled={routingId === h.id} onClick={() => directions(h)}>
                      {routingId === h.id ? "…" : "🧭 Directions"}
                    </button>
                  )}
                  {h.latitude != null && (
                    <a className="btn btn-outline btn-sm" href={mapsHref} target="_blank" rel="noreferrer">↗ Maps</a>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => (user ? setBookingFor(h) : onAuth("book"))}>
                    Book
                  </button>
                </div>
              </div>
            );
          })}
          {ordered.length === 0 && <p className="hosp-error">No hospitals match this filter.</p>}
        </div>
      </section>

      {bookingFor && (
        <BookingModal
          hospital={bookingFor}
          defaultName={user?.name}
          onClose={() => setBookingFor(null)}
          onBooked={() => { setBookingFor(null); loadBookings(); }}
        />
      )}
    </div>
  );
}

function BookingModal({ hospital, defaultName, onClose, onBooked }) {
  const [form, setForm] = useState({ patient_name: defaultName || "", reason: "", booking_date: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.bookHospital(hospital.id, form);
      onBooked();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Book {hospital.name}</h3>
        <label className="field-label">Patient name *</label>
        <input value={form.patient_name} onChange={set("patient_name")} required />
        <label className="field-label">Reason</label>
        <input placeholder="e.g. Surgery, transfusion" value={form.reason} onChange={set("reason")} />
        <label className="field-label">Preferred date</label>
        <input type="date" value={form.booking_date} onChange={set("booking_date")} />
        {error && <p className="hosp-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
