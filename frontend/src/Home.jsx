import { useState } from "react";
import "./Home.css";

// Change these to your real toll-free hotline.
const HOTLINE = { display: "1-800-SAVE-LIFE", tel: "+18007283543" };

const DONATION_TYPES = [
  {
    icon: "🩸",
    title: "Blood Donation",
    text: "Find compatible blood donors by type and location in minutes — for surgeries, accidents, and chronic patients.",
  },
  {
    icon: "🫀",
    title: "Organ Donation",
    text: "Register as an organ pledger and help match recipients with willing, compatible donors on the waiting list.",
  },
  {
    icon: "💧",
    title: "Plasma Donation",
    text: "Connect plasma donors with patients who need antibodies and clotting factors, including convalescent plasma.",
  },
  {
    icon: "🎯",
    title: "Smart Matching",
    text: "Our matching engine ranks donors by compatibility, distance, and availability to find the best person, fast.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create your profile",
    text: "Sign up and add your blood type, organ pledges, plasma eligibility and location.",
  },
  {
    n: "2",
    title: "Search or post a request",
    text: "Need a donor? Post a request. Want to help? Browse nearby people who need you.",
  },
  {
    n: "3",
    title: "Get matched",
    text: "We rank the best compatible donors by type, distance and availability and notify them.",
  },
  {
    n: "4",
    title: "Connect & save a life",
    text: "Coordinate safely through the platform and complete the donation. 💞",
  },
];

const POLICIES = [
  {
    title: "Privacy & Data Protection",
    text: "Your medical and contact details are encrypted and never sold. You control who can see your information and can delete your account anytime.",
  },
  {
    title: "Medical Consent & Disclaimer",
    text: "SaveLife is a matching platform, not a medical provider. All donations must follow proper medical screening and the guidance of licensed professionals.",
  },
  {
    title: "Eligibility",
    text: "Donors must meet legal age and health requirements for their donation type. False medical information violates these terms.",
  },
  {
    title: "Code of Conduct",
    text: "No buying or selling of organs, blood, or plasma. SaveLife is strictly for voluntary, non-commercial donation. Violations lead to a permanent ban.",
  },
];

export default function Home({ onGetStarted }) {
  return (
    <div className="home">
      {/* Navbar */}
      <header className="nav">
        <a className="brand" href="#top">
          🩺 <span>SaveLife</span>
        </a>
        <nav className="nav-links">
          <a href="#about">About</a>
          <a href="#how">How it works</a>
          <a href="#quickstart">Quick Start</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="hotline" href={`tel:${HOTLINE.tel}`} title="Toll-free hotline">
          <span className="hotline-icon">📞</span>
          <span className="hotline-text">
            <small>Toll-Free · 24/7</small>
            <strong>{HOTLINE.display}</strong>
          </span>
        </a>
        <button className="btn btn-primary" onClick={onGetStarted}>
          Log in / Sign up
        </button>
      </header>

      {/* Hero */}
      <section className="hero" id="top">
        <div className="hero-inner">
          <span className="pill">🩸 Blood · 🫀 Organ · 💧 Plasma</span>
          <h1 className="tagline">
            One platform.<br />
            <span className="accent">Countless lives saved.</span>
          </h1>
          <p className="subtitle">
            SaveLife connects blood, organ, and plasma donors with the patients
            who need them — verified, nearby, and matched to the best person in
            minutes.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
              Get Started
            </button>
            <a className="btn btn-outline btn-lg" href="#how">
              How it works
            </a>
          </div>
          <div className="stats">
            <div>
              <strong>10k+</strong>
              <span>Registered donors</span>
            </div>
            <div>
              <strong>3 types</strong>
              <span>Blood · Organ · Plasma</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Always available</span>
            </div>
          </div>
        </div>
      </section>

      {/* About / What it's about */}
      <section className="section" id="about">
        <div className="section-head">
          <h2>What is SaveLife?</h2>
          <p>
            A donation-matching platform that finds the right donor for the right
            person — across blood, organ, and plasma.
          </p>
        </div>
        <div className="cards">
          {DONATION_TYPES.map((d) => (
            <div className="card" key={d.title}>
              <div className="card-icon">{d.icon}</div>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
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
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step-n">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section className="section quickstart" id="quickstart">
        <div className="qs-box">
          <h2>Quick Start</h2>
          <p>Ready to help? You can be set up in under two minutes.</p>
          <ol className="qs-list">
            <li>Create a free account.</li>
            <li>Complete your medical profile (blood type, pledges, location).</li>
            <li>Search for people who need you, or post your own request.</li>
            <li>Get matched, get notified, and donate. 💞</li>
          </ol>
          <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
            Create your account
          </button>
        </div>
      </section>

      {/* Terms & Policy */}
      <section className="section alt" id="terms">
        <div className="section-head">
          <h2>Terms &amp; Policy</h2>
          <p>The essentials. Full terms are available after sign-up.</p>
        </div>
        <div className="cards">
          {POLICIES.map((p) => (
            <div className="card policy" key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Us */}
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
                <strong>Toll-Free Hotline</strong>
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
                <small>Mon–Sat, 9am–6pm</small>
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
          <p className="footer-tag">Connecting donors to those who need them most.</p>
          <nav className="footer-links">
            <a href="#about">About</a>
            <a href="#how">How it works</a>
            <a href="#quickstart">Quick Start</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </nav>
          <p className="copyright">
            © {new Date().getFullYear()} SaveLife. For voluntary, non-commercial donation only.
          </p>
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
    // No backend endpoint yet — show a confirmation. Wire this to an API later.
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <h3>Send us a message</h3>
      <input
        placeholder="Your name"
        value={form.name}
        onChange={set("name")}
        required
      />
      <input
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={set("email")}
        required
      />
      <textarea
        placeholder="How can we help?"
        rows={4}
        value={form.message}
        onChange={set("message")}
        required
      />
      <button className="btn btn-primary" type="submit">
        Send message
      </button>
      {sent && <p className="contact-success">✓ Thanks! We'll get back to you soon.</p>}
    </form>
  );
}
