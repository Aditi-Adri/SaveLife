import { useEffect, useState, useMemo } from "react";
import { api } from "./api";
import { generateAppointmentSlip } from "./generateSlip";
import "./Doctors.css";

const SPECIALTIES = [
  "Cardiologist", "Neurologist", "Orthopedic Surgeon", "Dermatologist",
  "Gynecologist", "Pediatrician", "General Physician", "Gastroenterologist",
  "Ophthalmologist", "ENT Specialist", "Psychiatrist", "Endocrinologist",
  "Pulmonologist", "Nephrologist", "Urologist",
];

const CITIES = ["Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna", "Mymensingh"];

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM",
];

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="dr-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "star-full" : (i === full && half ? "star-half" : "star-empty")}>★</span>
      ))}
      <span className="dr-rating-num">{rating}</span>
    </span>
  );
}

function DoctorCard({ doctor, onBook, user }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="dr-card">
      <div className="dr-card-top">
        <div className="dr-avatar" style={{ background: `hsl(${(doctor.id * 47) % 360},60%,55%)` }}>
          {initials(doctor.name)}
        </div>
        <div className="dr-card-info">
          <h3 className="dr-name">{doctor.name}</h3>
          <span className="dr-specialty-badge">{doctor.specialty}</span>
          <p className="dr-quals">{doctor.qualifications}</p>
          <div className="dr-meta-row">
            <span className="dr-meta"><span className="dr-meta-icon">🏥</span>{doctor.hospital}</span>
            <span className="dr-meta"><span className="dr-meta-icon">📍</span>{doctor.city}</span>
          </div>
          <div className="dr-meta-row">
            <span className="dr-meta"><span className="dr-meta-icon">⏱</span>{doctor.experience_years} yrs exp</span>
            <span className="dr-meta"><span className="dr-meta-icon">👥</span>{Number(doctor.total_patients).toLocaleString()} patients</span>
          </div>
          <StarRating rating={parseFloat(doctor.rating)} />
        </div>
      </div>

      <div className="dr-card-body">
        <div className="dr-avail">
          <span className="dr-avail-label">Available:</span>
          <span className="dr-avail-days">{doctor.available_days}</span>
          <span className="dr-avail-sep">•</span>
          <span className="dr-avail-time">{doctor.available_time}</span>
        </div>
        <div className="dr-card-footer">
          <div className="dr-fee">
            <span className="dr-fee-label">Consultation fee</span>
            <span className="dr-fee-amt">BDT {Number(doctor.consultation_fee).toLocaleString()}</span>
          </div>
          <div className="dr-card-actions">
            <button className="dr-btn-outline" onClick={() => setExpanded(e => !e)}>
              {expanded ? "Hide Bio" : "View Bio"}
            </button>
            {user ? (
              <button className="dr-btn-book" onClick={() => onBook(doctor)}>Book Appointment</button>
            ) : (
              <button className="dr-btn-book dr-btn-lock" onClick={() => onBook(doctor)}>
                🔒 Login to Book
              </button>
            )}
          </div>
        </div>
        {expanded && doctor.bio && (
          <p className="dr-bio">{doctor.bio}</p>
        )}
        {expanded && (
          <div className="dr-lang-row">
            <span className="dr-lang-label">Languages:</span>
            <span>{doctor.languages}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingModal({ doctor, user, onClose, onBooked, onAuth }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    patient_name: user?.name || "",
    patient_age: user?.age || "",
    patient_gender: user?.gender || "",
    patient_phone: user?.phone || "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!user) { onAuth("request"); return; }
    setErr("");
    setBusy(true);
    try {
      const result = await api.bookAppointment({
        doctor_id: doctor.id,
        ...form,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
      });
      onBooked(result.appointment, result.doctor);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bm-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bm-card">
        <div className="bm-header">
          <div>
            <h2 className="bm-title">Book Appointment</h2>
            <p className="bm-subtitle">{doctor.name} · {doctor.specialty}</p>
          </div>
          <button className="bm-close" onClick={onClose}>✕</button>
        </div>

        <div className="bm-doctor-strip">
          <div className="bm-doc-avatar" style={{ background: `hsl(${(doctor.id * 47) % 360},60%,55%)` }}>
            {initials(doctor.name)}
          </div>
          <div>
            <div className="bm-doc-name">{doctor.name}</div>
            <div className="bm-doc-info">{doctor.hospital} · {doctor.city}</div>
            <div className="bm-doc-fee">Consultation Fee: <strong>BDT {Number(doctor.consultation_fee).toLocaleString()}</strong></div>
          </div>
        </div>

        <form className="bm-form" onSubmit={submit}>
          <div className="bm-section-title">Patient Information</div>
          <div className="bm-row">
            <div className="bm-col">
              <label>Patient Name *</label>
              <input required value={form.patient_name} onChange={set("patient_name")} placeholder="Full name" />
            </div>
            <div className="bm-col">
              <label>Age</label>
              <input type="number" min="0" max="120" value={form.patient_age} onChange={set("patient_age")} placeholder="Age" />
            </div>
          </div>
          <div className="bm-row">
            <div className="bm-col">
              <label>Gender</label>
              <select value={form.patient_gender} onChange={set("patient_gender")}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="bm-col">
              <label>Contact Phone</label>
              <input value={form.patient_phone} onChange={set("patient_phone")} placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <div className="bm-section-title">Appointment Schedule</div>
          <div className="bm-avail-info">
            <span>📅 Available days: <strong>{doctor.available_days}</strong></span>
            <span>⏰ Clinic hours: <strong>{doctor.available_time}</strong></span>
          </div>
          <div className="bm-row">
            <div className="bm-col">
              <label>Preferred Date *</label>
              <input required type="date" min={today} value={form.appointment_date} onChange={set("appointment_date")} />
            </div>
            <div className="bm-col">
              <label>Preferred Time</label>
              <select value={form.appointment_time} onChange={set("appointment_time")}>
                <option value="">Select time slot</option>
                {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="bm-section-title">Medical Details</div>
          <label>Reason / Symptoms *</label>
          <textarea required rows={3} value={form.reason} onChange={set("reason")} placeholder="Describe the reason for your visit or current symptoms" />
          <label>Additional Notes</label>
          <textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Any other relevant information (medications, allergies, etc.)" />

          {err && <p className="bm-err">{err}</p>}

          <div className="bm-actions">
            <button type="button" className="bm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="bm-btn-confirm" disabled={busy}>
              {busy ? "Booking…" : "Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuccessModal({ appointment, doctor, onClose }) {
  const [downloading, setDownloading] = useState(false);

  async function downloadSlip() {
    setDownloading(true);
    try {
      generateAppointmentSlip(appointment, doctor);
    } catch (e) {
      alert("PDF generation failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  }

  const apptRef = "APT-" + String(appointment.id).padStart(6, "0");

  return (
    <div className="bm-backdrop">
      <div className="bm-card bm-success-card">
        <div className="bm-success-icon">✅</div>
        <h2 className="bm-success-title">Appointment Confirmed!</h2>
        <p className="bm-success-ref">Reference: <strong>{apptRef}</strong></p>
        <div className="bm-success-info">
          <div className="bm-sinfo-row"><span>Doctor</span><strong>{doctor?.name}</strong></div>
          <div className="bm-sinfo-row"><span>Specialty</span><strong>{doctor?.specialty}</strong></div>
          <div className="bm-sinfo-row"><span>Date</span><strong>{new Date(appointment.appointment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
          <div className="bm-sinfo-row"><span>Time</span><strong>{appointment.appointment_time || "As per clinic"}</strong></div>
          <div className="bm-sinfo-row"><span>Hospital</span><strong>{doctor?.hospital}</strong></div>
          <div className="bm-sinfo-row"><span>Fee</span><strong>BDT {Number(doctor?.consultation_fee || 0).toLocaleString()}</strong></div>
        </div>
        <p className="bm-success-note">Please arrive 15 minutes early and bring this confirmation slip.</p>
        <div className="bm-success-actions">
          <button className="bm-slip-btn" onClick={downloadSlip} disabled={downloading}>
            {downloading ? "Generating PDF…" : "⬇ Download Appointment Slip"}
          </button>
          <button className="bm-btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function MyAppointments({ appointments, onDownload }) {
  if (!appointments.length)
    return <p className="dr-empty">No appointments yet. Book your first appointment above.</p>;

  return (
    <div className="dr-my-appts">
      {appointments.map(a => {
        const apptRef = "APT-" + String(a.id).padStart(6, "0");
        return (
          <div key={a.id} className="dr-appt-row">
            <div className="dr-appt-left">
              <div className="dr-appt-ref">{apptRef}</div>
              <div className="dr-appt-doctor">{a.doctor_name}</div>
              <div className="dr-appt-spec">{a.specialty}</div>
              <div className="dr-appt-hospital">{a.doctor_hospital} · {a.doctor_city}</div>
            </div>
            <div className="dr-appt-mid">
              <div className="dr-appt-date">
                {new Date(a.appointment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="dr-appt-time">{a.appointment_time || "—"}</div>
              <div className="dr-appt-reason">{a.reason}</div>
            </div>
            <div className="dr-appt-right">
              <span className={`dr-appt-status ${a.status}`}>{a.status}</span>
              <div className="dr-appt-fee">BDT {Number(a.consultation_fee || 0).toLocaleString()}</div>
              <button className="dr-slip-btn" onClick={() => onDownload(a)}>⬇ Slip</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Doctors({ user, onBack, onAuth }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [confirmed, setConfirmed] = useState(null); // { appointment, doctor }
  const [tab, setTab] = useState("find"); // "find" | "mine"
  const [myAppts, setMyAppts] = useState([]);
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => {
    api.publicDoctors().then(d => setDoctors(d.doctors || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "mine" && user) {
      setLoadingMine(true);
      api.myAppointments().then(d => setMyAppts(d.appointments || [])).catch(() => {}).finally(() => setLoadingMine(false));
    }
  }, [tab, user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter(d => {
      if (filterSpec && !d.specialty.toLowerCase().includes(filterSpec.toLowerCase())) return false;
      if (filterCity && !d.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (q && !(d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) ||
                 d.hospital.toLowerCase().includes(q) || (d.qualifications || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [doctors, search, filterSpec, filterCity]);

  function handleBook(doctor) {
    if (!user) { onAuth("donate"); return; }
    setBookingDoctor(doctor);
  }

  function handleBooked(appointment, doctor) {
    setBookingDoctor(null);
    setConfirmed({ appointment, doctor });
  }

  function handleDownloadMine(appt) {
    const doc = doctors.find(d => d.id === appt.doctor_id) || {
      name: appt.doctor_name, specialty: appt.specialty, qualifications: appt.qualifications,
      hospital: appt.doctor_hospital, city: appt.doctor_city,
      consultation_fee: appt.consultation_fee, phone: appt.doctor_phone,
    };
    try { generateAppointmentSlip(appt, doc); }
    catch (e) { alert("PDF error: " + e.message); }
  }

  return (
    <div className="dr-page">
      {/* NAV */}
      <header className="dr-nav">
        <button className="dr-back-btn" onClick={onBack}>← Back</button>
        <div className="dr-brand">🩺 <span>SaveLife</span> <span className="dr-brand-sep">·</span> <span className="dr-brand-sub">Find Doctors</span></div>
        {user && (
          <div className="dr-nav-tabs">
            <button className={`dr-nav-tab ${tab === "find" ? "active" : ""}`} onClick={() => setTab("find")}>Find Doctors</button>
            <button className={`dr-nav-tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My Appointments</button>
          </div>
        )}
      </header>

      {tab === "find" && (
        <>
          {/* HERO */}
          <section className="dr-hero">
            <h1>Find the Right Doctor</h1>
            <p>Browse 50+ verified specialist doctors across Bangladesh. Book appointments instantly.</p>
          </section>

          {/* FILTERS */}
          <section className="dr-filters">
            <input
              className="dr-search"
              placeholder="Search by name, specialty, hospital…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="dr-select" value={filterSpec} onChange={e => setFilterSpec(e.target.value)}>
              <option value="">All Specialties</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="dr-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {(search || filterSpec || filterCity) && (
              <button className="dr-clear-btn" onClick={() => { setSearch(""); setFilterSpec(""); setFilterCity(""); }}>
                Clear
              </button>
            )}
            <span className="dr-count">{filtered.length} doctor{filtered.length !== 1 ? "s" : ""}</span>
          </section>

          {/* RESULTS */}
          <section className="dr-grid-section">
            {loading ? (
              <div className="dr-loading">Loading doctors…</div>
            ) : filtered.length === 0 ? (
              <div className="dr-empty">No doctors found matching your search.</div>
            ) : (
              <div className="dr-grid">
                {filtered.map(d => (
                  <DoctorCard key={d.id} doctor={d} user={user} onBook={handleBook} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === "mine" && user && (
        <section className="dr-mine-section">
          <h2 className="dr-mine-title">My Appointments</h2>
          {loadingMine ? (
            <div className="dr-loading">Loading your appointments…</div>
          ) : (
            <MyAppointments appointments={myAppts} onDownload={handleDownloadMine} />
          )}
        </section>
      )}

      {/* Booking modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          user={user}
          onClose={() => setBookingDoctor(null)}
          onBooked={handleBooked}
          onAuth={onAuth}
        />
      )}

      {/* Success modal */}
      {confirmed && (
        <SuccessModal
          appointment={confirmed.appointment}
          doctor={confirmed.doctor}
          onClose={() => { setConfirmed(null); if (user) { setTab("mine"); } }}
        />
      )}
    </div>
  );
}
