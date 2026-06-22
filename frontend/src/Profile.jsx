import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import "./Profile.css";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DOC_LABELS = {
  certificate: "Donation Certificate",
  medical: "Medical Report",
  identity: "Identity Proof",
  other: "Other",
};

export default function Profile({ user, emailNotifications, onBack, onLogout, onUserUpdate }) {
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    age: user.age ?? "",
    gender: user.gender || "",
    weight: user.weight ?? "",
    blood_type: user.blood_type || "",
    donation_count: user.donation_count ?? 0,
    last_donation: user.last_donation ? user.last_donation.slice(0, 10) : "",
    donation_history: user.donation_history || "",
    drug_addicted: user.drug_addicted ? "yes" : "no",
    medical_conditions: user.medical_conditions || "",
    religion: user.religion || "",
    location_text: user.location_text || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState("certificate");
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const docInputRef = useRef(null);

  useEffect(() => {
    api.myDocuments().then((d) => setDocs(d.documents)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarBusy(true);
    setError("");
    try {
      const { avatar_url } = await api.uploadAvatar(file);
      setAvatarUrl(avatar_url);
      onUserUpdate({ ...user, avatar_url });
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarBusy(false);
      e.target.value = "";
    }
  }

  async function saveProfile() {
    setError("");
    setBusy(true);
    try {
      const { user: updated } = await api.updateProfile({
        ...form,
        drug_addicted: form.drug_addicted === "yes",
      });
      onUserUpdate(updated);
      setEditing(false);
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadDoc(file) {
    setDocError("");
    setDocBusy(true);
    try {
      await api.uploadDocument(file, docType);
      const d = await api.myDocuments();
      setDocs(d.documents);
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocBusy(false);
    }
  }

  function handleDocFile(e) {
    const file = e.target.files[0];
    if (file) uploadDoc(file);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadDoc(file);
  }

  async function deleteDoc(id) {
    try {
      await api.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  }

  const [notifBusy, setNotifBusy] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [notifOk, setNotifOk] = useState(false);

  async function sendTestNotif() {
    setNotifBusy(true);
    setNotifMsg("");
    setNotifOk(false);
    try {
      const { sentTo } = await api.testEmail();
      setNotifMsg(`Test email sent to ${sentTo}! Check your inbox (and spam folder).`);
      setNotifOk(true);
    } catch (err) {
      setNotifMsg(err.message);
    } finally {
      setNotifBusy(false);
    }
  }

  const initials = (user.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="pf-page">
      {/* ── Nav ── */}
      <header className="pf-nav">
        <a className="pf-brand" onClick={onBack} role="button">
          🩺 <span>SaveLife</span>
        </a>
        <div className="pf-nav-right">
          <button className="pf-btn pf-outline" onClick={onBack}>← Explore</button>
          <button className="pf-btn pf-danger" onClick={onLogout}>Log out</button>
        </div>
      </header>

      {/* ── Hero: avatar + name ── */}
      <section className="pf-hero">
        <label className="avatar-ring" title="Click to change photo">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile photo" className="avatar-photo" />
          ) : (
            <div className="avatar-letters">{initials}</div>
          )}
          <div className={`avatar-overlay${avatarBusy ? " loading" : ""}`}>
            {avatarBusy ? "⏳" : "📷 Change"}
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
        </label>

        <div className="pf-hero-text">
          <h1>{user.name}</h1>
          <div className="pf-chips">
            {user.blood_type && <span className="pf-chip pf-chip-blood">🩸 {user.blood_type}</span>}
            <span className="pf-chip pf-chip-id">{user.user_code}</span>
            {user.created_at && (
              <span className="pf-chip pf-chip-muted">
                Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats row ── */}
      <div className="pf-stats-row">
        {[
          ["Donations", user.donation_count ?? 0],
          ["Age", user.age ?? "—"],
          ["Weight", user.weight ? `${user.weight} kg` : "—"],
          ["Last donated", user.last_donation
            ? new Date(user.last_donation).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "—"],
        ].map(([label, val]) => (
          <div className="pf-stat" key={label}>
            <strong>{val}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="pf-tabs">
        <button className={`pf-tab${tab === "info" ? " pf-tab-on" : ""}`} onClick={() => setTab("info")}>
          Personal Info
        </button>
        <button className={`pf-tab${tab === "certs" ? " pf-tab-on" : ""}`} onClick={() => setTab("certs")}>
          Certificates &amp; Docs
          {docs.length > 0 && <span className="pf-tab-badge">{docs.length}</span>}
        </button>
        <button className={`pf-tab${tab === "notif" ? " pf-tab-on" : ""}`} onClick={() => setTab("notif")}>
          🔔 Notifications
        </button>
      </div>

      {/* ── Personal Info tab ── */}
      {tab === "info" && (
        <section className="pf-section">
          {error && <p className="pf-msg pf-error">{error}</p>}
          {success && <p className="pf-msg pf-success">{success}</p>}

          <div className="pf-section-head">
            <h2>Personal Information</h2>
            {!editing && (
              <button className="pf-btn pf-outline" onClick={() => setEditing(true)}>
                ✏️ Edit profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="ef-wrap">
              <div className="ef-grid">
                <Field label="Full name">
                  <input value={form.name} onChange={set("name")} placeholder="Full name" />
                </Field>
                <Field label="Phone (11 digits)">
                  <input value={form.phone} onChange={set("phone")} placeholder="01712345678" inputMode="numeric" maxLength={11} />
                </Field>
                <Field label="Age">
                  <input type="number" min="0" value={form.age} onChange={set("age")} placeholder="Age" />
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={set("gender")}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" min="0" step="0.1" value={form.weight} onChange={set("weight")} placeholder="Weight" />
                </Field>
                <Field label="Blood group">
                  <select value={form.blood_type} onChange={set("blood_type")}>
                    <option value="">Select</option>
                    {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Times donated">
                  <input type="number" min="0" value={form.donation_count} onChange={set("donation_count")} />
                </Field>
                <Field label="Last donation date">
                  <input type="date" value={form.last_donation} onChange={set("last_donation")} />
                </Field>
              </div>

              <Field label="Donation history" full>
                <textarea
                  rows={3}
                  value={form.donation_history}
                  onChange={set("donation_history")}
                  placeholder="e.g. Donated at Dhaka Medical, June 2024"
                />
              </Field>

              <Field label="Drug addicted?" full>
                <div className="ef-toggle">
                  <button
                    type="button"
                    className={form.drug_addicted === "no" ? "ef-on" : ""}
                    onClick={() => setForm((f) => ({ ...f, drug_addicted: "no" }))}
                  >No</button>
                  <button
                    type="button"
                    className={form.drug_addicted === "yes" ? "ef-on ef-danger" : ""}
                    onClick={() => setForm((f) => ({ ...f, drug_addicted: "yes" }))}
                  >Yes</button>
                </div>
              </Field>

              <Field label="Medical conditions" full>
                <textarea
                  rows={3}
                  value={form.medical_conditions}
                  onChange={set("medical_conditions")}
                  placeholder="e.g. Diabetes, hepatitis, none"
                />
              </Field>

              <Field label="Religion" full>
                <select value={form.religion} onChange={set("religion")}>
                  <option value="">Prefer not to say</option>
                  <option>Islam</option>
                  <option>Hinduism</option>
                  <option>Christianity</option>
                  <option>Buddhism</option>
                  <option>Atheism</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Your location / area" full>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={form.location_text}
                    onChange={set("location_text")}
                    placeholder="e.g. Mirpur, Dhaka"
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="pf-btn pf-outline"
                    style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(pos => {
                        setForm(f => ({
                          ...f,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        }));
                      });
                    }}>
                    📍 Detect
                  </button>
                </div>
              </Field>

              <div className="ef-actions">
                <button className="pf-btn pf-outline" onClick={() => { setEditing(false); setError(""); }}>
                  Cancel
                </button>
                <button className="pf-btn pf-primary" onClick={saveProfile} disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="info-rows">
              {[
                ["Email", user.email],
                ["Phone", user.phone],
                ["Blood group", user.blood_type],
                ["Age", user.age],
                ["Gender", user.gender],
                ["Weight", user.weight ? `${user.weight} kg` : null],
                ["Times donated", user.donation_count ?? 0],
                ["Last donation", user.last_donation ? new Date(user.last_donation).toLocaleDateString() : null],
                ["Donation history", user.donation_history],
                ["Drug addicted", user.drug_addicted ? "Yes" : "No"],
                ["Medical conditions", user.medical_conditions],
                ["Religion", user.religion],
                ["Location", user.location_text],
                ["Donor ID", user.user_code],
                ["Member since", user.created_at ? new Date(user.created_at).toLocaleDateString() : null],
              ].map(([label, value]) => (
                <div className="info-row" key={label}>
                  <span className="info-label">{label}</span>
                  <span className="info-value">
                    {value === null || value === undefined || value === ""
                      ? <span className="info-empty">—</span>
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Certificates tab ── */}
      {tab === "certs" && (
        <section className="pf-section">
          <div className="pf-section-head">
            <h2>Certificates &amp; Documents</h2>
          </div>
          <p className="pf-hint">
            Upload donation certificates, medical reports, or identity documents.
            Accepted: JPG, PNG, PDF · max 10 MB each.
          </p>

          <div className="upload-row">
            <select
              className="doc-type-sel"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {Object.entries(DOC_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              className="pf-btn pf-primary"
              disabled={docBusy}
              onClick={() => docInputRef.current?.click()}
            >
              {docBusy ? "Uploading…" : "📎 Upload file"}
            </button>
            <input
              ref={docInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleDocFile}
              hidden
            />
          </div>

          <div
            className={`drop-zone${dragOver ? " drag-active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !docBusy && docInputRef.current?.click()}
          >
            {docBusy ? (
              <p className="drop-uploading">⏳ Uploading…</p>
            ) : (
              <>
                <p className="drop-icon">📁</p>
                <p>Drag &amp; drop a file here, or click to browse</p>
                <p className="drop-hint">PDF · JPG · PNG · max 10 MB</p>
              </>
            )}
          </div>

          {docError && <p className="pf-msg pf-error">{docError}</p>}

          <div className="doc-list">
            {docs.length === 0 ? (
              <p className="pf-hint pf-no-docs">No documents uploaded yet.</p>
            ) : (
              docs.map((d) => (
                <div className="doc-row" key={d.id}>
                  <span className="doc-icon-lg">
                    {d.file_path.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️"}
                  </span>
                  <div className="doc-info">
                    <a
                      href={d.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="doc-name"
                    >
                      {d.file_name}
                    </a>
                    <span className="doc-meta">
                      {DOC_LABELS[d.doc_type] || d.doc_type} · {new Date(d.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="doc-del"
                    title="Delete document"
                    onClick={() => deleteDoc(d.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Notifications tab ── */}
      {tab === "notif" && (
        <section className="pf-section">
          <div className="pf-section-head">
            <h2>🔔 Email Notifications</h2>
            <span className={`notif-status ${emailNotifications ? "notif-on" : "notif-off"}`}>
              {emailNotifications ? "● Active" : "● Not configured"}
            </span>
          </div>

          <p className="pf-hint">
            When a donor accepts your blood or plasma request, SaveLife sends an email to your
            registered address — <strong style={{ color: "var(--text)" }}>{user.email}</strong>.
            No app, no SMS, no signup required.
          </p>

          {/* Email preview card */}
          <div className="notif-email-preview">
            <div className="nep-header">
              <span className="nep-from">SaveLife 🩺 &lt;noreply@savelife&gt;</span>
              <span className="nep-label">Sample email</span>
            </div>
            <div className="nep-subject">💉 Karim Ahmed wants to help you — SaveLife</div>
            <div className="nep-body">
              <div className="nep-hero">
                <div style={{ fontSize: "2rem" }}>💉</div>
                <strong>Someone wants to help you!</strong>
                <p>A donor on SaveLife accepted your Blood request.</p>
              </div>
              <div className="nep-row">
                <span className="nep-row-label">Donor</span>
                <span>👤 Karim Ahmed</span>
              </div>
              <div className="nep-row">
                <span className="nep-row-label">Contact</span>
                <span style={{ color: "#60a5fa" }}>📞 01712345678</span>
              </div>
              <div className="nep-row">
                <span className="nep-row-label">Request</span>
                <span>🩸 B+ Blood · 2 units · Dhaka Medical</span>
              </div>
              <div className="nep-cta">📞 Call Donor Now</div>
            </div>
          </div>

          {/* How it works */}
          <div className="notif-card" style={{ marginTop: 20 }}>
            <div className="notif-step">
              <span className="notif-num">1</span>
              <div>
                <strong>Post a blood or plasma request</strong>
                <p>Go to Explore → click <em>"＋ Post Request"</em> and fill in your details.</p>
              </div>
            </div>
            <div className="notif-step">
              <span className="notif-num">2</span>
              <div>
                <strong>A donor accepts your request</strong>
                <p>They click <em>"Accept to donate"</em> on your card in the public feed.</p>
              </div>
            </div>
            <div className="notif-step">
              <span className="notif-num">3</span>
              <div>
                <strong>You get an email instantly</strong>
                <p>
                  Sent to <strong>{user.email}</strong> with the donor's name and phone number.
                  No app, no SMS cost — just your regular email.
                </p>
              </div>
            </div>
          </div>

          {!emailNotifications && (
            <div className="notif-setup-box">
              <h3>⚙️ One-time setup (3 minutes)</h3>
              <p>Create a <strong style={{ color: "#fbbf24" }}>free dedicated Gmail</strong> just for SaveLife — completely separate from your personal account.</p>
              <div className="notif-steps-mini">
                <div className="nsm-row">
                  <span className="nsm-n">1</span>
                  <span>Create a free Gmail — e.g. <code>savelife.alerts@gmail.com</code></span>
                </div>
                <div className="nsm-row">
                  <span className="nsm-n">2</span>
                  <span>In that Gmail → <strong>Manage Account → Security</strong> → turn on <strong>2-Step Verification</strong></span>
                </div>
                <div className="nsm-row">
                  <span className="nsm-n">3</span>
                  <span>Security → <strong>App passwords</strong> → create one named "SaveLife" → copy the 16-character code</span>
                </div>
                <div className="nsm-row">
                  <span className="nsm-n">4</span>
                  <span>Open <code>backend/.env</code> and fill in:</span>
                </div>
              </div>
              <pre className="notif-code">{`EMAIL_USER=savelife.alerts@gmail.com\nEMAIL_PASS=abcd efgh ijkl mnop`}</pre>
              <div className="nsm-row" style={{ marginTop: 10 }}>
                <span className="nsm-n">5</span>
                <span>Restart the backend — emails now deliver to <strong>any user's inbox</strong></span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button className="pf-btn pf-primary" disabled={notifBusy || !emailNotifications} onClick={sendTestNotif}>
              {notifBusy ? "Sending…" : "📧 Send test email"}
            </button>
            {notifMsg && (
              <span style={{ color: notifOk ? "#34d399" : "#fca5a5", fontSize: "0.88rem" }}>
                {notifMsg}
              </span>
            )}
            {!emailNotifications && (
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                Configure email on the server first to enable test.
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={`ef-field${full ? " ef-full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
