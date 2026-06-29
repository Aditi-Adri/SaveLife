import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { api, auth } from "./api";
import "./MedicalTests.css";

// ── Data ─────────────────────────────────────────────────────────────────────

const CATS = [
  { id: "all",     label: "All",      emoji: "🔬" },
  { id: "blood",   label: "Blood",    emoji: "🩸" },
  { id: "imaging", label: "Imaging",  emoji: "🩻" },
  { id: "heart",   label: "Heart",    emoji: "🫀" },
  { id: "urine",   label: "Urine",    emoji: "🧪" },
  { id: "stool",   label: "Stool",    emoji: "🦠" },
  { id: "hormone", label: "Hormones", emoji: "⚗️" },
];

const TESTS = [
  { id:1,  name:"Complete Blood Count (CBC)",          cat:"blood",   price:[200,400],   prep:"No fasting needed.",                          dur:30,  detects:"Anemia, infection, blood cell disorders" },
  { id:2,  name:"Fasting Blood Sugar (FBS)",           cat:"blood",   price:[100,200],   prep:"Fast 8–10 hours before sample.",              dur:20,  detects:"Diabetes, pre-diabetes" },
  { id:3,  name:"HbA1c (3-Month Sugar Average)",       cat:"blood",   price:[500,800],   prep:"No fasting required.",                        dur:30,  detects:"Long-term blood sugar control" },
  { id:4,  name:"Lipid Profile (Cholesterol)",         cat:"blood",   price:[400,700],   prep:"Fast 9–12 hrs. Avoid fatty food.",            dur:30,  detects:"Cholesterol, triglycerides, heart risk" },
  { id:5,  name:"Liver Function Test (LFT)",           cat:"blood",   price:[500,900],   prep:"Fast 8 hrs. No alcohol 24 hrs prior.",        dur:30,  detects:"Liver health, hepatitis, jaundice" },
  { id:6,  name:"Kidney Function Test (KFT/RFT)",      cat:"blood",   price:[400,700],   prep:"Drink water. Avoid diuretics.",               dur:30,  detects:"Kidney disease, creatinine, urea levels" },
  { id:7,  name:"Thyroid Profile (TSH, T3, T4)",       cat:"blood",   price:[600,1000],  prep:"Morning sample preferred. No iodine 48 hrs.", dur:30,  detects:"Hypothyroidism, hyperthyroidism" },
  { id:8,  name:"Blood Group & Rh Factor",             cat:"blood",   price:[100,200],   prep:"No preparation needed.",                      dur:20,  detects:"ABO blood type and Rh status" },
  { id:9,  name:"Dengue NS1 Antigen",                  cat:"blood",   price:[600,900],   prep:"Best in first 5 days of fever.",              dur:45,  detects:"Active dengue infection" },
  { id:10, name:"Hepatitis B (HBsAg)",                 cat:"blood",   price:[300,500],   prep:"No preparation needed.",                      dur:30,  detects:"Hepatitis B infection" },
  { id:11, name:"Iron Studies (Ferritin, TIBC)",       cat:"blood",   price:[700,1200],  prep:"Fast 8 hrs. Morning sample.",                 dur:30,  detects:"Iron deficiency anaemia, iron overload" },
  { id:12, name:"Chest X-Ray (PA View)",               cat:"imaging", price:[300,600],   prep:"Remove metal jewellery and accessories.",     dur:15,  detects:"Pneumonia, TB, heart enlargement, fractures" },
  { id:13, name:"Abdominal Ultrasound",                cat:"imaging", price:[800,1500],  prep:"Fast 6 hrs. Full bladder for pelvic scans.",  dur:30,  detects:"Liver, kidney, gallbladder, appendix" },
  { id:14, name:"MRI Brain",                           cat:"imaging", price:[5000,9000], prep:"Remove all metal. Inform about any implants.", dur:60,  detects:"Stroke, tumours, MS, brain disorders",    adv:true },
  { id:15, name:"CT Scan — Chest / Abdomen",           cat:"imaging", price:[4000,7000], prep:"Fast 4 hrs if contrast dye is needed.",       dur:20,  detects:"Injuries, tumours, pulmonary embolism",   adv:true },
  { id:16, name:"Electrocardiogram (ECG / EKG)",       cat:"heart",   price:[200,400],   prep:"Rest 10 min before. No exercise beforehand.", dur:15,  detects:"Heart rhythm, arrhythmia, heart attack" },
  { id:17, name:"2D Echocardiogram (Echo)",            cat:"heart",   price:[2000,3500], prep:"No special preparation required.",            dur:45,  detects:"Heart valves, chambers, cardiac function", adv:true },
  { id:18, name:"Treadmill Stress Test (TMT)",         cat:"heart",   price:[2000,3500], prep:"Fast 3 hrs. Wear comfortable shoes.",         dur:60,  detects:"Coronary artery disease, exercise capacity",adv:true },
  { id:19, name:"Urine Routine & Microscopy (R/E)",    cat:"urine",   price:[100,200],   prep:"Midstream morning urine in clean container.", dur:20,  detects:"UTI, kidney disease, diabetes" },
  { id:20, name:"Urine Culture & Sensitivity (C/S)",   cat:"urine",   price:[400,700],   prep:"Clean-catch sample before antibiotics.",      dur:48,  detects:"Bacterial UTI & antibiotic sensitivity" },
  { id:21, name:"Stool Routine Examination",           cat:"stool",   price:[100,200],   prep:"Fresh sample. No prior laxatives.",           dur:30,  detects:"Parasites, bacteria, blood in stool" },
  { id:22, name:"Vitamin D (25-OH)",                   cat:"hormone", price:[1000,1800], prep:"Morning blood sample preferred.",             dur:30,  detects:"Vitamin D deficiency or toxicity" },
  { id:23, name:"Pregnancy Test (Beta-hCG Blood)",     cat:"hormone", price:[300,600],   prep:"Morning sample preferred.",                   dur:30,  detects:"Pregnancy confirmation, ectopic risk" },
];

const CENTERS = [
  { id:1,  name:"Square Hospital Laboratory",    area:"Panthapath",  address:"18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka-1205", lat:23.7514, lng:90.3871, phone:"10616",       hours:"24 hours",  adv:true  },
  { id:2,  name:"United Hospital Diagnostics",   area:"Gulshan-2",   address:"Plot 15, Road 71, Gulshan-2, Dhaka-1212",                             lat:23.7977, lng:90.4143, phone:"10666",       hours:"24 hours",  adv:true  },
  { id:3,  name:"Labaid Diagnostic Centre",      area:"Dhanmondi",   address:"House 1, Road 4, Dhanmondi R/A, Dhaka-1205",                          lat:23.7437, lng:90.3728, phone:"10606",       hours:"7AM–10PM",  adv:false },
  { id:4,  name:"Popular Diagnostic Centre",     area:"Dhanmondi",   address:"House 16, Road 2, Dhanmondi, Dhaka-1205",                             lat:23.7417, lng:90.3741, phone:"10622",       hours:"7AM–10PM",  adv:true  },
  { id:5,  name:"Ibn Sina Diagnostic",           area:"Dhanmondi",   address:"House 48, Road 9/A, Dhanmondi, Dhaka-1205",                           lat:23.7461, lng:90.3765, phone:"10612",       hours:"7AM–10PM",  adv:false },
  { id:6,  name:"Apollo Hospitals Dhaka",        area:"Bashundhara", address:"Plot 81, Block E, Bashundhara R/A, Dhaka-1229",                       lat:23.8154, lng:90.4282, phone:"10678",       hours:"24 hours",  adv:true  },
  { id:7,  name:"Evercare Hospital",             area:"Bashundhara", address:"Plot 81, Block E, Bashundhara R/A, Dhaka-1229",                       lat:23.8133, lng:90.4290, phone:"01713-105111",hours:"24 hours",  adv:true  },
  { id:8,  name:"BIRDEM General Hospital",       area:"Shahbag",     address:"122 Kazi Nazrul Islam Avenue, Shahbag, Dhaka-1000",                   lat:23.7397, lng:90.3943, phone:"10611",       hours:"8AM–8PM",   adv:true  },
  { id:9,  name:"Green Life Medical College",    area:"Farmgate",    address:"32, Green Road, Farmgate, Dhaka-1205",                                lat:23.7527, lng:90.3874, phone:"10619",       hours:"8AM–8PM",   adv:false },
  { id:10, name:"Impulse Hospital",              area:"Mirpur",      address:"304/E, Mirpur Road, Dhaka-1206",                                      lat:23.8041, lng:90.3718, phone:"01969-999999",hours:"7AM–10PM",  adv:false },
];

const TIME_SLOTS = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM",
];

const CAT_COLOR = { blood:"#dc2626", imaging:"#2563eb", heart:"#ec4899", urine:"#d97706", stool:"#7c3aed", hormone:"#059669" };

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(km) { return km < 1 ? `${(km*1000).toFixed(0)} m` : `${km.toFixed(1)} km`; }
function fmtPrice(t) { return `৳${t.price[0].toLocaleString()} – ৳${t.price[1].toLocaleString()}`; }
function todayStr()  { return new Date().toISOString().slice(0,10); }

function centersFor(test, userLoc, sort) {
  let list = CENTERS.filter(c => !test.adv || c.adv);
  if (userLoc) list = list.map(c => ({ ...c, dist: haversine(userLoc.lat, userLoc.lng, c.lat, c.lng) }));
  if (sort === "nearest" && userLoc) list.sort((a,b) => a.dist - b.dist);
  return list;
}

// ── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ test, center, user, onClose, onBooked }) {
  const [date,  setDate]  = useState("");
  const [time,  setTime]  = useState("");
  const [name,  setName]  = useState(user?.name  || "");
  const [age,   setAge]   = useState(user?.age?.toString() || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!date) return setErr("Please select a date.");
    if (!time) return setErr("Please select a time slot.");
    setErr(""); setBusy(true);
    try {
      const { booking } = await api.bookTest({
        test_id: test.id, test_name: test.name,
        center_id: center.id, center_name: center.name, center_area: center.area,
        center_address: center.address, center_phone: center.phone,
        scheduled_date: date, scheduled_time: time,
        patient_name: name || null, patient_age: age ? parseInt(age) : null,
        patient_phone: phone || null, notes: notes || null,
      });
      onBooked(booking);
    } catch(e) {
      setErr(e.message || "Booking failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mt-modal">
        <button className="mt-modal-close" onClick={onClose}>✕</button>
        <div className="mt-modal-header">
          <div className="mt-modal-icon">📋</div>
          <h2>{test.name}</h2>
          <p>🏥 {center.name} · 📍 {center.area}</p>
        </div>

        <div className="mt-modal-prep">
          <strong>⚠️ Preparation required:</strong> {test.prep}
        </div>

        <form onSubmit={submit} className="mt-modal-form">
          <div className="mt-form-row2">
            <label>
              <span>Date *</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayStr()} required />
            </label>
            <label>
              <span>Time slot *</span>
              <select value={time} onChange={e => setTime(e.target.value)} required>
                <option value="">Choose a slot</option>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-form-row3">
            <label>
              <span>Patient name</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </label>
            <label>
              <span>Age</span>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="120" placeholder="Age" />
            </label>
            <label>
              <span>Phone</span>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </label>
          </div>
          <label className="mt-form-full">
            <span>Notes (optional)</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Medical history, doctor's referral, or special instructions…" />
          </label>
          {err && <div className="mt-form-err">{err}</div>}
          <button type="submit" className="mt-form-submit" disabled={busy}>
            {busy ? "Booking…" : "✅ Confirm Booking"}
          </button>
          <p className="mt-form-note">A confirmation email will be sent to <strong>{user?.email}</strong></p>
        </form>
      </div>
    </div>
  );
}

// ── Test Card ─────────────────────────────────────────────────────────────────

function TestCard({ test, userLoc, sort, onBook, user }) {
  const [open, setOpen] = useState(false);
  const centers = centersFor(test, userLoc, sort);
  const color   = CAT_COLOR[test.cat] || "#64748b";
  const cat     = CATS.find(c => c.id === test.cat);

  return (
    <div className={`mt-card${open ? " mt-card-open" : ""}`}>
      <div className="mt-card-head" onClick={() => setOpen(o => !o)}>
        <div className="mt-card-info">
          <div className="mt-card-top">
            <span className="mt-card-cat" style={{ background: color + "1a", color }}>{cat?.emoji} {cat?.label}</span>
            {test.adv && <span className="mt-card-adv">🏥 Advanced</span>}
          </div>
          <div className="mt-card-name">{test.name}</div>
          <div className="mt-card-detects">Detects: {test.detects}</div>
        </div>
        <div className="mt-card-right">
          <div className="mt-card-price">{fmtPrice(test)}</div>
          <div className="mt-card-dur">⏱ {test.dur} min</div>
          <div className="mt-card-centers">{centers.length} centre{centers.length !== 1 ? "s" : ""}</div>
          <div className={`mt-card-chevron${open ? " open" : ""}`}>›</div>
        </div>
      </div>

      {open && (
        <div className="mt-card-body">
          <div className="mt-card-prep">📋 <strong>Preparation:</strong> {test.prep}</div>
          <div className="mt-centers-list">
            {centers.map(c => (
              <div key={c.id} className="mt-center-row">
                <div className="mt-center-info">
                  <div className="mt-center-name">{c.name}</div>
                  <div className="mt-center-addr">📍 {c.address}</div>
                  <div className="mt-center-meta">
                    <span>📞 {c.phone}</span>
                    <span>🕐 {c.hours}</span>
                    {c.dist != null && <span>📏 {fmtDist(c.dist)} away</span>}
                  </div>
                </div>
                <button className="mt-center-book" onClick={() => user ? onBook(test, c) : onBook(null, null)}>
                  {user ? "Book →" : "Log in"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Bookings ───────────────────────────────────────────────────────────────

function MyBookings({ user, onAuth, successBooking }) {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.myTestBookings()
      .then(d => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function uploadReport(bookingId, file) {
    setUploading(bookingId);
    try {
      const { booking } = await api.uploadTestReport(bookingId, file);
      setBookings(bs => bs.map(b => b.id === bookingId ? booking : b));
    } catch(e) {
      alert(e.message || "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  if (!user) return (
    <div className="mt-empty">
      <div style={{ fontSize:"2.5rem" }}>📋</div>
      <h3>Log in to view your bookings</h3>
      <p>Track your scheduled tests and download reports.</p>
      {onAuth && <button className="mt-login-btn" onClick={() => onAuth()}>Log in →</button>}
    </div>
  );
  if (loading) return <div className="mt-empty"><p>Loading bookings…</p></div>;
  if (!bookings.length) return (
    <div className="mt-empty">
      <div style={{ fontSize:"2.5rem" }}>🗓️</div>
      <h3>No bookings yet</h3>
      <p>Browse tests above and book your first diagnostic test.</p>
    </div>
  );

  return (
    <div className="mt-bookings-list">
      {successBooking && (
        <div className="mt-success-banner">
          ✅ Booked! <strong>{successBooking.test_name}</strong> at <strong>{successBooking.center_name}</strong> on{" "}
          {new Date(successBooking.scheduled_date).toLocaleDateString()} at {successBooking.scheduled_time}.
          Check your email for confirmation.
        </div>
      )}
      {bookings.map(b => {
        const dateStr = new Date(b.scheduled_date).toLocaleDateString("en-BD", {
          day: "numeric", month: "long", year: "numeric",
        });
        return (
          <div key={b.id} className="mt-booking-card">
            <div className="mt-bk-header">
              <div className="mt-bk-ref">{b.booking_ref}</div>
              <span className={`mt-bk-status mt-bk-${b.status}`}>{b.status}</span>
            </div>
            <div className="mt-bk-test">{b.test_name}</div>
            <div className="mt-bk-center">🏥 {b.center_name}{b.center_area ? ` · ${b.center_area}` : ""}</div>
            <div className="mt-bk-when">📅 {dateStr} at {b.scheduled_time}</div>
            {b.center_phone && <div className="mt-bk-phone">📞 {b.center_phone}</div>}
            {b.center_address && <div className="mt-bk-addr">📍 {b.center_address}</div>}
            <div className="mt-bk-actions">
              {b.report_url ? (
                <a className="mt-bk-dl" href={b.report_url} download={b.report_name || "report"} target="_blank" rel="noreferrer">
                  ⬇️ Download Report
                </a>
              ) : (
                <label className="mt-bk-upload">
                  {uploading === b.id ? "Uploading…" : "⬆️ Upload Report (PDF / Image)"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:"none" }}
                    onChange={e => e.target.files[0] && uploadReport(b.id, e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MedicalTests({ user, onBack, onAuth }) {
  const [tab,        setTab]        = useState("browse");
  const [cat,        setCat]        = useState("all");
  const [q,          setQ]          = useState("");
  const [sort,       setSort]       = useState("nearest");
  const [userLoc,    setUserLoc]    = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [bookTarget, setBookTarget] = useState(null);
  const [latestBk,   setLatestBk]  = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      ()  => { setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const filtered = TESTS.filter(t =>
    (cat === "all" || t.cat === cat) &&
    (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.detects.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => sort === "price" ? a.price[0] - b.price[0] : a.name.localeCompare(b.name));

  function handleBook(test, center) {
    if (!test) { onAuth?.(); return; }
    setBookTarget({ test, center });
  }

  function handleBooked(booking) {
    setBookTarget(null);
    setLatestBk(booking);
    setTab("my");
  }

  return (
    <div className="mt-wrap">
      <header className="mt-nav">
        <button className="mt-back" onClick={onBack}>← Back</button>
        <span className="mt-brand">🔬 Medical Tests</span>
        <ThemeToggle />
      </header>

      <div className="mt-tabs">
        <button className={`mt-tab${tab === "browse" ? " active" : ""}`} onClick={() => setTab("browse")}>
          Browse Tests
        </button>
        <button className={`mt-tab${tab === "my" ? " active" : ""}`} onClick={() => setTab("my")}>
          My Bookings
        </button>
      </div>

      {tab === "browse" && (
        <div className="mt-browse">
          <div className="mt-hero">
            <h1>Book Medical Tests</h1>
            <p>
              {TESTS.length} diagnostic tests at {CENTERS.length} certified labs &amp; hospitals in Dhaka.
              Book online, get a confirmation email, and upload your report when it's ready.
            </p>
            {locLoading && <span className="mt-loc-badge">📍 Getting your location…</span>}
            {!locLoading && userLoc && <span className="mt-loc-badge ok">📍 Centres sorted by distance from you</span>}
            {!locLoading && !userLoc && <span className="mt-loc-badge">📍 Enable location to sort by nearest</span>}
          </div>

          <div className="mt-filters">
            <div className="mt-search-wrap">
              <span className="mt-search-icon">🔍</span>
              <input className="mt-search" placeholder="Search tests or conditions (e.g. diabetes, dengue)…"
                value={q} onChange={e => setQ(e.target.value)} />
              {q && <button className="mt-search-clear" onClick={() => setQ("")}>✕</button>}
            </div>
            <div className="mt-sort-row">
              {[
                { v:"nearest", l:"📍 Nearest" },
                { v:"price",   l:"💰 Price ↑" },
                { v:"name",    l:"🔤 A–Z"     },
              ].map(s => (
                <button key={s.v} className={`mt-sort-btn${sort === s.v ? " active" : ""}`} onClick={() => setSort(s.v)}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-cats">
            {CATS.map(c => (
              <button key={c.id} className={`mt-cat-btn${cat === c.id ? " active" : ""}`} onClick={() => setCat(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          <div className="mt-count">{filtered.length} test{filtered.length !== 1 ? "s" : ""} found</div>

          <div className="mt-cards">
            {filtered.map(t => (
              <TestCard key={t.id} test={t} userLoc={userLoc} sort={sort} onBook={handleBook} user={user} />
            ))}
          </div>
        </div>
      )}

      {tab === "my" && (
        <div className="mt-my">
          <MyBookings user={user} onAuth={onAuth} successBooking={latestBk} />
        </div>
      )}

      {bookTarget && user && (
        <BookingModal
          test={bookTarget.test}
          center={bookTarget.center}
          user={user}
          onClose={() => setBookTarget(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}
