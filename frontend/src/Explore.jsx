import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import LeafletMap from "./LeafletMap";
import "./Explore.css";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELIGIONS   = ["Islam", "Hinduism", "Christianity", "Buddhism", "Atheism", "Other"];
const GENDERS     = ["Male", "Female", "Other"];
const DTYPE_LABEL = { blood: "Blood", plasma: "Plasma", platelets: "Platelets", whole_blood: "Whole Blood" };
const URG_LABEL   = { critical: "Critical", urgent: "Urgent", normal: "Normal" };

const EMPTY_FILTERS = {
  blood_type: "", donation_type: "", urgency: "",
  gender: "", religion: "", drug_free: false,
  min_age: "", max_age: "", q: "",
};

function distanceKm(a, b) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180,
    dLng = ((b.lng - a.lng) * Math.PI) / 180,
    lat1 = (a.lat * Math.PI) / 180, lat2 = (b.lat * Math.PI) / 180,
    h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtKm(km) { return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`; }
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function dateStr(d) { return d ? new Date(d).toLocaleDateString() : null; }

export default function Explore({ user, onHome, onAuth, onOrgan, onProfile, onLogout, onHospitals, onAmbulance }) {
  const [tab, setTab]               = useState("requests");
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats]           = useState(null);
  const [requests, setRequests]     = useState([]);
  const [donors, setDonors]         = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [revealed, setRevealed]     = useState({});
  const [revealing, setRevealing]   = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating]     = useState(false);
  const [locError, setLocError]     = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selected, setSelected]     = useState(null); // { type:"request"|"donor", item, profile }
  const [profileLoading, setProfileLoading] = useState(false);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); }
  function resetFilters()   { setFilters(EMPTY_FILTERS); }

  const buildParams = useCallback((extra = {}) => {
    const p = { ...extra };
    Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v !== false && v != null) p[k] = v; });
    return p;
  }, [filters]);

  // Load stats once
  useEffect(() => {
    api.publicStats().then(setStats).catch(() => {});
    if (user) api.myRequests().then(d => setMyRequests(d.requests)).catch(() => {});
  }, []);

  // Reload data whenever tab or filters change
  useEffect(() => {
    setLoading(true);
    setError("");
    const params = buildParams();
    const call = tab === "requests"
      ? api.publicRequests(params).then(d => setRequests(d.requests))
      : api.publicDonors(params).then(d => setDonors(d.donors));
    call.catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [tab, filters]);

  function findNearest() {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocating(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      p => { setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => { setLocError("Allow location access and try again."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function accept(id) {
    if (!user) return onAuth("respond");
    setRevealing(id);
    try {
      const data = await api.requestContact(id);
      setRevealed(m => ({ ...m, [id]: data }));
      if (selected?.item?.id === id) setSelected(s => ({ ...s, revealed: data }));
    } catch (e) { setError(e.message); }
    finally { setRevealing(null); }
  }

  async function cancelMyRequest(id) {
    try { await api.cancelRequest(id); setMyRequests(p => p.filter(r => r.id !== id)); }
    catch (e) { setError(e.message); }
  }

  async function openProfile(type, item) {
    setSelected({ type, item, profile: null });
    if ((type === "request" && item.requester_id) || type === "donor") {
      setProfileLoading(true);
      const profileId = type === "donor" ? item.id : item.requester_id;
      try {
        const d = await api.publicProfile(profileId);
        setSelected(s => s ? { ...s, profile: d.profile } : null);
      } catch { /* profile stays null */ }
      finally { setProfileLoading(false); }
    }
  }

  // Decorate with distance and sort
  function withDistance(items) {
    return items.map(r => {
      const d = userLocation && r.latitude != null && r.longitude != null
        ? distanceKm(userLocation, { lat: r.latitude, lng: r.longitude }) : null;
      return { ...r, distance: d };
    }).sort((a, b) => userLocation ? (a.distance ?? Infinity) - (b.distance ?? Infinity) : 0);
  }

  const orderedRequests = withDistance(requests);
  const orderedDonors   = withDistance(donors);

  const mapMarkers = orderedRequests.filter(r => r.latitude != null).map(r => ({
    id: r.id, lat: r.latitude, lng: r.longitude, label: r.blood_type,
    popupHtml: `<b>${r.blood_type}</b> · ${r.units_needed} unit(s)<br>${[r.hospital, r.location].filter(Boolean).join(", ")}${r.distance != null ? `<br>~${fmtKm(r.distance)}` : ""}`,
  }));

  const activeFilters = Object.entries(filters).filter(([k, v]) => v !== "" && v !== false).length;

  return (
    <div className="explore">
      {/* ── NAV ── */}
      <header className="ex-nav">
        <a className="brand" onClick={onHome} role="button">🩺 <span>SaveLife</span></a>
        <div className="ex-nav-actions">
          <a className="ex-navlink" onClick={onHospitals} role="button">🏥 Hospitals</a>
          <a className="ex-navlink amb-link" onClick={onAmbulance} role="button">🚑 Ambulance</a>
          <a className="ex-navlink" onClick={onOrgan} role="button">Organ Donation</a>
          {user ? (
            <>
              <span className="ex-greet">Hi, {user.name.split(" ")[0]}</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowRequestForm(true)}>＋ Post Request</button>
              <button className="btn btn-outline" onClick={onProfile}>My Profile</button>
              <button className="btn btn-outline" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => onAuth("request")}>Request Blood</button>
              <button className="btn btn-primary" onClick={() => onAuth("donate")}>Donate</button>
            </>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="ex-hero">
        <h1>Explore SaveLife</h1>
        <p>Find blood requests and donors near you — filter by blood type, religion, age, and more.</p>
      </section>

      {/* ── STATS ── */}
      <section className="ex-stats">
        <Stat value={stats?.donors}          label="Registered donors" />
        <Stat value={stats?.openRequests}    label="Open requests" />
        <Stat value={stats?.criticalRequests} label="Critical now" accent />
        <Stat value={stats?.unitsNeeded}     label="Units needed" />
      </section>

      {/* ── MY REQUESTS ── */}
      {user && myRequests.filter(r => r.status === "open").length > 0 && (
        <div className="my-req-section">
          <div className="my-req-head">
            <h3>My active requests</h3>
            <span className="ex-muted" style={{ fontSize: "0.8rem" }}>Visible to donors below</span>
          </div>
          <div className="my-req-list">
            {myRequests.filter(r => r.status === "open").map(r => (
              <div className="my-req-row" key={r.id}>
                <span className="blood-badge">{r.blood_type}</span>
                <div className="my-req-row-info">
                  <strong>{DTYPE_LABEL[r.donation_type] || r.donation_type} — {r.units_needed} unit{r.units_needed > 1 ? "s" : ""}</strong>
                  <p>{r.hospital || r.location || "No location"} · {timeAgo(r.created_at)}</p>
                </div>
                <span className={`urg-badge urg-${r.urgency}`}>{r.urgency}</span>
                <button className="my-req-cancel" onClick={() => cancelMyRequest(r.id)}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="ex-tabs">
        <button className={tab === "requests" ? "ex-tab active" : "ex-tab"} onClick={() => setTab("requests")}>
          🩸 Blood Requests
        </button>
        <button className={tab === "donors" ? "ex-tab active" : "ex-tab"} onClick={() => setTab("donors")}>
          👥 Find Donors
        </button>
        <button className="ex-tab filter-toggle" onClick={() => setShowFilters(v => !v)}>
          ⚙ Filters {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
        </button>
      </div>

      {/* ── LAYOUT: sidebar + content ── */}
      <div className="ex-layout">
        {/* Filter Sidebar */}
        <aside className={`filter-panel ${showFilters ? "open" : ""}`}>
          <div className="filter-header">
            <h3>Filters</h3>
            {activeFilters > 0 && (
              <button className="filter-reset" onClick={resetFilters}>Reset all</button>
            )}
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Search name / location</label>
            <input className="filter-search" placeholder="e.g. Mirpur, Karim…"
              value={filters.q} onChange={e => setFilter("q", e.target.value)} />
          </div>

          {/* Blood Type */}
          <div className="filter-group">
            <label>Blood Type</label>
            <div className="filter-chips">
              {BLOOD_TYPES.map(bt => (
                <button key={bt}
                  className={`chip ${filters.blood_type === bt ? "chip-active" : ""}`}
                  onClick={() => setFilter("blood_type", filters.blood_type === bt ? "" : bt)}>
                  {bt}
                </button>
              ))}
            </div>
          </div>

          {/* Donation Type — requests only */}
          {tab === "requests" && (
            <div className="filter-group">
              <label>Donation Type</label>
              <div className="filter-chips">
                {Object.entries(DTYPE_LABEL).map(([k, v]) => (
                  <button key={k}
                    className={`chip ${filters.donation_type === k ? "chip-active" : ""}`}
                    onClick={() => setFilter("donation_type", filters.donation_type === k ? "" : k)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Urgency — requests only */}
          {tab === "requests" && (
            <div className="filter-group">
              <label>Urgency</label>
              <div className="filter-chips">
                {["critical", "urgent", "normal"].map(u => (
                  <button key={u}
                    className={`chip chip-urg-${u} ${filters.urgency === u ? "chip-active" : ""}`}
                    onClick={() => setFilter("urgency", filters.urgency === u ? "" : u)}>
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gender */}
          <div className="filter-group">
            <label>Gender</label>
            <div className="filter-chips">
              {GENDERS.map(g => (
                <button key={g}
                  className={`chip ${filters.gender === g ? "chip-active" : ""}`}
                  onClick={() => setFilter("gender", filters.gender === g ? "" : g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Religion */}
          <div className="filter-group">
            <label>Religion</label>
            <select className="filter-select" value={filters.religion}
              onChange={e => setFilter("religion", e.target.value)}>
              <option value="">Any</option>
              {RELIGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Age */}
          <div className="filter-group">
            <label>Age Range</label>
            <div className="filter-age-row">
              <input type="number" min="0" max="120" placeholder="Min"
                value={filters.min_age} onChange={e => setFilter("min_age", e.target.value)} />
              <span>–</span>
              <input type="number" min="0" max="120" placeholder="Max"
                value={filters.max_age} onChange={e => setFilter("max_age", e.target.value)} />
            </div>
          </div>

          {/* Drug free */}
          <div className="filter-group">
            <label>Drug status</label>
            <button
              className={`chip ${filters.drug_free ? "chip-active chip-safe" : ""}`}
              onClick={() => setFilter("drug_free", !filters.drug_free)}>
              {filters.drug_free ? "✓ Drug-free only" : "Any"}
            </button>
          </div>

          {/* Location */}
          <div className="filter-group">
            <label>Sort by distance</label>
            <button className="btn btn-outline btn-sm" onClick={findNearest} disabled={locating}>
              {locating ? "Detecting…" : userLocation ? "✓ Location active" : "📍 Use my location"}
            </button>
            {locError && <p className="filter-error">{locError}</p>}
            {userLocation && <p className="filter-hint">Nearest first</p>}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="ex-main">
          {error && <p className="ex-error">{error}</p>}

          {tab === "requests" ? (
            <>
              {mapMarkers.length > 0 && (
                <div className="ex-map-wrap">
                  <LeafletMap markers={mapMarkers} userLocation={userLocation} height={300} />
                </div>
              )}
              {loading ? <p className="ex-muted">Loading…</p>
                : orderedRequests.length === 0 ? <p className="ex-muted">No requests match your filters.</p>
                : (
                  <div className="req-grid">
                    {orderedRequests.map(r => (
                      <RequestCard key={r.id} r={r} info={revealed[r.id]}
                        onOpen={() => openProfile("request", r)}
                        onAccept={() => accept(r.id)}
                        accepting={revealing === r.id}
                        user={user} onAuth={onAuth} />
                    ))}
                  </div>
                )}
            </>
          ) : (
            <>
              {loading ? <p className="ex-muted">Loading donors…</p>
                : orderedDonors.length === 0 ? <p className="ex-muted">No donors match your filters.</p>
                : (
                  <div className="donor-grid">
                    {orderedDonors.map(d => (
                      <DonorCard key={d.id} donor={d} onOpen={() => openProfile("donor", d)} />
                    ))}
                  </div>
                )}
            </>
          )}
        </main>
      </div>

      {/* ── ORGAN TEASER ── */}
      <section className="ex-section">
        <div className="og-teaser">
          <div>
            <h2>🫀 Learn about organ donation</h2>
            <p>One donor can save up to 8 lives. Read our awareness guide.</p>
          </div>
          <button className="btn btn-outline" onClick={onOrgan}>Read more →</button>
        </div>
      </section>

      {/* ── CTA ── */}
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

      {/* ── MODALS ── */}
      {showRequestForm && (
        <RequestModal user={user} onClose={() => setShowRequestForm(false)}
          onPosted={() => {
            setShowRequestForm(false);
            api.publicRequests(buildParams()).then(d => setRequests(d.requests)).catch(() => {});
            api.myRequests().then(d => setMyRequests(d.requests)).catch(() => {});
          }} />
      )}

      {selected && (
        <ProfileModal
          type={selected.type}
          item={selected.item}
          profile={selected.profile}
          profileLoading={profileLoading}
          revealed={selected.type === "request" ? revealed[selected.item?.id] : null}
          onClose={() => setSelected(null)}
          onAccept={() => accept(selected.item.id)}
          accepting={revealing === selected.item?.id}
          user={user}
          onAuth={onAuth}
        />
      )}
    </div>
  );
}

/* ── REQUEST CARD ── */
function RequestCard({ r, info, onOpen, onAccept, accepting, user, onAuth }) {
  return (
    <div className={`req-card urg-${r.urgency}`} onClick={onOpen} role="button">
      <div className="req-top">
        <span className="blood-badge">{r.blood_type}</span>
        <span className={`urg-badge urg-${r.urgency}`}>{URG_LABEL[r.urgency] || r.urgency}</span>
        {r.donation_type && r.donation_type !== "blood" && (
          <span className={`dtype-badge dtype-${r.donation_type}`}>{DTYPE_LABEL[r.donation_type]}</span>
        )}
      </div>
      <p className="req-units">{r.units_needed} unit{r.units_needed > 1 ? "s" : ""} needed</p>
      {(r.hospital || r.location) && (
        <p className="req-where">
          {r.hospital ? `🏥 ${r.hospital}` : ""}
          {r.location ? ` 📍 ${r.location}` : ""}
        </p>
      )}
      {r.distance != null && <p className="req-distance">🧭 {fmtKm(r.distance)} away</p>}

      {/* Mini requester info */}
      <div className="req-meta-row">
        {r.requester_gender && <span className="meta-chip">{r.requester_gender}</span>}
        {r.requester_age    && <span className="meta-chip">{r.requester_age} yrs</span>}
        {r.requester_religion && <span className="meta-chip">{r.requester_religion}</span>}
        {r.requester_drug_addicted === false && <span className="meta-chip safe">Drug-free</span>}
      </div>

      <p className={`req-phone ${info ? "revealed" : ""}`}>
        📞 {info ? <a href={`tel:${info.contact_phone}`} onClick={e => e.stopPropagation()}>{info.contact_phone}</a> : "••••••••••"}
      </p>
      {info && <p className="req-patient">Patient: {info.patient_name}</p>}
      <p className="req-time">{timeAgo(r.created_at)}</p>

      {!info && (
        <button className={`btn btn-sm ${user ? "btn-primary" : "btn-outline"}`}
          disabled={accepting}
          onClick={e => { e.stopPropagation(); user ? onAccept() : onAuth("respond"); }}>
          {accepting ? "…" : user ? "Accept to donate" : "Log in to donate"}
        </button>
      )}
    </div>
  );
}

/* ── DONOR CARD ── */
function DonorCard({ donor: d, onOpen }) {
  return (
    <div className="donor-card" onClick={onOpen} role="button">
      <div className="dc-avatar">
        {d.avatar_url
          ? <img src={d.avatar_url} alt={d.name} />
          : <div className="dc-avatar-ph">{d.name?.[0]?.toUpperCase()}</div>}
      </div>
      <div className="dc-info">
        <div className="dc-top">
          <span className="blood-badge">{d.blood_type || "?"}</span>
          {d.donation_count > 0 && <span className="dc-donated">{d.donation_count}× donated</span>}
        </div>
        <h3 className="dc-name">{d.name}</h3>
        <div className="dc-tags">
          {d.age && <span>{d.age} yrs</span>}
          {d.gender && <span>{d.gender}</span>}
          {d.religion && <span>{d.religion}</span>}
          {d.drug_addicted === false && <span className="safe">Drug-free</span>}
        </div>
        {d.location_text && <p className="dc-loc">📍 {d.location_text}</p>}
        {d.distance != null && <p className="dc-dist">🧭 {fmtKm(d.distance)} away</p>}
        {d.last_donation && <p className="dc-last">Last donated: {dateStr(d.last_donation)}</p>}
      </div>
    </div>
  );
}

/* ── PROFILE MODAL ── */
function ProfileModal({ type, item, profile, profileLoading, revealed, onClose, onAccept, accepting, user, onAuth }) {
  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-card" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>×</button>

        {/* Request details section */}
        {type === "request" && (
          <div className="pm-req-section">
            <div className="pm-req-top">
              <span className="blood-badge lg">{item.blood_type}</span>
              <span className={`urg-badge urg-${item.urgency}`}>{URG_LABEL[item.urgency]}</span>
              {item.donation_type !== "blood" && (
                <span className={`dtype-badge dtype-${item.donation_type}`}>{DTYPE_LABEL[item.donation_type]}</span>
              )}
            </div>
            <p className="pm-units">{item.units_needed} unit{item.units_needed > 1 ? "s" : ""} needed</p>
            {item.hospital && <p className="pm-where">🏥 {item.hospital}</p>}
            {item.location && <p className="pm-where">📍 {item.location}</p>}
            {item.note && <p className="pm-note">"{item.note}"</p>}
            {item.distance != null && <p className="pm-dist">🧭 {fmtKm(item.distance)} away</p>}
          </div>
        )}

        {/* Profile section */}
        <div className="pm-profile-section">
          {profileLoading ? (
            <p className="pm-loading">Loading profile…</p>
          ) : profile ? (
            <>
              <div className="pm-avatar">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} />
                  : <div className="pm-avatar-ph">{profile.name?.[0]?.toUpperCase()}</div>}
              </div>
              <h2 className="pm-name">{profile.name}</h2>
              {type === "donor" && profile.blood_type && (
                <span className="blood-badge lg">{profile.blood_type}</span>
              )}

              <div className="pm-stats">
                {profile.age      && <div className="pm-stat"><strong>{profile.age}</strong><span>Age</span></div>}
                {profile.gender   && <div className="pm-stat"><strong>{profile.gender}</strong><span>Gender</span></div>}
                {profile.religion && <div className="pm-stat"><strong>{profile.religion}</strong><span>Religion</span></div>}
                {profile.donation_count != null && (
                  <div className="pm-stat"><strong>{profile.donation_count}</strong><span>Donations</span></div>
                )}
              </div>

              {profile.drug_addicted != null && (
                <div className={`pm-drug ${profile.drug_addicted ? "pm-drug-yes" : "pm-drug-no"}`}>
                  {profile.drug_addicted ? "⚠ Drug addicted" : "✓ Drug-free"}
                </div>
              )}

              {profile.medical_conditions && (
                <div className="pm-medical">
                  <strong>Medical conditions</strong>
                  <p>{profile.medical_conditions}</p>
                </div>
              )}

              {profile.last_donation && (
                <p className="pm-last">Last donated: {dateStr(profile.last_donation)}</p>
              )}

              {profile.location_text && (
                <p className="pm-loc">📍 {profile.location_text}</p>
              )}
            </>
          ) : type === "request" ? (
            <p className="pm-anon">The requester has not set up a public profile.</p>
          ) : null}
        </div>

        {/* Action area */}
        {type === "request" && (
          <div className="pm-actions">
            {revealed ? (
              <div className="pm-contact-revealed">
                <p className="pm-contact-label">Contact</p>
                <a className="pm-phone" href={`tel:${revealed.contact_phone}`}>{revealed.contact_phone}</a>
                {revealed.patient_name && <p className="pm-patient">Patient: {revealed.patient_name}</p>}
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" disabled={accepting}
                onClick={() => user ? onAccept() : onAuth("respond")}>
                {accepting ? "Connecting…" : user ? "Accept to donate — reveal contact" : "Log in to accept"}
              </button>
            )}
          </div>
        )}

        {type === "donor" && (
          <div className="pm-actions">
            <p className="pm-donor-hint">
              Interested in this donor? Post a blood request with blood type
              <strong> {profile?.blood_type || item?.blood_type}</strong> and compatible donors will see it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── STAT CHIP ── */
function Stat({ value, label, accent }) {
  return (
    <div className={`ex-stat ${accent ? "accent" : ""}`}>
      <strong>{value ?? "—"}</strong>
      <span>{label}</span>
    </div>
  );
}

/* ── REQUEST MODAL ── */
function RequestModal({ user, onClose, onPosted }) {
  const [form, setForm] = useState({
    donation_type: "blood", blood_type: user?.blood_type || "",
    units_needed: 1, patient_name: user?.name || "",
    contact_phone: user?.phone || "", hospital: "", location: "",
    urgency: "urgent", note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await api.createRequest({ ...form, units_needed: Number(form.units_needed) || 1 });
      onPosted();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="req-modal-backdrop" onClick={onClose}>
      <form className="req-modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h3>🩸 Post a Blood / Plasma Request</h3>
        <p className="modal-hint">Your request is public. Donors will see it and can accept to help you.</p>
        <div className="rm-grid">
          <div className="rm-field">
            <label>Donation type *</label>
            <select value={form.donation_type} onChange={set("donation_type")}>
              <option value="blood">Blood</option>
              <option value="plasma">Plasma</option>
              <option value="platelets">Platelets</option>
              <option value="whole_blood">Whole Blood</option>
            </select>
          </div>
          <div className="rm-field">
            <label>Blood group *</label>
            <select value={form.blood_type} onChange={set("blood_type")} required>
              <option value="">Select</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="rm-field">
            <label>Units needed</label>
            <input type="number" min="1" max="20" value={form.units_needed} onChange={set("units_needed")} />
          </div>
          <div className="rm-field">
            <label>Patient name *</label>
            <input value={form.patient_name} onChange={set("patient_name")} required placeholder="Full name" />
          </div>
          <div className="rm-field full">
            <label>Contact phone * (donors see this after accepting)</label>
            <input value={form.contact_phone} onChange={set("contact_phone")}
              inputMode="numeric" maxLength={11} required placeholder="01712345678" />
          </div>
          <div className="rm-field">
            <label>Hospital</label>
            <input value={form.hospital} onChange={set("hospital")} placeholder="e.g. Dhaka Medical" />
          </div>
          <div className="rm-field">
            <label>City / Location</label>
            <input value={form.location} onChange={set("location")} placeholder="e.g. Mirpur, Dhaka" />
          </div>
          <div className="rm-field full">
            <label>Urgency</label>
            <div className="rm-urgency">
              {["normal", "urgent", "critical"].map(u => (
                <button key={u} type="button"
                  className={form.urgency === u ? `on-${u}` : ""}
                  onClick={() => setForm(f => ({ ...f, urgency: u }))}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="rm-field full">
            <label>Note for donor</label>
            <textarea rows={2} value={form.note} onChange={set("note")} placeholder="Any extra info…" />
          </div>
        </div>
        {error && <p className="rm-error">{error}</p>}
        <div className="rm-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Posting…" : "Post request"}</button>
        </div>
      </form>
    </div>
  );
}
