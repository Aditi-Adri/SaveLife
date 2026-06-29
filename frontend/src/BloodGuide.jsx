import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
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

export default function BloodGuide({ user, onBack }) {
  const [tab, setTab]         = useState("blood");
  const [selected, setSelected] = useState(user?.blood_type || null);
  const [view, setView]       = useState("donate"); // "donate" | "receive"

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

          {/* Pledge CTA */}
          <div className="bgg-pledge-box">
            <div className="bgg-pledge-icon">🎗️</div>
            <h3>Become an Organ Donor</h3>
            <p>
              In Bangladesh, organ donation is regulated by the Human Organ Transplantation Act (1999).
              You can register your intent with any government hospital or BSMMU (Shahbagh, Dhaka).
            </p>
            <div className="bgg-pledge-steps">
              <div className="bgg-ps"><span>1</span> Tell your family your wish — their consent is required.</div>
              <div className="bgg-ps"><span>2</span> Carry a donor card or note it on your NID/driving licence.</div>
              <div className="bgg-ps"><span>3</span> Register at BSMMU or any major public hospital.</div>
              <div className="bgg-ps"><span>4</span> Update your SaveLife profile — mark yourself as an organ pledger.</div>
            </div>
            <div className="bgg-pledge-contact">
              <strong>BSMMU Transplant Unit:</strong> 02-9661054 &nbsp;·&nbsp;
              <strong>Kidney Foundation:</strong> 02-9120464
            </div>
          </div>

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
