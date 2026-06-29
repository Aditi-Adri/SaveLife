import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import "./HealthTips.css";

// ── Articles ──────────────────────────────────────────────────────────────────

export const ARTICLES = [
  {
    id: "when-donate-again",
    cat: "Donation Tips", catColor: "#dc2626",
    emoji: "📅", readTime: 3, featured: true,
    title: "When Can You Donate Blood Again?",
    excerpt: "Whole blood, plasma, platelets — each has a different waiting period. Here's exactly how long to wait and why.",
    sections: [
      {
        heading: "The Waiting Periods",
        body: "Your body needs time to recover after every donation. The waiting period depends on what you donated — not just a rule, but biology.",
        bullets: [
          "🩸 Whole blood — every 90 days (about 3 months)",
          "💛 Plasma — every 14 days",
          "🟡 Platelets — every 7 days (up to 24 times per year)",
          "🔴 Double red cells — every 112 days (16 weeks)",
          "🦴 Bone marrow — typically once in a lifetime",
        ],
      },
      {
        heading: "Why Can't You Donate More Often?",
        body: "Red blood cells contain haemoglobin, which carries iron. After donation, your body rebuilds red cells using iron from your diet. This process takes 4–6 weeks. Donating before the iron is replenished risks anaemia — low red cell count that causes fatigue, weakness, and dizziness. The 90-day rule gives you a full buffer beyond just the 4–6 weeks so your body is fully restored.",
      },
      {
        heading: "Plasma and Platelets Recover Faster",
        body: "Plasma is mostly water — it refills within 24–48 hours when you drink enough fluids. Platelets (the clotting cells) recover in 7–10 days. That's why regular plasma and platelet donors can give much more frequently than whole blood donors.",
      },
      {
        heading: "How to Track Your Next Eligible Date",
        body: "Write the donation date on your calendar and count forward. Most donation centres give you a receipt card with your next eligible date printed on it. SaveLife will remind you automatically when you log your donation in your profile.",
      },
      {
        heading: "Pro Tip",
        tip: "Set a recurring alarm 3 months after each whole blood donation. Regular donors save more lives — consistency matters more than frequency.",
      },
    ],
  },
  {
    id: "what-to-eat",
    cat: "Nutrition", catColor: "#22c55e",
    emoji: "🥗", readTime: 4, featured: true,
    title: "What to Eat Before Donating Blood",
    excerpt: "The right meal before donation reduces dizziness, boosts haemoglobin, and makes the process faster. Here's your pre-donation meal plan.",
    sections: [
      {
        heading: "The Night Before",
        body: "Eat an iron-rich dinner. Iron is the key nutrient your body needs to maintain haemoglobin levels. A low haemoglobin reading at the donation centre will get you deferred — sent home without donating.",
        bullets: [
          "Red meat (beef, lamb) — highest iron content",
          "Lentils (dal) — excellent plant-based iron",
          "Dark leafy greens — spinach, kale",
          "Beans and chickpeas",
          "Tofu and soya",
          "Fortified cereals",
        ],
      },
      {
        heading: "The Morning of Donation",
        body: "Never donate on an empty stomach. Low blood sugar makes fainting far more likely. Eat a light, low-fat meal 2–3 hours before you go.",
        bullets: [
          "✅ Rice with vegetables — light and iron-rich",
          "✅ Eggs on toast — protein + iron",
          "✅ Banana and oats — slow-release energy",
          "❌ Avoid: fatty foods (burger, fries, biriyani) — fat suspends in the plasma and can disqualify your donation",
          "❌ Avoid: alcohol — thins the blood, causes dehydration",
        ],
      },
      {
        heading: "Hydration Is Critical",
        body: "Drink at least 500 ml of water in the 2 hours before your appointment. Well-hydrated blood flows faster and makes the vein easier to locate — reducing the time the needle is in your arm from 10 minutes to as little as 7.",
      },
      {
        heading: "Vitamin C Boosts Iron Absorption",
        body: "Eat your iron-rich food alongside something high in Vitamin C — a glass of orange juice, a tomato, a guava. Vitamin C converts non-heme (plant) iron into a form your body absorbs up to 3× more efficiently. Conversely, avoid tea or coffee with meals — tannins in tea block iron absorption significantly.",
      },
      {
        heading: "After the Donation",
        body: "Drink the juice they offer at the centre — don't skip it. Eat a proper meal within 2 hours. Avoid strenuous activity and alcohol for 24 hours.",
        tip: "Keep a SaveLife-approved snack kit ready: a banana, a juice box, and an iron supplement. Your body will thank you.",
      },
    ],
  },
  {
    id: "what-happens-blood",
    cat: "Health Science", catColor: "#3b82f6",
    emoji: "🔬", readTime: 5, featured: true,
    title: "What Happens to Your Blood After Donation?",
    excerpt: "Your 450 ml donation travels through labs, testing, separation, and storage before reaching a patient. Here's the full journey.",
    sections: [
      {
        heading: "Step 1 — Collection and Labelling",
        body: "The 450 ml drawn from your arm goes into a sealed blood bag with a unique barcode. A small sample vial is taken for testing. Every bag is tracked from donor to patient — an unbroken chain of identity that takes seconds to trace.",
      },
      {
        heading: "Step 2 — Screening Tests",
        body: "Within hours, the sample is tested for five infections that can be transmitted through blood:",
        bullets: [
          "🦠 HIV (AIDS virus)",
          "🦠 Hepatitis B",
          "🦠 Hepatitis C",
          "🦠 Syphilis (Treponema pallidum)",
          "🦠 Malaria (in endemic regions)",
        ],
      },
      {
        heading: "Step 3 — Separation Into Components",
        body: "Whole blood is spun in a centrifuge at high speed. The different densities separate the blood into three layers. Each layer is extracted into its own bag and used for different patients:",
        bullets: [
          "🔴 Red blood cells (bottom) — anaemia, surgery, trauma, sickle cell disease",
          "💛 Plasma (top, golden liquid) — burns, clotting disorders, liver failure",
          "🟡 Platelets (middle, thin layer) — chemotherapy patients, dengue fever",
        ],
      },
      {
        heading: "Step 4 — Storage",
        body: "Each component has a different storage requirement and shelf life. Red cells are stored at 1–6°C and last 42 days. Platelets are stored at room temperature (20–24°C) with constant gentle agitation and last only 5–7 days — making them the most urgently needed. Plasma is frozen at −18°C or colder and can last up to 1 year.",
      },
      {
        heading: "Step 5 — Distribution to Patients",
        body: "When a hospital requests a specific blood type and component, the blood bank cross-matches it against the patient's sample to ensure compatibility, then releases it. The total time from your donation to a patient's bedside can be as little as 24–48 hours.",
        tip: "Your single donation — split into 3 components — can reach 3 completely different patients in different wards of different hospitals.",
      },
    ],
  },
  {
    id: "myths-debunked",
    cat: "Facts & Myths", catColor: "#7c3aed",
    emoji: "🚫", readTime: 5, featured: false,
    title: "10 Blood Donation Myths — Completely Debunked",
    excerpt: "Fear, misinformation, and myths stop millions from donating. Here's the truth behind the most common ones.",
    sections: [
      {
        heading: "Myth 1 — 'It hurts a lot'",
        body: "You feel a quick pinch when the needle goes in — similar to a mosquito bite. After that, there is no pain. The needle is thin, sterile, and used only once. Most donors read their phone, chat with staff, or nap during the 8–10 minute draw.",
      },
      {
        heading: "Myth 2 — 'It makes you weak for days'",
        body: "Your blood volume returns to normal within 24 hours. Most donors feel completely fine within an hour of donating. A small number feel light-headed briefly — which is why you rest for 15 minutes and drink juice before leaving.",
      },
      {
        heading: "Myth 3 — 'You can catch a disease by donating'",
        body: "Impossible. Every needle and blood bag is sterile, single-use, and disposed of after your donation. You cannot catch HIV, hepatitis, or any infection from donating. This myth is one of the most damaging because it's simply false.",
      },
      {
        heading: "Myth 4 — 'I have a common blood type so my donation isn't needed'",
        body: "Common blood types like O+ and A+ are needed the most precisely because they're common — hospitals use them daily in high volumes. Rare blood types like B- and AB- are needed urgently when a patient with that type arrives. Every type is needed every day.",
      },
      {
        heading: "Myth 5 — 'Donating blood causes anemia'",
        body: "Only if you donate too frequently without eating well. With the 90-day waiting period and a balanced iron-rich diet, your body fully restores its red cell count before you donate again. Regular donors actually undergo health checks that often catch anemia early.",
      },
      {
        heading: "Myth 6 — 'I'm too old to donate'",
        body: "In Bangladesh and most countries, the upper age limit is 60. Many healthy donors in their 50s are some of the most frequent and reliable donors. Beyond 60, consult a doctor — a clean bill of health often means you can still donate.",
      },
      {
        heading: "Myth 7 — 'Overweight people can't donate'",
        body: "Weight only affects donation if you are below the minimum (50 kg). Being overweight is not a disqualifier. However, very high blood pressure — sometimes associated with obesity — may need to be managed before donating.",
      },
      {
        heading: "Myth 8 — 'Women shouldn't donate during menstruation'",
        body: "Light to moderate menstruation does not disqualify donation. However, if your flow is very heavy or you feel fatigued, it's wise to wait until it ends. Haemoglobin is checked before every donation — if it's within range, you can donate regardless.",
      },
      {
        heading: "Myth 9 — 'Diabetics cannot donate'",
        body: "Type 2 diabetics whose blood sugar is well-controlled can usually donate. Type 1 (insulin-dependent) diabetics are typically deferred because insulin affects the blood quality. Always disclose your condition at the donation centre — they make the final call.",
      },
      {
        heading: "Myth 10 — 'No one will want my blood if I've had dengue'",
        body: "You must wait 28 days after full recovery from dengue fever. After that, your blood is perfectly safe to donate. The dengue virus does not persist in the blood beyond recovery.",
        tip: "The only way to know if YOUR blood is safe is to go donate — they test it. You might be surprised.",
      },
    ],
  },
  {
    id: "recovery-guide",
    cat: "Recovery", catColor: "#d97706",
    emoji: "💪", readTime: 3, featured: false,
    title: "How to Recover Perfectly After Donating",
    excerpt: "The 24 hours after donation are important. Follow these steps to feel great and come back sooner.",
    sections: [
      {
        heading: "The First 15 Minutes (At the Centre)",
        body: "Do not rush out after the needle is removed. Lie back for at least 10–15 minutes. Drink the juice or water offered — this is not optional. Eat the biscuit. Let your blood pressure stabilise before standing. If you feel dizzy at any point, tell the staff immediately.",
      },
      {
        heading: "The First 4 Hours",
        bullets: [
          "Keep the bandage on for at least 4 hours",
          "Avoid heavy lifting or strenuous exercise",
          "Drink an extra 1 litre of water above your normal intake",
          "Eat a proper meal within 2 hours of returning home",
          "Avoid alcohol — it causes dehydration and amplifies light-headedness",
        ],
      },
      {
        heading: "The First 24 Hours",
        body: "Avoid intense physical activity — gym workouts, sports, heavy manual labour. Your blood volume is fully restored but your red cell count is still recovering. Pushing hard can cause dizziness or fainting. Light walking is completely fine.",
      },
      {
        heading: "What to Do If You Feel Faint",
        body: "Sit or lie down immediately. Elevate your legs above heart level. Drink water. Most episodes resolve in 2–3 minutes. If it persists longer than 10 minutes or you lose consciousness, call for medical help. This is rare — it happens in roughly 1–2% of donations.",
      },
      {
        heading: "Over the Next 4–6 Weeks",
        body: "Eat iron-rich foods regularly to speed red cell regeneration. A well-balanced diet with lentils, meat, leafy greens, and Vitamin C is all you need — no supplements required unless your doctor recommends them.",
        tip: "Mark your calendar 90 days ahead. The sooner you plan the next donation, the sooner another life gets saved.",
      },
    ],
  },
  {
    id: "who-cannot-donate",
    cat: "Donation Tips", catColor: "#dc2626",
    emoji: "🚨", readTime: 4, featured: false,
    title: "Who Cannot Donate Blood? The Complete List",
    excerpt: "Some people are permanently deferred. Others just need to wait. Know which category you're in before you go.",
    sections: [
      {
        heading: "Permanent Deferrals",
        body: "These conditions disqualify you from donating blood permanently:",
        bullets: [
          "HIV positive or AIDS diagnosis",
          "Hepatitis B or C carrier (chronic)",
          "Ever received a dura mater (brain membrane) graft",
          "History of Chagas disease",
          "Hemophilia or other blood coagulation disorders",
          "History of certain blood cancers (leukemia, lymphoma)",
          "Injected illegal drugs (ever) — needle sharing risk",
        ],
      },
      {
        heading: "Temporary Deferrals — Wait and Then Donate",
        bullets: [
          "Tattoo or piercing — wait 6 months",
          "Dental treatment (extraction) — wait 72 hours",
          "Pregnancy — wait 6 months after delivery",
          "Malaria — wait 3 years after last symptom-free period",
          "Dengue fever — wait 28 days after full recovery",
          "Recent cold or flu — wait 7 days after fully recovering",
          "Vaccinations — varies (oral polio: 4 weeks, COVID: 14 days after symptom-free)",
          "Major surgery — wait 6–12 months depending on procedure",
          "Blood transfusion received — wait 12 months",
          "Travel to malaria-endemic zones — wait 6–12 months",
        ],
      },
      {
        heading: "On the Day — These Will Defer You Temporarily",
        bullets: [
          "Haemoglobin too low (below 12.5 g/dL for women, 13.5 for men)",
          "Blood pressure too high or too low",
          "Pulse outside 60–100 bpm",
          "Temperature above 37.5°C (fever)",
          "Body weight under 50 kg",
          "Drank alcohol within last 24 hours",
          "Took aspirin or ibuprofen in last 3 days (platelet donation)",
        ],
      },
      {
        heading: "When in Doubt, Go Anyway",
        body: "The donation centre screens you for free before you donate. If you're unsure whether you're eligible, go in and let them decide. The health check alone — blood pressure, haemoglobin, pulse — is valuable. They'll tell you exactly what to do and when you can come back.",
        tip: "Deferral is not rejection. It means 'come back later' — and your body will be even better prepared.",
      },
    ],
  },
  {
    id: "iron-rich-foods",
    cat: "Nutrition", catColor: "#22c55e",
    emoji: "🥦", readTime: 4, featured: false,
    title: "Iron-Rich Foods Every Blood Donor Should Eat",
    excerpt: "Low haemoglobin is the #1 reason donors are turned away. Eat these foods regularly and you'll almost never get deferred.",
    sections: [
      {
        heading: "Why Iron Matters for Donors",
        body: "Haemoglobin — the protein in red blood cells that carries oxygen — is made with iron. Every time you donate blood, you lose some iron. A healthy balanced diet replaces this naturally, but donors need slightly more iron-awareness than non-donors.",
      },
      {
        heading: "Heme Iron (Animal Sources) — Most Easily Absorbed",
        bullets: [
          "Beef liver — 6.5 mg per 100g (the single richest source)",
          "Lean red meat (beef, lamb) — 2.5–3 mg per 100g",
          "Chicken liver — 9 mg per 100g",
          "Oysters and mussels — 5–7 mg per 100g",
          "Tuna and sardines — 1–2 mg per 100g",
          "Chicken and turkey (dark meat) — 1.5 mg per 100g",
        ],
      },
      {
        heading: "Non-Heme Iron (Plant Sources) — Needs Vitamin C to Absorb Well",
        bullets: [
          "Lentils (red/green dal) — 3.3 mg per 100g cooked",
          "Chickpeas and kidney beans — 2.5 mg per 100g",
          "Tofu — 2.7 mg per 100g",
          "Spinach (cooked) — 3.6 mg per 100g",
          "Pumpkin seeds — 8.8 mg per 100g",
          "Quinoa — 1.5 mg per 100g",
          "Fortified breakfast cereals — 4–18 mg per serving",
        ],
      },
      {
        heading: "Supercharge Absorption With Vitamin C",
        body: "Eating Vitamin C alongside plant iron can triple the amount your body absorbs. Good pairings:",
        bullets: [
          "Dal with a squeeze of lemon juice",
          "Spinach salad with sliced guava or tomato",
          "Lentil soup with a glass of orange juice",
          "Tofu stir-fry with broccoli and bell peppers",
        ],
      },
      {
        heading: "What Blocks Iron Absorption",
        bullets: [
          "Tea and coffee — tannins bind to iron and carry it out",
          "Calcium-rich dairy (milk, cheese) — competes with iron for absorption",
          "High-fibre foods eaten together with iron-rich foods",
        ],
        tip: "Simple rule: eat iron-rich food first, wait an hour, then have your tea or milk.",
      },
    ],
  },
  {
    id: "hidden-benefits",
    cat: "Health Science", catColor: "#3b82f6",
    emoji: "❤️", readTime: 4, featured: false,
    title: "Surprising Health Benefits of Donating Blood",
    excerpt: "Donating isn't just good for others. Research shows it benefits the donor in ways most people don't know about.",
    sections: [
      {
        heading: "A Free Health Check Every Time",
        body: "Before every donation, trained staff check your blood pressure, pulse, haemoglobin, and temperature. This mini-physical catches conditions you might not know you have — high blood pressure, anaemia, irregular pulse. Regular donors often get abnormal results detected years before symptoms appear.",
      },
      {
        heading: "Reduces Iron Overload (Haemochromatosis)",
        body: "Too much iron stored in the body causes haemochromatosis — a condition that damages the liver, heart, and pancreas. Regular blood donation naturally removes excess iron, reducing the risk significantly. Studies show that regular donors have lower rates of iron-related organ damage.",
      },
      {
        heading: "Burns Roughly 650 Calories",
        body: "Your body burns approximately 650 calories regenerating the 450 ml of blood you donated. This is not a weight-loss strategy, but it is a genuine metabolic effect — your body works hard to rebuild red cells, platelets, and plasma.",
      },
      {
        heading: "May Reduce Cardiovascular Risk",
        body: "Several studies (including a Finnish study of 2,682 men) found that regular blood donors had significantly lower rates of heart attacks and strokes. The proposed mechanism: lower blood viscosity (thickness) after donation reduces the risk of clots forming in arteries. Lower iron levels also reduce oxidative stress, which damages blood vessel walls.",
      },
      {
        heading: "Psychological Wellbeing",
        body: "Donors consistently report higher feelings of purpose, satisfaction, and community connection than non-donors. Knowing concretely that you saved someone's life — with a certificate or a thank-you from a recipient — has measurable effects on mood and self-worth.",
        tip: "Every donation is also a choice to take care of your own health. The relationship between donor health and recipient survival is not one-directional.",
      },
    ],
  },
  {
    id: "o-negative-special",
    cat: "Facts & Myths", catColor: "#7c3aed",
    emoji: "👑", readTime: 3, featured: false,
    title: "Why O- Blood Is the World's Most Precious",
    excerpt: "Only 6% of people have O-. Hospitals keep their supply of it for the most critical emergencies. Here's why.",
    sections: [
      {
        heading: "The Universal Donor",
        body: "O- red blood cells can be given to any patient, regardless of their blood type. This is because O- cells carry no A, B, or Rh antigens — the markers that trigger rejection reactions. Any patient's immune system accepts O- without a fight.",
      },
      {
        heading: "When O- Is Used",
        bullets: [
          "Trauma patients in the ER when there's no time to determine blood type",
          "Premature newborns (their blood type is often not established at birth)",
          "Patients in surgery who unexpectedly need an emergency transfusion",
          "Helicopter and ambulance emergency kits — O- is the only blood carried onboard",
          "Mass casualty events where speed of treatment overrides matching",
        ],
      },
      {
        heading: "The Supply Problem",
        body: "Only 6 people in 100 are O-. Yet trauma centres use O- blood daily — for just-in-case reserves, for emergencies, and for the cases listed above. Demand regularly outpaces supply. In Bangladesh, O- shortages can mean the difference between a patient surviving an accident and not.",
      },
      {
        heading: "If You Are O-",
        body: "Your donation is categorically more valuable than any other blood type. Hospitals specifically recruit O- donors for reserved emergency stocks. If you are O- and healthy, donating every 90 days is one of the most impactful things a human being can do.",
        tip: "Tell your family and friends if you are O-. Knowing your blood type might one day make the difference in someone else's emergency.",
      },
    ],
  },
  {
    id: "first-donation",
    cat: "Donation Tips", catColor: "#dc2626",
    emoji: "🩸", readTime: 5, featured: false,
    title: "Your First Blood Donation: Everything You Need to Know",
    excerpt: "Nervous about your first time? This step-by-step walkthrough tells you exactly what to expect from arrival to going home.",
    sections: [
      {
        heading: "Before You Go — Preparation",
        bullets: [
          "Eat a light, iron-rich meal 2–3 hours before",
          "Drink at least 500 ml of water",
          "Sleep at least 6 hours the night before",
          "Wear a short-sleeved or loose shirt (they need access to your arm)",
          "Bring a valid ID (NID or student card)",
          "Don't take aspirin or ibuprofen in the 3 days before (blood thinner effect)",
        ],
      },
      {
        heading: "Step 1 — Registration (5 minutes)",
        body: "You fill out a short health history form: your medications, recent illnesses, travel, and general health. This is reviewed by a nurse or doctor. Everything you write is confidential.",
      },
      {
        heading: "Step 2 — Mini Health Check (5–10 minutes)",
        body: "A trained nurse checks your blood pressure, pulse, temperature, and pricks your finger for a haemoglobin drop test. If everything is within range, you're cleared to donate. If not, you're given guidance on when to come back — you can try again when ready.",
      },
      {
        heading: "Step 3 — The Donation (8–12 minutes)",
        body: "You lie on a padded chair or bed. The nurse cleans the inside of your elbow and inserts a thin needle. You'll feel a quick pinch — most people say it's milder than they expected. The needle is attached to a tube that fills a 450 ml bag. You may be asked to gently squeeze a foam ball to keep blood flow smooth. After it fills, the needle comes out. A bandage goes on. Done.",
      },
      {
        heading: "Step 4 — Rest and Refresh (15 minutes)",
        body: "You stay seated or lying for at least 15 minutes. Staff bring you juice and a small snack. Do not skip this — it is medically important. Light-headedness happens in roughly 1–2% of donations, and this rest period catches it before you stand up.",
      },
      {
        heading: "Going Home",
        body: "Keep the bandage on for 4 hours. Eat a proper meal within 2 hours. No heavy exercise for 24 hours. Drink extra fluids all day.",
        tip: "Most first-time donors say: 'That was much easier than I thought.' The anxiety beforehand is almost always worse than the donation itself. Go. You'll do it again.",
      },
    ],
  },
];

// ── Article Reader ────────────────────────────────────────────────────────────

function ArticleReader({ article, onBack }) {
  return (
    <div className="ht-reader">
      <div className="ht-reader-header" style={{ "--ac": article.catColor }}>
        <button className="ht-reader-back" onClick={onBack}>← All Tips</button>
        <div className="ht-reader-emoji">{article.emoji}</div>
        <div className="ht-reader-meta">
          <span className="ht-cat-pill" style={{ background: article.catColor }}>{article.cat}</span>
          <span className="ht-readtime">📖 {article.readTime} min read</span>
        </div>
        <h1 className="ht-reader-title">{article.title}</h1>
        <p className="ht-reader-excerpt">{article.excerpt}</p>
      </div>
      <div className="ht-reader-body">
        {article.sections.map((s, i) => (
          <div key={i} className="ht-section">
            {s.heading && <h2 className="ht-section-h">{s.heading}</h2>}
            {s.body && <p className="ht-section-p">{s.body}</p>}
            {s.bullets && (
              <ul className="ht-section-ul">
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
            {s.tip && (
              <div className="ht-tip-box">
                <span className="ht-tip-icon">💡</span>
                <span>{s.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article, onClick }) {
  return (
    <div className="ht-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>
      <div className="ht-card-top" style={{ background: `linear-gradient(135deg, ${article.catColor}22, ${article.catColor}44)` }}>
        <div className="ht-card-emoji">{article.emoji}</div>
      </div>
      <div className="ht-card-body">
        <span className="ht-cat-pill" style={{ background: article.catColor }}>{article.cat}</span>
        <h3 className="ht-card-title">{article.title}</h3>
        <p className="ht-card-excerpt">{article.excerpt}</p>
        <div className="ht-card-footer">
          <span className="ht-readtime">📖 {article.readTime} min</span>
          <span className="ht-card-cta">Read →</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const CATS = ["All", "Donation Tips", "Nutrition", "Health Science", "Recovery", "Facts & Myths"];

export default function HealthTips({ user, onBack, openId }) {
  const [selected, setSelected] = useState(openId || null);
  const [cat, setCat]           = useState("All");

  if (selected) {
    const article = ARTICLES.find(a => a.id === selected);
    if (article) return (
      <div className="ht-page">
        <header className="ht-nav">
          <a className="ht-brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
          <div className="ht-nav-right"><ThemeToggle /><button className="ht-back" onClick={onBack}>← Back</button></div>
        </header>
        <ArticleReader article={article} onBack={() => setSelected(null)} />
      </div>
    );
  }

  const filtered = cat === "All" ? ARTICLES : ARTICLES.filter(a => a.cat === cat);

  return (
    <div className="ht-page">
      {/* Nav */}
      <header className="ht-nav">
        <a className="ht-brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
        <div className="ht-nav-right"><ThemeToggle /><button className="ht-back" onClick={onBack}>← Back</button></div>
      </header>

      {/* Hero */}
      <div className="ht-hero">
        <div className="ht-hero-icons">🩸 🥗 🔬 💪 ❤️ 🧬</div>
        <h1>Health Tips & Guides</h1>
        <p>Expert-backed articles on blood donation, nutrition, and what happens inside your body.</p>
      </div>

      {/* Featured article */}
      <div className="ht-featured-wrap">
        <div className="ht-featured-label">📌 Featured Article</div>
        {(() => {
          const f = ARTICLES.find(a => a.featured && a.id === "what-happens-blood");
          return f ? (
            <div className="ht-featured" onClick={() => setSelected(f.id)} role="button"
              style={{ "--ac": f.catColor }}>
              <div className="ht-featured-left">
                <span className="ht-cat-pill" style={{ background: f.catColor }}>{f.cat}</span>
                <h2>{f.title}</h2>
                <p>{f.excerpt}</p>
                <button className="ht-featured-btn" style={{ background: f.catColor }}>
                  Read Article →
                </button>
              </div>
              <div className="ht-featured-right">{f.emoji}</div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Category filter */}
      <div className="ht-cats">
        {CATS.map(c => (
          <button key={c} className={`ht-cat-btn${cat === c ? " ht-cat-on" : ""}`}
            onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="ht-grid-wrap">
        <div className="ht-count">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</div>
        <div className="ht-grid">
          {filtered.map(a => (
            <ArticleCard key={a.id} article={a} onClick={() => setSelected(a.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
