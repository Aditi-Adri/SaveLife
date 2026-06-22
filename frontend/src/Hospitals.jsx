import { useEffect, useState } from "react";
import { api } from "./api";
import LeafletMap from "./LeafletMap";
import { distanceKm, fmtKm, getCurrentLocation, fetchRoute } from "./geo";
import { generatePrivateSlip, generatePublicSlip } from "./generateSlip";
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
  const [registeringHospital, setRegisteringHospital] = useState(false);

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
            {bookings.map((b) => {
              function slipDownload() {
                const hosp = {
                  name: b.hospital_name, city: b.hospital_city,
                  address: b.hospital_address, phone: b.hospital_phone,
                  hospital_type: b.hospital_type,
                };
                try {
                  if (b.hospital_type === "private") {
                    generatePrivateSlip(b, hosp, { method: b.payment_method, ref: b.payment_ref });
                  } else {
                    generatePublicSlip(b, hosp);
                  }
                } catch (err) {
                  console.error("PDF error:", err);
                  alert("PDF error: " + err.message);
                }
              }
              return (
                <div className="booking-row" key={b.id}>
                  <div className="bk-info">
                    <div className="bk-top">
                      <strong>{b.hospital_name}</strong>
                      <span className={`bk-badge bk-${b.status}`}>{b.status}</span>
                      <span className={`bk-badge ${b.hospital_type === "private" ? "bk-private" : "bk-public"}`}>
                        {b.hospital_type === "private" ? "Private" : "Public"}
                      </span>
                    </div>
                    <p className="bk-meta">
                      {b.patient_name}
                      {b.ward_type ? ` · ${WARD_LABEL[b.ward_type] || b.ward_type}` : ""}
                      {b.booking_date ? ` · ${new Date(b.booking_date).toLocaleDateString("en-BD")}` : ""}
                      {b.expected_days ? ` · ${b.expected_days} day(s)` : ""}
                    </p>
                    {b.reason && <p className="bk-reason">{b.reason}</p>}
                    {b.advance_paid && (
                      <p className="bk-paid">
                        Advance paid: BDT {Number(b.advance_amount).toLocaleString()} via {b.payment_method}
                      </p>
                    )}
                  </div>
                  <button className="bk-slip-btn" onClick={slipDownload} title="Download booking slip PDF">
                    ⬇ {b.hospital_type === "private" ? "Receipt" : "Slip"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="hosp-section">
        <div className="hosp-section-head">
          <h2>Hospitals {facility !== "all" && <span className="hosp-count">({ordered.length})</span>}</h2>
          {user && (
            <button className="btn btn-outline btn-sm" onClick={() => setRegisteringHospital(true)}>
              + Register a hospital
            </button>
          )}
        </div>
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
                  <span className={`hb hb-type ${h.hospital_type === "private" ? "private" : "public"}`}>
                    {h.hospital_type === "private" ? "🏢 Private" : "🏛 Public"}
                  </span>
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
        <BookingWizard
          hospital={bookingFor}
          user={user}
          onClose={() => setBookingFor(null)}
          onBooked={() => { setBookingFor(null); loadBookings(); }}
        />
      )}

      {registeringHospital && (
        <RegisterHospitalModal
          onClose={() => setRegisteringHospital(false)}
          onRegistered={(h) => {
            setHospitals(prev => [...prev, h]);
            setRegisteringHospital(false);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REGISTER HOSPITAL MODAL
───────────────────────────────────────────────────────────── */

const EMPTY_REG = {
  name: "", city: "", address: "", phone: "", email: "",
  hospital_type: "public", beds_available: "",
  has_blood_bank: false, has_ambulance: false,
  consultation_fee: "", latitude: "", longitude: "",
};

function RegisterHospitalModal({ onClose, onRegistered }) {
  const [form,  setForm]  = useState({ ...EMPTY_REG });
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(false);

  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function detectLocation() {
    setDetecting(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      setForm(f => ({
        ...f,
        latitude:  pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      }));
    } catch {
      setError("Could not detect location. Enter coordinates manually.");
    } finally {
      setDetecting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Hospital name is required."); return; }
    if (!form.city.trim()) { setError("City is required."); return; }
    setBusy(true);
    setError("");
    try {
      const { hospital } = await api.registerHospital({
        ...form,
        beds_available:    form.beds_available    ? parseInt(form.beds_available, 10)    : 0,
        consultation_fee:  form.consultation_fee  ? parseInt(form.consultation_fee, 10)  : 0,
        latitude:   form.latitude  ? parseFloat(form.latitude)  : null,
        longitude:  form.longitude ? parseFloat(form.longitude) : null,
      });
      onRegistered(hospital);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="bw-backdrop" onClick={onClose}>
      <form className="bw-card rh-card" onClick={e => e.stopPropagation()} onSubmit={submit}>
        {/* Header */}
        <div className="bw-header">
          <div>
            <h2 className="bw-title">Register a Hospital</h2>
            <p className="rh-sub">Add a new hospital to the SaveLife directory</p>
          </div>
          <button type="button" className="bw-close" onClick={onClose}>×</button>
        </div>

        {error && <p className="bw-error">{error}</p>}

        <div className="bw-body">
          {/* Basic info */}
          <h3 className="bw-sh">Basic Information</h3>
          <div className="bw-grid">
            <BField label="Hospital name *" full>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Dhaka Medical College Hospital" required />
            </BField>
            <BField label="City *">
              <input value={form.city} onChange={set("city")} placeholder="e.g. Dhaka" required />
            </BField>
            <BField label="Full address">
              <input value={form.address} onChange={set("address")} placeholder="Street, area, district" />
            </BField>
            <BField label="Phone">
              <input value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" />
            </BField>
            <BField label="Email">
              <input type="email" value={form.email} onChange={set("email")} placeholder="hospital@email.com" />
            </BField>
          </div>

          {/* Type + ward */}
          <h3 className="bw-sh" style={{ marginTop: 20 }}>Hospital Type</h3>
          <div className="bw-toggle" style={{ maxWidth: 320 }}>
            {[["public","🏛 Government / Public"],["private","🏢 Private"]].map(([v, l]) => (
              <button key={v} type="button"
                className={`bw-toggle-btn ${form.hospital_type === v ? "on" : ""}`}
                onClick={() => setForm(f => ({ ...f, hospital_type: v }))}>
                {l}
              </button>
            ))}
          </div>

          {form.hospital_type === "private" && (
            <div style={{ marginTop: 12 }}>
              <BField label="Consultation fee (BDT)" full={false}>
                <input type="number" min="0" value={form.consultation_fee} onChange={set("consultation_fee")} placeholder="e.g. 800" style={{ width: 160 }} />
              </BField>
            </div>
          )}

          {/* Capacity + facilities */}
          <h3 className="bw-sh" style={{ marginTop: 20 }}>Capacity & Facilities</h3>
          <div className="bw-grid">
            <BField label="Available beds">
              <input type="number" min="0" value={form.beds_available} onChange={set("beds_available")} placeholder="0" />
            </BField>
          </div>
          <div className="rh-checks">
            <label className="rh-check">
              <input type="checkbox" checked={form.has_blood_bank} onChange={set("has_blood_bank")} />
              🩸 Has blood bank
            </label>
            <label className="rh-check">
              <input type="checkbox" checked={form.has_ambulance} onChange={set("has_ambulance")} />
              🚑 Has ambulance service
            </label>
          </div>

          {/* Location */}
          <h3 className="bw-sh" style={{ marginTop: 20 }}>Location (for map & directions)</h3>
          <div className="bw-grid">
            <BField label="Latitude">
              <input value={form.latitude} onChange={set("latitude")} placeholder="e.g. 23.7275" />
            </BField>
            <BField label="Longitude">
              <input value={form.longitude} onChange={set("longitude")} placeholder="e.g. 90.3975" />
            </BField>
          </div>
          <button type="button" className="rh-detect-btn" disabled={detecting} onClick={detectLocation}>
            {detecting ? "Detecting…" : "📍 Detect my current location"}
          </button>
          <p className="bw-hint-sm" style={{ marginTop: 6 }}>
            Stand at the hospital entrance and tap Detect, or enter coordinates from Google Maps.
          </p>
        </div>

        <div className="bw-footer">
          <button type="button" className="bw-btn bw-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="bw-btn bw-primary" disabled={busy}>
            {busy ? "Registering…" : "Register Hospital"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BOOKING WIZARD  (5-step)
───────────────────────────────────────────────────────────── */

const WARD_FEE = { general: 2500, semi_cabin: 5000, cabin: 10000, icu: 25000, emergency: 15000 };
const WARD_LABEL = {
  general: "General Ward", semi_cabin: "Semi-Cabin",
  cabin: "Private Cabin", icu: "ICU", emergency: "Emergency Bay",
};
const PAY_METHODS = [
  { id: "bkash",  label: "bKash",  icon: "📱" },
  { id: "nagad",  label: "Nagad",  icon: "💜" },
  { id: "rocket", label: "Rocket", icon: "🚀" },
  { id: "card",   label: "Card",   icon: "💳" },
];

const STEPS = [
  { n: 1, label: "Patient Info"       },
  { n: 2, label: "Admission"          },
  { n: 3, label: "Emergency & Docs"   },
  { n: 4, label: "Payment / Confirm"  },
];

const EMPTY_FORM = {
  // step 1
  patient_name: "", patient_age: "", patient_gender: "",
  patient_nid: "", contact_phone: "",
  // step 2
  admission_type: "planned", ward_type: "general",
  booking_date: "", expected_days: "1",
  reason: "", symptoms: "", referred_doctor: "",
  // step 3
  emergency_contact_name: "", emergency_contact_phone: "",
  emergency_contact_rel: "", insurance_provider: "",
  insurance_number: "", special_requirements: "",
  // payment
  payment_method: "bkash", mobile_number: "",
  card_number: "", card_expiry: "", card_cvv: "",
};

function BookingWizard({ hospital, user, onClose, onBooked }) {
  const isPrivate = hospital.hospital_type === "private";
  const [step,  setStep]  = useState(1);
  const [form,  setForm]  = useState({
    ...EMPTY_FORM,
    patient_name:  user?.name  || "",
    contact_phone: user?.phone || "",
    patient_age:   user?.age   ? String(user.age) : "",
    patient_gender: user?.gender || "",
  });
  const [files,     setFiles]     = useState([]); // File[] for medical docs
  const [payDone,   setPayDone]   = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(null); // booking on success

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const total    = WARD_FEE[form.ward_type] * (parseInt(form.expected_days, 10) || 1);
  const advance  = Math.round(total * 0.5);

  // Generate a fake payment reference
  function fakeRef() { return "PY" + Date.now().toString(36).toUpperCase(); }

  async function simulatePay() {
    if (!form.payment_method) return;
    if (form.payment_method !== "card" && !form.mobile_number.match(/^\d{11}$/)) {
      setError("Enter a valid 11-digit mobile number."); return;
    }
    if (form.payment_method === "card") {
      if (!form.card_number.replace(/\s/g,"").match(/^\d{16}$/)) { setError("Enter a valid 16-digit card number."); return; }
      if (!form.card_expiry.match(/^\d{2}\/\d{2}$/)) { setError("Expiry format: MM/YY"); return; }
      if (!form.card_cvv.match(/^\d{3}$/)) { setError("CVV must be 3 digits."); return; }
    }
    setError("");
    setPaying(true);
    await new Promise(r => setTimeout(r, 2200)); // simulate processing
    setPayDone(true);
    setPaying(false);
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const payload = {
        patient_name: form.patient_name, patient_age: form.patient_age,
        patient_gender: form.patient_gender, patient_nid: form.patient_nid,
        contact_phone: form.contact_phone,
        admission_type: form.admission_type, ward_type: form.ward_type,
        booking_date: form.booking_date, expected_days: form.expected_days,
        reason: form.reason, symptoms: form.symptoms,
        referred_doctor: form.referred_doctor,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_rel: form.emergency_contact_rel,
        insurance_provider: form.insurance_provider,
        insurance_number: form.insurance_number,
        special_requirements: form.special_requirements,
        advance_paid: isPrivate ? payDone : false,
        advance_amount: isPrivate ? advance : 0,
        payment_method: isPrivate ? form.payment_method : null,
        payment_ref: isPrivate && payDone ? fakeRef() : null,
      };
      const { booking } = await api.bookHospital(hospital.id, payload);

      // Upload medical documents if any
      if (files.length > 0) {
        await api.uploadBookingDocs(booking.id, files, "medical");
      }

      setDone(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ── SUCCESS SCREEN ──
  if (done) {
    function downloadSlip() {
      try {
        if (isPrivate) {
          generatePrivateSlip(done, hospital, { method: form.payment_method, ref: done.payment_ref });
        } else {
          generatePublicSlip(done, hospital);
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("PDF error: " + err.message);
      }
    }

    return (
      <div className="bw-backdrop" onClick={onClose}>
        <div className="bw-card bw-success" onClick={e => e.stopPropagation()}>
          <div className="bw-success-icon">{isPrivate ? "🧾" : "✅"}</div>
          <h2>{isPrivate ? "Payment & Booking Confirmed!" : "Booking Confirmed!"}</h2>
          <p>Your appointment at <strong>{hospital.name}</strong> has been received.</p>
          <div className="bw-summary-box">
            <Row label="Ref"        value={`SL-${String(done.id).padStart(6, "0")}`} />
            <Row label="Patient"    value={done.patient_name} />
            <Row label="Ward"       value={WARD_LABEL[done.ward_type]} />
            <Row label="Date"       value={done.booking_date ? new Date(done.booking_date).toLocaleDateString("en-BD") : "To be confirmed"} />
            <Row label="Status"     value={done.status.toUpperCase()} />
            {done.advance_paid && (
              <Row label="Advance paid" value={`BDT ${Number(done.advance_amount).toLocaleString()} via ${PAY_METHODS.find(m => m.id === form.payment_method)?.label}`} />
            )}
          </div>
          <p className="bw-hint">The hospital will contact you to confirm the final schedule.</p>
          <div className="bw-success-actions">
            <button className="bw-btn bw-slip-btn" onClick={downloadSlip}>
              ⬇ Download {isPrivate ? "Payment Receipt" : "Booking Slip"} (PDF)
            </button>
            <button className="bw-btn bw-primary" onClick={() => { onBooked(); }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bw-backdrop" onClick={onClose}>
      <div className="bw-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bw-header">
          <div>
            <h2 className="bw-title">Book {hospital.name}</h2>
            <span className={`bw-type-badge ${isPrivate ? "private" : "public"}`}>
              {isPrivate ? "🏢 Private" : "🏛 Public"} hospital
            </span>
          </div>
          <button className="bw-close" onClick={onClose}>×</button>
        </div>

        {/* Stepper */}
        <div className="bw-stepper">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`bw-step ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}>
              <div className="bw-step-dot">{step > s.n ? "✓" : s.n}</div>
              <span className="bw-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="bw-step-line" />}
            </div>
          ))}
        </div>

        {error && <p className="bw-error">{error}</p>}

        <div className="bw-body">
          {/* ── STEP 1: Patient Information ── */}
          {step === 1 && (
            <div className="bw-section">
              <h3 className="bw-sh">Patient Information</h3>
              <div className="bw-grid">
                <BField label="Full name *" full>
                  <input value={form.patient_name} onChange={set("patient_name")} placeholder="Patient's full name" required />
                </BField>
                <BField label="Age *">
                  <input type="number" min="0" max="130" value={form.patient_age} onChange={set("patient_age")} placeholder="e.g. 35" />
                </BField>
                <BField label="Gender *">
                  <select value={form.patient_gender} onChange={set("patient_gender")}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </BField>
                <BField label="NID / Passport No.">
                  <input value={form.patient_nid} onChange={set("patient_nid")} placeholder="National ID or passport" />
                </BField>
                <BField label="Contact phone *">
                  <input value={form.contact_phone} onChange={set("contact_phone")} inputMode="numeric" maxLength={11} placeholder="01712345678" />
                </BField>
              </div>
            </div>
          )}

          {/* ── STEP 2: Admission Details ── */}
          {step === 2 && (
            <div className="bw-section">
              <h3 className="bw-sh">Admission Details</h3>

              <BField label="Admission type *" full>
                <div className="bw-toggle">
                  {[["emergency","🚨 Emergency"],["planned","📅 Planned"],["day_care","☀️ Day Care"]].map(([v,l]) => (
                    <button key={v} type="button"
                      className={`bw-toggle-btn ${form.admission_type === v ? "on" : ""}`}
                      onClick={() => setForm(f => ({ ...f, admission_type: v }))}>
                      {l}
                    </button>
                  ))}
                </div>
              </BField>

              <div className="bw-grid">
                <BField label="Ward / Room type *" full>
                  <div className="ward-cards">
                    {Object.entries(WARD_LABEL).map(([k, label]) => (
                      <button key={k} type="button"
                        className={`ward-card ${form.ward_type === k ? "selected" : ""}`}
                        onClick={() => setForm(f => ({ ...f, ward_type: k }))}>
                        <div className="wc-name">{label}</div>
                        {isPrivate && (
                          <div className="wc-fee">BDT {WARD_FEE[k].toLocaleString()}/night</div>
                        )}
                      </button>
                    ))}
                  </div>
                </BField>

                <BField label="Preferred admission date *">
                  <input type="date" value={form.booking_date} onChange={set("booking_date")}
                    min={new Date().toISOString().slice(0,10)} />
                </BField>
                <BField label="Expected stay (days) *">
                  <input type="number" min="1" max="365" value={form.expected_days} onChange={set("expected_days")} />
                </BField>
                {isPrivate && (
                  <BField label="Estimated cost" full>
                    <div className="bw-cost-preview">
                      <span>{WARD_LABEL[form.ward_type]} × {form.expected_days || 1} day(s)</span>
                      <strong>BDT {total.toLocaleString()}</strong>
                    </div>
                  </BField>
                )}
                <BField label="Primary reason / diagnosis *" full>
                  <input value={form.reason} onChange={set("reason")} placeholder="e.g. Appendicitis, knee surgery, blood transfusion" />
                </BField>
                <BField label="Current symptoms" full>
                  <textarea rows={3} value={form.symptoms} onChange={set("symptoms")}
                    placeholder="Describe the patient's current symptoms in detail…" />
                </BField>
                <BField label="Referring doctor (if any)">
                  <input value={form.referred_doctor} onChange={set("referred_doctor")} placeholder="Dr. Full Name" />
                </BField>
              </div>
            </div>
          )}

          {/* ── STEP 3: Emergency Contact + Documents ── */}
          {step === 3 && (
            <div className="bw-section">
              <h3 className="bw-sh">Emergency Contact</h3>
              <div className="bw-grid">
                <BField label="Contact name *">
                  <input value={form.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="Full name" />
                </BField>
                <BField label="Contact phone *">
                  <input value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} inputMode="numeric" maxLength={11} placeholder="01712345678" />
                </BField>
                <BField label="Relationship">
                  <select value={form.emergency_contact_rel} onChange={set("emergency_contact_rel")}>
                    <option value="">Select</option>
                    <option>Father</option><option>Mother</option><option>Spouse</option>
                    <option>Child</option><option>Sibling</option><option>Friend</option><option>Other</option>
                  </select>
                </BField>
              </div>

              <h3 className="bw-sh" style={{ marginTop: 24 }}>Insurance (optional)</h3>
              <div className="bw-grid">
                <BField label="Insurance provider">
                  <input value={form.insurance_provider} onChange={set("insurance_provider")} placeholder="e.g. MetLife, Guardian" />
                </BField>
                <BField label="Policy / member number">
                  <input value={form.insurance_number} onChange={set("insurance_number")} placeholder="Policy number" />
                </BField>
              </div>

              <h3 className="bw-sh" style={{ marginTop: 24 }}>Medical Documents</h3>
              <p className="bw-hint-sm">Upload test reports, prescriptions, X-rays, or previous records (PDF / image, max 10 MB each).</p>
              <label className="doc-upload-zone">
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" hidden
                  onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                <div className="duz-inner">
                  <span className="duz-icon">📄</span>
                  <span>Click to attach documents</span>
                  <span className="bw-hint-sm">PDF, JPG, PNG — up to 10 MB each</span>
                </div>
              </label>
              {files.length > 0 && (
                <ul className="doc-file-list">
                  {files.map((f, i) => (
                    <li key={i}>
                      <span>📎 {f.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
                    </li>
                  ))}
                </ul>
              )}

              <BField label="Special requirements / notes" full style={{ marginTop: 16 }}>
                <textarea rows={3} value={form.special_requirements} onChange={set("special_requirements")}
                  placeholder="Wheelchair access, vegetarian meals, language preference, etc." />
              </BField>
            </div>
          )}

          {/* ── STEP 4: Payment (private) or Confirm (public) ── */}
          {step === 4 && (
            <div className="bw-section">
              {/* Booking summary */}
              <h3 className="bw-sh">Booking Summary</h3>
              <div className="bw-summary-box">
                <Row label="Hospital"    value={hospital.name} />
                <Row label="Type"        value={isPrivate ? "Private" : "Public (Free)"} />
                <Row label="Patient"     value={`${form.patient_name}${form.patient_age ? `, ${form.patient_age} yrs` : ""}${form.patient_gender ? `, ${form.patient_gender}` : ""}`} />
                <Row label="Ward"        value={WARD_LABEL[form.ward_type]} />
                <Row label="Admission"   value={form.admission_type.replace("_", " ")} />
                <Row label="Date"        value={form.booking_date || "TBC"} />
                <Row label="Stay"        value={`${form.expected_days} day(s)`} />
                {form.reason && <Row label="Reason" value={form.reason} />}
                {form.emergency_contact_name && <Row label="Emergency contact" value={`${form.emergency_contact_name} (${form.emergency_contact_phone})`} />}
                {files.length > 0 && <Row label="Documents" value={`${files.length} file(s) attached`} />}
              </div>

              {/* Private: payment required */}
              {isPrivate && !payDone && (
                <>
                  <div className="bw-pay-banner">
                    <div>
                      <p className="bw-pay-label">Total estimate</p>
                      <p className="bw-pay-total">BDT {total.toLocaleString()}</p>
                    </div>
                    <div className="bw-pay-advance">
                      <p className="bw-pay-label">50% advance required</p>
                      <p className="bw-pay-amount">BDT {advance.toLocaleString()}</p>
                    </div>
                  </div>

                  <h3 className="bw-sh">Select Payment Method</h3>
                  <div className="pay-method-grid">
                    {PAY_METHODS.map(m => (
                      <button key={m.id} type="button"
                        className={`pay-method-btn ${form.payment_method === m.id ? "selected" : ""}`}
                        onClick={() => setForm(f => ({ ...f, payment_method: m.id }))}>
                        <span className="pmb-icon">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {form.payment_method && form.payment_method !== "card" && (
                    <div className="pay-details">
                      <p className="bw-hint-sm">Send BDT {advance.toLocaleString()} to merchant number <strong>01XXXXXXXXX</strong></p>
                      <BField label="Your mobile number *" full>
                        <input value={form.mobile_number} onChange={set("mobile_number")}
                          inputMode="numeric" maxLength={11} placeholder="01XXXXXXXXX" />
                      </BField>
                    </div>
                  )}

                  {form.payment_method === "card" && (
                    <div className="pay-details">
                      <BField label="Card number *" full>
                        <input value={form.card_number} onChange={set("card_number")}
                          inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" />
                      </BField>
                      <div className="bw-grid">
                        <BField label="Expiry (MM/YY)">
                          <input value={form.card_expiry} onChange={set("card_expiry")} maxLength={5} placeholder="08/27" />
                        </BField>
                        <BField label="CVV">
                          <input type="password" value={form.card_cvv} onChange={set("card_cvv")} maxLength={3} placeholder="•••" />
                        </BField>
                      </div>
                    </div>
                  )}

                  <button className="bw-btn bw-pay-now bw-full" disabled={paying}
                    onClick={simulatePay}>
                    {paying ? (
                      <span className="bw-spinner">⏳ Processing payment…</span>
                    ) : (
                      `Pay BDT ${advance.toLocaleString()} →`
                    )}
                  </button>
                </>
              )}

              {/* Private: payment done */}
              {isPrivate && payDone && (
                <div className="pay-success-banner">
                  <div className="psb-icon">✅</div>
                  <div>
                    <p className="psb-title">Payment successful!</p>
                    <p className="psb-sub">BDT {advance.toLocaleString()} advance received via {PAY_METHODS.find(m => m.id === form.payment_method)?.label}</p>
                  </div>
                </div>
              )}

              {/* Public: free, no payment */}
              {!isPrivate && (
                <div className="bw-free-banner">
                  <span className="bw-free-icon">🏛</span>
                  <div>
                    <p className="bw-free-title">Government / Public Hospital</p>
                    <p className="bw-free-sub">No advance payment required. Services are subsidized for all citizens.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="bw-footer">
          {step > 1
            ? <button className="bw-btn bw-outline" onClick={() => { setStep(s => s - 1); setError(""); }}>← Back</button>
            : <button className="bw-btn bw-outline" onClick={onClose}>Cancel</button>}

          {step < 4 ? (
            <button className="bw-btn bw-primary" onClick={() => {
              // Basic per-step validation
              if (step === 1) {
                if (!form.patient_name.trim()) { setError("Patient name is required."); return; }
                if (!form.patient_age)         { setError("Age is required."); return; }
                if (!form.patient_gender)      { setError("Gender is required."); return; }
                if (!form.contact_phone.match(/^\d{11}$/)) { setError("Enter a valid 11-digit phone."); return; }
              }
              if (step === 2) {
                if (!form.booking_date) { setError("Preferred admission date is required."); return; }
                if (!form.reason.trim()) { setError("Please state the reason for admission."); return; }
              }
              if (step === 3) {
                if (!form.emergency_contact_name.trim()) { setError("Emergency contact name is required."); return; }
                if (!form.emergency_contact_phone.match(/^\d{11}$/)) { setError("Enter a valid emergency contact phone."); return; }
              }
              setError("");
              setStep(s => s + 1);
            }}>
              Next →
            </button>
          ) : (
            <button className="bw-btn bw-primary" disabled={busy || (isPrivate && !payDone)}
              onClick={submit}>
              {busy ? "Confirming…" : isPrivate ? "Confirm Booking" : "Confirm Booking (Free)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BField({ label, children, full, style }) {
  return (
    <div className={`bf-wrap ${full ? "full" : ""}`} style={style}>
      <label className="bf-label">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="sum-row">
      <span className="sum-label">{label}</span>
      <span className="sum-value">{value}</span>
    </div>
  );
}
