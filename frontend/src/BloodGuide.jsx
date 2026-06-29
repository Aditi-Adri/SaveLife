import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { api } from "./api";
import "./BloodGuide.css";

// ── Data ─────────────────────────────────────────────────────────────────────

const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const COMPAT = {
  "O-":  { to: ["O-","O+","A-","A+","B-","B+","AB-","AB+"], from: ["O-"] },
  "O+":  { to: ["O+","A+","B+","AB+"],                       from: ["O-","O+"] },
  "A-":  { to: ["A-","A+","AB-","AB+"],                      from: ["O-","A-"] },
  "A+":  { to: ["A+","AB+"],                                  from: ["O-","O+","A-","A+"] },
  "B-":  { to: ["B-","B+","AB-","AB+"],                      from: ["O-","B-"] },
  "B+":  { to: ["B+","AB+"],                                  from: ["O-","O+","B-","B+"] },
  "AB-": { to: ["AB-","AB+"],                                 from: ["O-","A-","B-","AB-"] },
  "AB+": { to: ["AB+"],                                       from: ["O-","O+","A-","A+","B-","B+","AB-","AB+"] },
};

const SPECIAL = {
  "O-":  { title: "Universal Donor",     color: "#dc2626", desc: "Your blood can save anyone on Earth. Only 6% of people have O-." },
  "O+":  { title: "Most Common",         color: "#ef4444", desc: "The most needed blood type — 1 in 3 people are O+." },
  "A-":  { title: "Rare & Valuable",     color: "#2563eb", desc: "A- can donate red cells to 4 blood types." },
  "A+":  { title: "Second Most Common",  color: "#3b82f6", desc: "A+ is needed daily in hospitals across Bangladesh." },
  "B-":  { title: "Rare Hero",           color: "#16a34a", desc: "Only 2% of people are B-. Your donations are critical." },
  "B+":  { title: "Important Donor",     color: "#22c55e", desc: "B+ is common in South Asia — always in demand." },
  "AB-": { title: "Universal Plasma",    color: "#7c3aed", desc: "AB- plasma can be given to anyone. Extremely rare." },
  "AB+": { title: "Universal Recipient", color: "#a855f7", desc: "You can receive from all blood types." },
};

const TYPE_COLOR = {
  "O-":"#dc2626","O+":"#ef4444","A-":"#2563eb","A+":"#3b82f6",
  "B-":"#16a34a","B+":"#22c55e","AB-":"#7c3aed","AB+":"#a855f7",
};

const ORGANS = [
  {
    emoji: "🩸", name: "Whole Blood",
    match: "ABO + Rh must match exactly",
    interval: "Every 90 days",
    saves: "Up to 3 patients per donation",
    note: "Most common donation. Takes ~10 min to draw.",
    color: "#dc2626",
  },
  {
    emoji: "🫀", name: "Heart",
    match: "ABO compatible + size match",
    interval: "One-time (post-mortem)",
    saves: "1 life",
    note: "Must be transplanted within 4-6 hours of donation.",
    color: "#e11d48",
  },
  {
    emoji: "🫁", name: "Lungs",
    match: "ABO compatible + chest size",
    interval: "One-time (post-mortem)",
    saves: "1-2 patients",
    note: "Can give both lungs to one patient or one each to two.",
    color: "#0891b2",
  },
  {
    emoji: "🫘", name: "Kidneys",
    match: "ABO compatible + HLA typing",
    interval: "One per lifetime (living donor)",
    saves: "1-2 patients",
    note: "Living donors can give one kidney and live normally.",
    color: "#d97706",
  },
  {
    emoji: "🫀", name: "Liver",
    match: "ABO compatible (flexible)",
    interval: "Partial (living donor) possible",
    saves: "1 life",
    note: "The liver regenerates — living donors can give a portion.",
    color: "#b45309",
  },
  {
    emoji: "👁️", name: "Cornea",
    match: "NO blood type match needed",
    interval: "One-time (post-mortem)",
    saves: "2 patients (one cornea each)",
    note: "Corneas have no blood supply — anyone can donate to anyone.",
    color: "#0284c7",
  },
  {
    emoji: "🦴", name: "Bone Marrow",
    match: "HLA genetic match (10 markers)",
    interval: "One-time (living donor)",
    saves: "1 patient (leukemia, lymphoma)",
    note: "Marrow regenerates in weeks. Finding an HLA match is rare — only 1 in 20,000.",
    color: "#059669",
  },
  {
    emoji: "🩺", name: "Plasma",
    match: "AB plasma = universal",
    interval: "Every 14 days",
    saves: "Multiple patients (burns, clotting disorders)",
    note: "AB plasma donors are urgently needed — only 4% of people are AB.",
    color: "#7c3aed",
  },
];

const TESTS = [
  {
    icon: "⚖️", title: "Weight",
    rule: "Minimum 50 kg",
    why: "Prevents blood pressure drop and dizziness after donation.",
    pass: w => w >= 50,
  },
  {
    icon: "🎂", title: "Age",
    rule: "18 – 60 years",
    why: "Younger blood is healthier; older donors need medical clearance.",
    pass: a => a >= 18 && a <= 60,
  },
  {
    icon: "💉", title: "Hemoglobin",
    rule: "Men ≥ 13.5 g/dL · Women ≥ 12.5 g/dL",
    why: "Low hemoglobin means anemia — donating would worsen it.",
  },
  {
    icon: "❤️", title: "Blood Pressure",
    rule: "Systolic 100–180 · Diastolic 60–100 mmHg",
    why: "Too high or too low BP makes donation unsafe.",
  },
  {
    icon: "💓", title: "Pulse",
    rule: "60 – 100 beats per minute",
    why: "Irregular pulse must be checked by a doctor first.",
  },
  {
    icon: "🌡️", title: "Temperature",
    rule: "Below 37.5°C (99.5°F)",
    why: "Fever means active infection — wait until you recover.",
  },
  {
    icon: "🤒", title: "Recent Illness",
    rule: "No cold, flu, or infection in last 7 days",
    why: "Viruses can be transmitted through blood.",
  },
  {
    icon: "🩹", title: "Tattoo / Piercing",
    rule: "Wait 6 months after getting one",
    why: "Risk of hepatitis B/C transmission via unsterilized needles.",
  },
  {
    icon: "💊", title: "Medications",
    rule: "No blood thinners (aspirin, warfarin) in last 3 days",
    why: "Affects blood clotting and donation safety.",
  },
  {
    icon: "🍺", title: "Alcohol",
    rule: "No alcohol in last 24 hours",
    why: "Alcohol thins the blood and can cause dehydration.",
  },
  {
    icon: "😴", title: "Sleep",
    rule: "At least 6 hours of sleep the night before",
    why: "Fatigue increases risk of fainting during donation.",
  },
  {
    icon: "🍽️", title: "Food",
    rule: "Eat a light meal 2–3 hours before donating",
    why: "Empty stomach increases risk of low blood sugar and fainting.",
  },
];

const INTERVALS = [
  { type: "Whole Blood",  days: 90,  emoji: "🩸", color: "#dc2626" },
  { type: "Plasma",       days: 14,  emoji: "💛", color: "#d97706" },
  { type: "Platelets",    days: 7,   emoji: "🟡", color: "#ca8a04" },
  { type: "Double Red",   days: 112, emoji: "🔴", color: "#991b1b" },
  { type: "Bone Marrow",  days: null,emoji: "🦴", color: "#059669" },
];

const FACTS = [
  { emoji: "🌍", text: "Every 2 seconds, someone in Bangladesh needs blood." },
  { emoji: "🩸", text: "One donation can save up to 3 lives." },
  { emoji: "📉", text: "Blood cannot be manufactured — it can only come from donors." },
  { emoji: "💧", text: "Your body replaces donated red cells in 4–6 weeks." },
  { emoji: "⏱️", text: "The whole donation process takes about 45 minutes." },
  { emoji: "❄️", text: "Donated blood must be used within 42 days." },
];

// ── Component ─────────────────────────────────────────────────────────────────

// ── Organ pledge data ─────────────────────────────────────────────────────────

const ORGAN_DEFS = [
  { id: "corneas",       emoji: "👁️",  label: "Corneas (Eyes)",    note: "Restores sight — no blood type match needed",     living: false },
  { id: "kidneys",       emoji: "🫘",  label: "Kidneys",            note: "Living donors can give one kidney",               living: true  },
  { id: "heart",         emoji: "🫀",  label: "Heart",              note: "ABO compatible, donated after brain death",       living: false },
  { id: "lungs",         emoji: "🫁",  label: "Lungs",              note: "ABO compatible, transplanted within 6 hours",     living: false },
  { id: "liver",         emoji: "🩺",  label: "Liver",              note: "Living donors can donate a portion (regenerates)",living: true  },
  { id: "pancreas",      emoji: "🔬",  label: "Pancreas",           note: "Helps patients with type 1 diabetes",             living: false },
  { id: "skin",          emoji: "🧬",  label: "Skin & Tissue",      note: "Vital for burn victims",                          living: false },
  { id: "bone_marrow",   emoji: "🦴",  label: "Bone & Marrow",      note: "Living donors — marrow regenerates in weeks",     living: true  },
  { id: "blood_vessels", emoji: "🩸",  label: "Blood Vessels",      note: "Used in bypass surgery",                          living: false },
  { id: "intestines",    emoji: "💚",  label: "Intestines",         note: "For patients with intestinal failure",             living: false },
];

function printOrganCert(user, organs, pledgeDate) {
  const certNo  = `ODP-${user.user_code}`;
  const dateStr = pledgeDate
    ? new Date(pledgeDate).toLocaleDateString("en-BD", { day:"numeric", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("en-BD", { day:"numeric", month:"long", year:"numeric" });

  const byId = Object.fromEntries(ORGAN_DEFS.map(o => [o.id, o]));
  const organPills = organs.map(id => {
    const o = byId[id] || { emoji: "🩺", label: id };
    return `<span style="display:inline-flex;align-items:center;gap:5px;background:#f3e8ff;
      border:1px solid #c4b5fd;border-radius:20px;padding:5px 13px;font-size:13px;
      font-weight:600;color:#4c1d95;margin:4px;">${o.emoji} ${o.label}</span>`;
  }).join("");

  const win = window.open("", "_blank", "width=820,height=1060");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Organ Donation Pledge Certificate</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Georgia,serif;background:#f5f3ff;display:flex;justify-content:center;padding:32px;}
  .cert{width:700px;background:#fff;border-radius:16px;overflow:hidden;
        border:3px solid #7c3aed;box-shadow:0 8px 40px rgba(124,58,237,.18);}
  .hdr{background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:32px;text-align:center;color:#fff;}
  .hdr-logo{font-size:2.4rem;margin-bottom:8px;}
  .hdr h1{font-size:1.5rem;font-weight:900;letter-spacing:.04em;margin-bottom:4px;}
  .hdr p{font-size:.85rem;color:#ddd6fe;}
  .body{padding:36px 40px;}
  .cert-title{text-align:center;font-size:1.2rem;font-weight:800;color:#4c1d95;
    letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;}
  .cert-sub{text-align:center;font-size:.9rem;color:#6b7280;font-style:italic;margin-bottom:18px;}
  .cert-name{text-align:center;font-size:2.1rem;font-weight:900;color:#1a1a2e;
    border-bottom:2px solid #7c3aed;padding-bottom:12px;margin-bottom:14px;}
  .cert-desc{text-align:center;font-size:.97rem;color:#374151;line-height:1.7;margin-bottom:20px;}
  .organs{text-align:center;margin-bottom:24px;}
  .office-box{background:#fffbeb;border:2px solid #f59e0b;border-radius:10px;
    padding:16px 20px;margin-bottom:22px;font-size:.82rem;line-height:1.7;}
  .office-box strong{display:block;font-size:.85rem;color:#92400e;text-transform:uppercase;
    letter-spacing:.06em;margin-bottom:6px;}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-end;
    border-top:1px solid #e9d5f5;padding-top:18px;margin-top:8px;}
  .footer-meta{font-size:.78rem;color:#6b7280;line-height:1.8;}
  .sig-block{text-align:right;}
  .sig-svg{display:block;margin-bottom:4px;}
  .sig-name{font-size:.82rem;font-weight:700;color:#4c1d95;}
  .sig-title{font-size:.75rem;color:#6b7280;}
  @media print{body{background:white;padding:0;}
    .cert{box-shadow:none;border-color:#7c3aed;}}
</style></head><body>
<div class="cert">
  <div class="hdr">
    <div class="hdr-logo">🎗️</div>
    <h1>SaveLife Foundation</h1>
    <p>Organ Donation Programme · Bangladesh</p>
  </div>
  <div class="body">
    <div class="cert-title">Organ Donation Pledge Certificate</div>
    <div class="cert-sub">This is to certify that</div>
    <div class="cert-name">${user.name.toUpperCase()}</div>
    <div class="cert-desc">
      has solemnly pledged to donate the following organs for medical purposes
      after death (and where applicable, as a living donor), subject to family
      consent and the Human Organ Transplantation Act, 1999 of Bangladesh.
    </div>
    <div class="organs">${organPills}</div>
    <div class="office-box">
      <strong>⚠️ Important — Office Visit Required</strong>
      To make this pledge <strong>legally binding</strong> and receive your official
      <strong>Organ Donor Card</strong>, please visit us in person:<br><br>
      <strong>SaveLife Foundation</strong> &nbsp;·&nbsp; House 23, Road 11, Block C, Banani, Dhaka — 1213<br>
      📞 +880 2-55048123 &nbsp;·&nbsp; organ.pledge@savelife.org &nbsp;·&nbsp; Sun–Thu, 9AM–5PM<br><br>
      <strong>Bring:</strong> NID card (original + copy) · 2 passport photos · this certificate (printed) · family member's signature
    </div>
    <div class="footer-row">
      <div class="footer-meta">
        Issued: ${dateStr}<br>
        Certificate No.: <strong>${certNo}</strong><br>
        Governed by: Human Organ Transplantation Act 1999 (Amended 2018)
      </div>
      <div class="sig-block">
        <svg class="sig-svg" viewBox="0 0 180 44" width="160" height="40" xmlns="http://www.w3.org/2000/svg">
          <path d="M8,36 C28,6 46,40 64,22 S90,4 112,26 S138,38 172,14"
                fill="none" stroke="#4c1d95" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="sig-name">Director, SaveLife Foundation</div>
        <div class="sig-title">Organ Donation Programme</div>
      </div>
    </div>
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ── Organ pledge form ─────────────────────────────────────────────────────────

function OrganPledgeSection({ user, onPledged }) {
  const [selected, setSelected]   = useState([]);
  const [agreed, setAgreed]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  function selectAll() { setSelected(ORGAN_DEFS.map(o => o.id)); }

  async function submit() {
    if (selected.length === 0) return setError("Please select at least one organ.");
    if (!agreed) return setError("Please confirm that you understand and agree.");
    setError(""); setBusy(true);
    try {
      const { user: updated } = await api.organPledge(selected);
      onPledged(updated, selected, updated.organ_pledge_date);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="op-form-wrap">
      <div className="op-form-header">
        <div className="op-form-icon">🎗️</div>
        <h2>Pledge Your Organs</h2>
        <p>Select the organs you wish to donate. You may update this later by visiting our office.</p>
      </div>

      <div className="op-quick-row">
        <button className="op-select-all" onClick={selectAll}>✓ Select All Organs</button>
        <span className="op-selected-count">{selected.length} of {ORGAN_DEFS.length} selected</span>
      </div>

      <div className="op-organ-checks">
        {ORGAN_DEFS.map(o => (
          <label key={o.id} className={`op-check-card${selected.includes(o.id) ? " op-checked" : ""}`}>
            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
            <div className="op-check-emoji">{o.emoji}</div>
            <div className="op-check-body">
              <div className="op-check-label">{o.label}</div>
              <div className="op-check-note">{o.note}</div>
              {o.living && <span className="op-living-badge">Living donor possible</span>}
            </div>
            <div className="op-check-mark">{selected.includes(o.id) ? "✓" : ""}</div>
          </label>
        ))}
      </div>

      <div className="op-legal-box">
        <label className="op-agree-row">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <span>
            I understand that this digital pledge is the <strong>first step</strong> only.
            I must visit the SaveLife Foundation office at <strong>Banani, Dhaka</strong> with my NID
            card and family consent to make this pledge legally binding under the
            Human Organ Transplantation Act, 1999.
          </span>
        </label>
      </div>

      {error && <div className="op-error">{error}</div>}

      <button className="op-submit-btn" onClick={submit} disabled={busy || selected.length === 0 || !agreed}>
        {busy ? "Submitting…" : `🎗️ Submit Pledge (${selected.length} organ${selected.length !== 1 ? "s" : ""})`}
      </button>

      <p className="op-email-note">
        A confirmation email with your pledge certificate and next steps will be sent to <strong>{user.email}</strong>.
      </p>
    </div>
  );
}

// ── Organ pledge certificate (in-page view) ───────────────────────────────────

function OrganPledgeCertView({ user, organs, pledgeDate, onPrint }) {
  const certNo  = `ODP-${user.user_code}`;
  const dateStr = pledgeDate
    ? new Date(pledgeDate).toLocaleDateString("en-BD", { day:"numeric", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("en-BD", { day:"numeric", month:"long", year:"numeric" });
  const byId = Object.fromEntries(ORGAN_DEFS.map(o => [o.id, o]));

  return (
    <div className="op-cert-wrap">
      <div className="op-cert">
        <div className="op-cert-hdr">
          <div className="op-cert-hdr-logo">🎗️</div>
          <div className="op-cert-hdr-title">SaveLife Foundation</div>
          <div className="op-cert-hdr-sub">Organ Donation Programme · Bangladesh</div>
        </div>
        <div className="op-cert-body">
          <div className="op-cert-heading">Organ Donation Pledge Certificate</div>
          <div className="op-cert-sub">This is to certify that</div>
          <div className="op-cert-name">{user.name.toUpperCase()}</div>
          <div className="op-cert-divider" />
          <p className="op-cert-desc">
            has solemnly pledged to donate the following organs for medical purposes after death
            (and where applicable, as a living donor), subject to family consent and the
            Human Organ Transplantation Act, 1999 of Bangladesh.
          </p>
          <div className="op-cert-organs">
            {organs.map(id => {
              const o = byId[id] || { emoji: "🩺", label: id };
              return <span key={id} className="op-cert-organ-pill">{o.emoji} {o.label}</span>;
            })}
          </div>
          <div className="op-cert-office">
            <div className="op-cert-office-title">⚠️ Important — Office Visit Required</div>
            <p>
              This digital pledge is your <strong>first step</strong>. To receive your official
              <strong> Organ Donor Card</strong> and make this legally binding, visit us in person:
            </p>
            <address>
              <strong>SaveLife Foundation</strong><br />
              House 23, Road 11, Block C, Banani, Dhaka — 1213<br />
              📞 +880 2-55048123 · Sun–Thu, 9AM–5PM
            </address>
            <p className="op-office-bring">
              <strong>Bring:</strong> NID card · 2 passport photos · this certificate · family member's signature
            </p>
          </div>
          <div className="op-cert-footer">
            <div className="op-cert-meta">
              <div>Issued: <strong>{dateStr}</strong></div>
              <div>Cert No.: <strong>{certNo}</strong></div>
              <div className="op-cert-law">Human Organ Transplantation Act, 1999 (Amended 2018)</div>
            </div>
            <div className="op-cert-sig">
              <svg viewBox="0 0 180 44" className="op-sig-svg" xmlns="http://www.w3.org/2000/svg">
                <path d="M8,36 C28,6 46,40 64,22 S90,4 112,26 S138,38 172,14"
                  fill="none" stroke="#4c1d95" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="op-sig-name">Director, SaveLife Foundation</div>
              <div className="op-sig-title">Organ Donation Programme</div>
            </div>
          </div>
        </div>
      </div>
      <button className="op-print-btn" onClick={onPrint}>🖨️ Print / Save as PDF</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BloodGuide({ user, onBack, onUserUpdate }) {
  const [tab, setTab]           = useState("blood");
  const [selected, setSelected] = useState(user?.blood_type || null);
  const [view, setView]         = useState("donate");
  const [pledged, setPledged]   = useState(user?.organ_pledge || false);
  const [pledgeOrgans, setPledgeOrgans] = useState(user?.organs_pledged || []);
  const [pledgeDate, setPledgeDate]     = useState(user?.organ_pledge_date || null);

  function handlePledged(updatedUser, organs, date) {
    setPledged(true);
    setPledgeOrgans(organs);
    setPledgeDate(date);
    if (onUserUpdate) onUserUpdate(updatedUser);
  }

  const info   = selected ? COMPAT[selected] : null;
  const special = selected ? SPECIAL[selected] : null;

  return (
    <div className="bgg-page">
      {/* ── Nav ── */}
      <header className="bgg-nav">
        <a className="bgg-brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
        <div className="bgg-nav-right">
          <ThemeToggle />
          <button className="bgg-back" onClick={onBack}>← Back</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bgg-hero">
        <div className="bgg-hero-drop">
          <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" className="bgg-drop-svg">
            <defs>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>
            <path d="M50 8 C50 8 8 65 8 88 A42 42 0 0 0 92 88 C92 65 50 8 50 8Z"
              fill="url(#dropGrad)" opacity="0.95" />
            <ellipse cx="38" cy="72" rx="8" ry="13" fill="rgba(255,255,255,0.18)" transform="rotate(-20,38,72)" />
          </svg>
        </div>
        <h1 className="bgg-hero-title">Blood &amp; Organ Guide</h1>
        <p className="bgg-hero-sub">
          Know your blood type. Understand who you can save. Learn before you donate.
        </p>
        <div className="bgg-fact-strip">
          {FACTS.map((f, i) => (
            <div className="bgg-fact" key={i}><span>{f.emoji}</span> {f.text}</div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bgg-tabs">
        <button className={`bgg-tab${tab === "blood" ? " bgg-tab-on" : ""}`} onClick={() => setTab("blood")}>
          🩸 Blood Compatibility
        </button>
        <button className={`bgg-tab${tab === "organ" ? " bgg-tab-on" : ""}`} onClick={() => setTab("organ")}>
          🫀 Organ Donation
        </button>
        <button className={`bgg-tab${tab === "tests" ? " bgg-tab-on" : ""}`} onClick={() => setTab("tests")}>
          ✅ Before You Donate
        </button>
      </div>

      {/* ══ BLOOD COMPATIBILITY ══════════════════════════════════════════════ */}
      {tab === "blood" && (
        <div className="bgg-section">

          {/* Blood type selector */}
          <div className="bgg-picker-label">Select your blood type to see compatibility</div>
          <div className="bgg-type-picker">
            {BLOOD_TYPES.map(t => (
              <button
                key={t}
                className={`bgg-type-btn${selected === t ? " bgg-type-on" : ""}`}
                style={{ "--tc": TYPE_COLOR[t] }}
                onClick={() => setSelected(selected === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Special card when selected */}
          {special && (
            <div className="bgg-special-card" style={{ "--sc": special.color }}>
              <div className="bgg-special-badge" style={{ background: special.color }}>
                {selected}
              </div>
              <div>
                <div className="bgg-special-title" style={{ color: special.color }}>{special.title}</div>
                <div className="bgg-special-desc">{special.desc}</div>
              </div>
            </div>
          )}

          {/* Toggle donate vs receive */}
          {info && (
            <>
              <div className="bgg-view-toggle">
                <button
                  className={view === "donate" ? "bgg-vt-on" : ""}
                  onClick={() => setView("donate")}
                >
                  🩸 I can DONATE to
                </button>
                <button
                  className={view === "receive" ? "bgg-vt-on" : ""}
                  onClick={() => setView("receive")}
                >
                  💉 I can RECEIVE from
                </button>
              </div>

              <div className="bgg-compat-grid">
                {BLOOD_TYPES.map(t => {
                  const active = view === "donate"
                    ? info.to.includes(t)
                    : info.from.includes(t);
                  return (
                    <div key={t} className={`bgg-compat-card ${active ? "bgg-compat-yes" : "bgg-compat-no"}`}
                      style={{ "--tc": TYPE_COLOR[t] }}>
                      <div className="bgg-compat-drop">
                        {active ? (
                          <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 8 C50 8 8 65 8 88 A42 42 0 0 0 92 88 C92 65 50 8 50 8Z"
                              fill={TYPE_COLOR[t]} />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 8 C50 8 8 65 8 88 A42 42 0 0 0 92 88 C92 65 50 8 50 8Z"
                              fill="none" stroke="var(--muted)" strokeWidth="4" />
                          </svg>
                        )}
                      </div>
                      <div className="bgg-compat-type" style={{ color: active ? TYPE_COLOR[t] : "var(--muted)" }}>
                        {t}
                      </div>
                      <div className="bgg-compat-status">{active ? "✅" : "❌"}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bgg-compat-summary">
                {view === "donate"
                  ? `${selected} can donate to ${info.to.length} of 8 blood types (${Math.round(info.to.length/8*100)}% of patients).`
                  : `${selected} can receive from ${info.from.length} of 8 blood types.`}
              </div>
            </>
          )}

          {!selected && (
            <p className="bgg-picker-hint">← Select a blood type above to see who you can help</p>
          )}

          {/* Full compatibility matrix */}
          <div className="bgg-matrix-wrap">
            <div className="bgg-matrix-title">Full Compatibility Matrix</div>
            <p className="bgg-matrix-sub">Row = Donor · Column = Recipient · ✅ = Compatible</p>
            <div className="bgg-matrix">
              <div className="bgg-matrix-corner"></div>
              {BLOOD_TYPES.map(t => (
                <div key={t} className="bgg-mh" style={{ color: TYPE_COLOR[t] }}>{t}</div>
              ))}
              {BLOOD_TYPES.map(donor => (
                <>
                  <div key={`r-${donor}`} className="bgg-mrow" style={{ color: TYPE_COLOR[donor] }}>{donor}</div>
                  {BLOOD_TYPES.map(recip => {
                    const ok = COMPAT[donor].to.includes(recip);
                    const isSelected = donor === selected || recip === selected;
                    return (
                      <div key={`${donor}-${recip}`}
                        className={`bgg-mcell ${ok ? "bgg-m-yes" : "bgg-m-no"}${isSelected ? " bgg-m-hl" : ""}`}>
                        {ok ? "✓" : "✗"}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Donation intervals */}
          <div className="bgg-intervals">
            <div className="bgg-intervals-title">How Often Can You Donate?</div>
            <div className="bgg-interval-list">
              {INTERVALS.map(iv => (
                <div className="bgg-interval-card" key={iv.type} style={{ "--ic": iv.color }}>
                  <div className="bgg-iv-emoji">{iv.emoji}</div>
                  <div className="bgg-iv-type">{iv.type}</div>
                  <div className="bgg-iv-days" style={{ color: iv.color }}>
                    {iv.days ? `Every ${iv.days} days` : "Once (regenerates)"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ ORGAN DONATION ═══════════════════════════════════════════════════ */}
      {tab === "organ" && (
        <div className="bgg-section">
          <div className="bgg-organ-hero">
            <div className="bgg-organ-icons">🫀 🫁 🫘 👁️ 🦴 🩸</div>
            <h2>One Body. Eight Gifts.</h2>
            <p>A single organ donor can save or improve the lives of up to 8 people.
              After death, your organs can live on in others.</p>
          </div>

          <div className="bgg-organ-grid">
            {ORGANS.map(o => (
              <div className="bgg-organ-card" key={o.name} style={{ "--oc": o.color }}>
                <div className="bgg-organ-emoji">{o.emoji}</div>
                <div className="bgg-organ-name">{o.name}</div>
                <div className="bgg-organ-rows">
                  <div className="bgg-organ-row">
                    <span className="bgg-or-label">Blood match</span>
                    <span>{o.match}</span>
                  </div>
                  <div className="bgg-organ-row">
                    <span className="bgg-or-label">Interval</span>
                    <span>{o.interval}</span>
                  </div>
                  <div className="bgg-organ-row">
                    <span className="bgg-or-label">Saves</span>
                    <span style={{ color: o.color, fontWeight: 700 }}>{o.saves}</span>
                  </div>
                </div>
                <div className="bgg-organ-note">{o.note}</div>
              </div>
            ))}
          </div>

          {/* ── Pledge section (dynamic) ── */}
          {!user ? (
            <div className="op-login-prompt">
              <div className="op-lp-icon">🎗️</div>
              <h3>Pledge Your Organs — Save Up to 8 Lives</h3>
              <p>Log in to your SaveLife account to make your organ donation pledge and receive a digital certificate.</p>
              <div className="op-lp-steps">
                <div className="op-lp-step"><span>1</span> Log in or create a free account</div>
                <div className="op-lp-step"><span>2</span> Select which organs you wish to donate</div>
                <div className="op-lp-step"><span>3</span> Receive your pledge certificate by email</div>
                <div className="op-lp-step"><span>4</span> Visit our Banani, Dhaka office to make it legal</div>
              </div>
            </div>
          ) : pledged ? (
            <OrganPledgeCertView
              user={user}
              organs={pledgeOrgans}
              pledgeDate={pledgeDate}
              onPrint={() => printOrganCert(user, pledgeOrgans, pledgeDate)}
            />
          ) : (
            <OrganPledgeSection user={user} onPledged={handlePledged} />
          )}

          {/* ABO for organs explainer */}
          <div className="bgg-organ-abo">
            <div className="bgg-organ-abo-title">ABO Compatibility for Organs</div>
            <div className="bgg-abo-table">
              {[
                { donor: "O",  recip: "O, A, B, AB", note: "O organs are in highest demand" },
                { donor: "A",  recip: "A, AB",        note: "Common — 28% of people are A+" },
                { donor: "B",  recip: "B, AB",        note: "Common in South Asia" },
                { donor: "AB", recip: "AB only",      note: "Rarest — but AB+ can receive all" },
              ].map(r => (
                <div className="bgg-abo-row" key={r.donor}>
                  <div className="bgg-abo-donor" style={{ background: TYPE_COLOR[r.donor+"+"] || "#dc2626" }}>
                    {r.donor} Donor
                  </div>
                  <div className="bgg-abo-arrow">→</div>
                  <div className="bgg-abo-recip">{r.recip}</div>
                  <div className="bgg-abo-note">{r.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ BEFORE YOU DONATE ════════════════════════════════════════════════ */}
      {tab === "tests" && (
        <div className="bgg-section">
          <div className="bgg-tests-hero">
            <div style={{ fontSize: "3.5rem" }}>📋</div>
            <h2>Before You Donate Blood</h2>
            <p>Meet all these requirements and you're ready to save lives today.</p>
          </div>

          <div className="bgg-checklist">
            {TESTS.map((t, i) => (
              <div className="bgg-check-item" key={i}>
                <div className="bgg-check-icon">{t.icon}</div>
                <div className="bgg-check-body">
                  <div className="bgg-check-title">{t.title}</div>
                  <div className="bgg-check-rule">{t.rule}</div>
                  <div className="bgg-check-why">{t.why}</div>
                </div>
                <div className="bgg-check-mark">✓</div>
              </div>
            ))}
          </div>

          {/* What to expect */}
          <div className="bgg-expect-box">
            <div className="bgg-expect-title">What Happens at the Donation Center?</div>
            <div className="bgg-expect-steps">
              {[
                { n:"01", icon:"📝", title:"Registration",      desc:"Fill a short health questionnaire. Takes 5 minutes." },
                { n:"02", icon:"🩺", title:"Mini Health Check",  desc:"Doctor checks your BP, pulse, Hb, weight, temperature." },
                { n:"03", icon:"🛋️", title:"Get Comfortable",    desc:"Lie on a donation chair. The arm is cleaned and sterilized." },
                { n:"04", icon:"💉", title:"Blood Draw",         desc:"450 ml collected in 8–10 minutes. You may feel a small pinch." },
                { n:"05", icon:"🧃", title:"Rest & Refresh",     desc:"15 minutes of rest + juice/biscuits. Staff monitor you." },
                { n:"06", icon:"🏠", title:"Go Home a Hero",     desc:"Avoid heavy lifting for 24 hours. Drink extra fluids." },
              ].map(s => (
                <div className="bgg-expect-step" key={s.n}>
                  <div className="bgg-es-icon">{s.icon}</div>
                  <div className="bgg-es-body">
                    <div className="bgg-es-title">{s.title}</div>
                    <div className="bgg-es-desc">{s.desc}</div>
                  </div>
                  <div className="bgg-es-num">{s.n}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery timeline */}
          <div className="bgg-recovery">
            <div className="bgg-recovery-title">Your Body's Recovery Timeline</div>
            <div className="bgg-timeline">
              {[
                { time:"24 hrs",   color:"#22c55e", text:"Blood volume fully restored. Stay hydrated." },
                { time:"1 week",   color:"#16a34a", text:"Platelets replenished. You're back to 100% function." },
                { time:"4–6 wks",  color:"#0ea5e9", text:"Red blood cells fully restored." },
                { time:"90 days",  color:"#dc2626", text:"You can donate whole blood again!" },
              ].map(t => (
                <div className="bgg-tl-item" key={t.time}>
                  <div className="bgg-tl-dot" style={{ background: t.color }}></div>
                  <div className="bgg-tl-time" style={{ color: t.color }}>{t.time}</div>
                  <div className="bgg-tl-text">{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Blood banks */}
          <div className="bgg-banks-box">
            <div className="bgg-banks-title">🏥 Where to Donate in Bangladesh</div>
            <div className="bgg-banks-grid">
              {[
                { name:"Dhaka Medical College & Hospital",    phone:"02-55165088", city:"Dhaka" },
                { name:"Bangladesh Institute of Research and Rehabilitation in Diabetes", phone:"02-8616641", city:"Dhaka" },
                { name:"Sandhani National Heart Foundation",  phone:"02-58810464", city:"Dhaka" },
                { name:"BSMMU Blood Transfusion Dept.",       phone:"02-9661054",  city:"Dhaka" },
                { name:"Chittagong Medical College Hospital", phone:"031-630500",  city:"Chittagong" },
                { name:"Rajshahi Medical College Hospital",   phone:"0721-772150", city:"Rajshahi" },
                { name:"Sylhet MAG Osmani Medical College",   phone:"0821-714600", city:"Sylhet" },
                { name:"Khulna Medical College Hospital",     phone:"041-761900",  city:"Khulna" },
              ].map(b => (
                <div className="bgg-bank-card" key={b.name}>
                  <div className="bgg-bank-city">{b.city}</div>
                  <div className="bgg-bank-name">{b.name}</div>
                  <a href={`tel:${b.phone}`} className="bgg-bank-phone">📞 {b.phone}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
