import "./OrganInfo.css";

const ORGANS = [
  { icon: "🫀", name: "Heart", text: "A single heart transplant can give a dying patient years of life." },
  { icon: "🫁", name: "Lungs", text: "One or both lungs can be donated to people with severe lung disease." },
  { icon: "🩸", name: "Kidneys", text: "The most needed organ — one donor can free two patients from dialysis." },
  { icon: "🧬", name: "Liver", text: "The liver can be split, helping two recipients from one donor." },
  { icon: "🍬", name: "Pancreas", text: "Restores insulin production for people with severe diabetes." },
  { icon: "👁️", name: "Corneas & tissue", text: "Corneas restore sight; skin, bone and heart valves heal many more." },
];

const MYTHS = [
  { myth: "Doctors won't try to save me if I'm a donor.", fact: "Medical teams work to save your life first. Donation is only considered after death is declared." },
  { myth: "I'm too old or unhealthy to donate.", fact: "There is no strict age limit. Medical suitability is assessed at the time of donation." },
  { myth: "My religion doesn't allow it.", fact: "Most major religions support organ donation as an act of charity and compassion." },
  { myth: "Rich people get priority on the list.", fact: "Matching is based on medical urgency, blood/tissue type and waiting time — not wealth or status." },
];

const STEPS = [
  { n: "1", title: "Learn", text: "Understand what organ donation is and the lives it saves." },
  { n: "2", title: "Decide & register", text: "Create a SaveLife account and record your pledge." },
  { n: "3", title: "Tell your family", text: "Share your decision so your wishes are known and honoured." },
];

export default function OrganInfo({ onBack, onAuth }) {
  return (
    <div className="organ">
      <header className="og-nav">
        <a className="brand" onClick={onBack} role="button">
          🩺 <span>SaveLife</span>
        </a>
        <button className="btn btn-outline" onClick={onBack}>← Back to Explore</button>
      </header>

      <section className="og-hero">
        <span className="og-pill">🫀 Organ Donation Awareness</span>
        <h1>One donor can save up to <span className="accent">8 lives</span></h1>
        <p>
          Organ donation is the gift of giving an organ or tissue to someone who needs a
          transplant. This page is here to inform — read, learn, and share.
        </p>
      </section>

      <section className="og-section">
        <h2>What is organ donation?</h2>
        <p className="og-lead">
          Organ donation is the process of surgically removing an organ or tissue from one
          person (the donor) and placing it into another person (the recipient). It can happen
          after death, or in some cases — like a kidney or part of a liver — from a living donor.
          Thousands of people wait for a transplant; many could be saved if more people pledged.
        </p>
      </section>

      <section className="og-section alt">
        <h2>What can be donated?</h2>
        <div className="og-grid">
          {ORGANS.map((o) => (
            <div className="og-card" key={o.name}>
              <div className="og-icon">{o.icon}</div>
              <h3>{o.name}</h3>
              <p>{o.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="og-section">
        <h2>Why it matters</h2>
        <div className="og-stats">
          <div><strong>8</strong><span>lives saved by one donor</span></div>
          <div><strong>75+</strong><span>lives improved through tissue</span></div>
          <div><strong>1</strong><span>new name added to waiting lists every few minutes</span></div>
        </div>
      </section>

      <section className="og-section alt">
        <h2>Myths vs. Facts</h2>
        <div className="og-myths">
          {MYTHS.map((m, i) => (
            <div className="myth-row" key={i}>
              <div className="myth"><span>✗ Myth</span><p>{m.myth}</p></div>
              <div className="fact"><span>✓ Fact</span><p>{m.fact}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="og-section">
        <h2>How to become a donor</h2>
        <div className="og-steps">
          {STEPS.map((s) => (
            <div className="og-step" key={s.n}>
              <div className="og-step-n">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="og-cta">
        <h2>Ready to give the gift of life?</h2>
        <p>Pledge to become an organ donor with SaveLife.</p>
        <div className="og-cta-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => onAuth("donate")}>
            Pledge to donate
          </button>
          <button className="btn btn-outline btn-lg" onClick={onBack}>
            Keep exploring
          </button>
        </div>
        <p className="og-disclaimer">
          This page is for awareness and information only. Always consult medical professionals
          and official transplant authorities for medical decisions.
        </p>
      </section>
    </div>
  );
}
