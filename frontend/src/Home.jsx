import { useState } from "react";
import "./Home.css";

const HOTLINE = { display: "16789", tel: "16789" };

const SERVICES = [
  {
    icon: "🩸",
    title: "Blood Requests",
    text: "Post or browse urgent blood requests. Filter by blood type, urgency, and distance to find a match in minutes.",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.15)",
  },
  {
    icon: "👨‍⚕️",
    title: "Find Doctors",
    text: "Browse 50+ verified specialists — cardiologists, neurologists, surgeons and more. Book appointments and get a PDF confirmation slip.",
    color: "#14b8a6",
    glow: "rgba(20,184,166,0.15)",
  },
  {
    icon: "🏥",
    title: "Hospital Booking",
    text: "Book beds at public and private hospitals. Choose ward type, manage documents, and pay the 50% advance directly on the platform.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.15)",
  },
  {
    icon: "🚑",
    title: "Emergency Ambulance",
    text: "Call verified ambulance services across Bangladesh instantly. One-tap emergency dial and GPS-based nearest service finder.",
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
  },
  {
    icon: "🫀",
    title: "Organ Donation",
    text: "Learn about organ pledging, register as a pledger, and understand how to save up to 8 lives with a single decision.",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
  },
  {
    icon: "📋",
    title: "PDF Receipts & Slips",
    text: "Every booking and appointment generates a professional PDF slip — hospital receipts, appointment confirmations, instantly downloadable.",
    color: "#eab308",
    glow: "rgba(234,179,8,0.15)",
  },
];

const STEPS = [
  { n: "01", title: "Create your profile", text: "Sign up with your blood type and medical details. Takes under 2 minutes." },
  { n: "02", title: "Explore the platform", text: "Browse blood requests, find doctors, book hospitals, or call an ambulance — all in one place." },
  { n: "03", title: "Book or respond", text: "Accept a blood request to donate, or book an appointment / hospital bed instantly." },
  { n: "04", title: "Save a life", text: "Get matched, connect safely, and make a difference. A PDF confirmation is generated automatically." },
];

const STATS = [
  { value: "50+", label: "Verified Doctors" },
  { value: "20+", label: "Partner Hospitals" },
  { value: "24/7", label: "Always Available" },
  { value: "100%", label: "Free to Use" },
];

const POLICIES = [
  {
    title: "Privacy & Data Protection",
    text: "Your medical and contact details are encrypted and never sold. Donor profiles are gated behind authentication — your data is yours.",
  },
  {
    title: "Medical Disclaimer",
    text: "SaveLife is a matching and booking platform, not a medical provider. All donations and treatments must follow proper medical screening by licensed professionals.",
  },
  {
    title: "Eligibility",
    text: "Blood donors must meet the legal age and health requirements. False medical information violates our terms and leads to account removal.",
  },
  {
    title: "Code of Conduct",
    text: "No buying or selling of organs, blood, or plasma. SaveLife is strictly for voluntary, non-commercial purposes. Violations lead to a permanent ban.",
  },
];

export default function Home({ onGetStarted }) {
  return (
    <div className="home">
      {/* Navbar */}
      <header className="nav">
        <a className="brand" href="#top">🩺 <span>SaveLife</span></a>
        <nav className="nav-links">
          <a href="#services">Services</a>
          <a href="#how">How it works</a>
          <a href="#quickstart">Get Started</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="hotline" href={`tel:${HOTLINE.tel}`}>
          <span className="hotline-icon">📞</span>
          <span className="hotline-text">
            <small>Emergency · 24/7</small>
            <strong>{HOTLINE.display}</strong>
          </span>
        </a>
        <button className="btn btn-primary" onClick={onGetStarted}>Log in / Sign up</button>
      </header>

      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-inner">
          <span className="pill">Bangladesh's all-in-one health platform</span>
          <h1 className="tagline">
            When seconds matter,<br />
            <span className="accent">SaveLife delivers.</span>
          </h1>
          <p className="subtitle">
            Connect with blood donors, book specialist doctors, find hospital beds, and
            reach emergency ambulances — all verified, all instant, all in one place.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Get Started — it's free</button>
            <a className="btn btn-outline btn-lg" href="#services">Explore services</a>
          </div>
          <div className="hero-stats">
            {STATS.map(s => (
              <div className="hero-stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating feature pills */}
        <div className="hero-pills">
          <span className="hpill hpill-red">🩸 Blood</span>
          <span className="hpill hpill-teal">👨‍⚕️ Doctors</span>
          <span className="hpill hpill-purple">🏥 Hospitals</span>
          <span className="hpill hpill-orange">🚑 Ambulance</span>
        </div>
      </section>

      {/* Services */}
      <section className="section" id="services">
        <div className="section-head">
          <h2>Everything you need, in one platform</h2>
          <p>From emergency blood requests to specialist appointments — SaveLife covers every step of your healthcare journey.</p>
        </div>
        <div className="service-grid">
          {SERVICES.map(s => (
            <div className="service-card" key={s.title} style={{ "--sc-color": s.color, "--sc-glow": s.glow }}>
              <div className="sc-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section alt" id="how">
        <div className="section-head">
          <h2>How it works</h2>
          <p>From sign-up to saving a life in four simple steps.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={s.n}>
              <div className="step-connector" />
              <div className="step-n">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick start CTA */}
      <section className="section quickstart" id="quickstart">
        <div className="qs-box">
          <div className="qs-glow" />
          <span className="qs-tag">Ready to start?</span>
          <h2>Be set up in under 2 minutes</h2>
          <p>Create a free account and access every feature — blood requests, doctor bookings, hospital beds, and emergency services.</p>
          <div className="qs-steps">
            <div className="qs-step"><span>1</span>Create a free account</div>
            <div className="qs-arrow">→</div>
            <div className="qs-step"><span>2</span>Complete your profile</div>
            <div className="qs-arrow">→</div>
            <div className="qs-step"><span>3</span>Start helping</div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>Create your free account</button>
        </div>
      </section>

      {/* Terms */}
      <section className="section alt" id="terms">
        <div className="section-head">
          <h2>Terms &amp; Policy</h2>
          <p>The essentials. Full terms are available after sign-up.</p>
        </div>
        <div className="cards">
          {POLICIES.map(p => (
            <div className="card policy" key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="section contact" id="contact">
        <div className="section-head">
          <h2>Contact Us</h2>
          <p>Questions, partnerships, or urgent help — we're here around the clock.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <a className="contact-item" href={`tel:${HOTLINE.tel}`}>
              <span className="ci-icon">📞</span>
              <div>
                <strong>Emergency Hotline</strong>
                <p>{HOTLINE.display}</p>
                <small>Available 24/7</small>
              </div>
            </a>
            <a className="contact-item" href="mailto:support@savelife.org">
              <span className="ci-icon">✉️</span>
              <div>
                <strong>Email</strong>
                <p>support@savelife.org</p>
                <small>We reply within 24 hours</small>
              </div>
            </a>
            <div className="contact-item">
              <span className="ci-icon">📍</span>
              <div>
                <strong>Office</strong>
                <p>Dhaka, Bangladesh</p>
                <small>Mon–Sat, 9 am – 6 pm</small>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="brand">🩺 <span>SaveLife</span></div>
          <p className="footer-tag">Connecting people to the care they need, when they need it most.</p>
          <div className="footer-services">
            <span>🩸 Blood</span>
            <span>👨‍⚕️ Doctors</span>
            <span>🏥 Hospitals</span>
            <span>🚑 Ambulance</span>
            <span>🫀 Organ</span>
          </div>
          <nav className="footer-links">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#quickstart">Get Started</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </nav>
          <p className="copyright">© {new Date().getFullYear()} SaveLife · For voluntary, non-commercial donation only · Bangladesh</p>
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <h3>Send us a message</h3>
      <input placeholder="Your name" value={form.name} onChange={set("name")} required />
      <input type="email" placeholder="Your email" value={form.email} onChange={set("email")} required />
      <textarea placeholder="How can we help?" rows={4} value={form.message} onChange={set("message")} required />
      <button className="btn btn-primary" type="submit">Send message</button>
      {sent && <p className="contact-success">✓ Thanks! We'll get back to you soon.</p>}
    </form>
  );
}
