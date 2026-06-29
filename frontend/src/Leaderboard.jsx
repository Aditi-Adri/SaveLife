import { useState, useEffect } from "react";
import { api } from "./api";
import ThemeToggle from "./ThemeToggle";
import { getEarnedBadges } from "./badges";
import "./Leaderboard.css";

function initials(name) {
  return (name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
}

function DonorAvatar({ donor, size = 48 }) {
  if (donor.avatar_url) {
    return (
      <img
        src={donor.avatar_url}
        alt={donor.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "#dc2626", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: Math.round(size * 0.38),
    }}>
      {initials(donor.name)}
    </div>
  );
}

export default function Leaderboard({ user, onBack }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard()
      .then(d => setDonors(d.donors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myRank = user ? donors.findIndex(d => d.id === user.id) + 1 : 0;
  const top3 = donors.slice(0, 3);
  const rest = donors.slice(3);

  // Podium arrangement: 2nd left, 1st center, 3rd right
  const podium = top3.length === 3
    ? [{ d: top3[1], rank: 2 }, { d: top3[0], rank: 1 }, { d: top3[2], rank: 3 }]
    : top3.map((d, i) => ({ d, rank: i + 1 }));

  return (
    <div className="lb-page">
      {/* ── Nav ── */}
      <header className="lb-nav">
        <a className="lb-brand" onClick={onBack} role="button">🩺 <span>SaveLife</span></a>
        <div className="lb-nav-right">
          <ThemeToggle />
          <button className="lb-back-btn" onClick={onBack}>← Back</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="lb-hero">
        <div className="lb-hero-icon">🏆</div>
        <h1>Top Blood Donors</h1>
        <p>Saving lives in Bangladesh, one donation at a time.</p>
        {myRank > 0 && (
          <div className="lb-rank-pill">
            You are ranked <strong>#{myRank}</strong> out of {donors.length} donors
          </div>
        )}
        {user && myRank === 0 && donors.length > 0 && (
          <div className="lb-rank-pill lb-rank-hint">
            Log your donations in Profile to appear on the leaderboard!
          </div>
        )}
      </div>

      {loading ? (
        <div className="lb-loading">Loading leaderboard…</div>
      ) : donors.length === 0 ? (
        <div className="lb-empty">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🩸</div>
          <p>No donors on the leaderboard yet.</p>
          <p style={{ marginTop: 6, color: "var(--muted)" }}>Be the first to log your donation!</p>
        </div>
      ) : (
        <>
          {/* ── Top 3 podium ── */}
          {top3.length > 0 && (
            <div className="lb-podium">
              {podium.map(({ d, rank }) => (
                <PodiumCard key={d.id} donor={d} rank={rank} isMe={!!(user && user.id === d.id)} />
              ))}
            </div>
          )}

          {/* ── Ranked list 4‑50 ── */}
          {rest.length > 0 && (
            <div className="lb-section">
              <div className="lb-section-title">All Donors</div>
              <div className="lb-list">
                {rest.map((d, i) => (
                  <RankRow key={d.id} donor={d} rank={i + 4} isMe={!!(user && user.id === d.id)} />
                ))}
              </div>
            </div>
          )}

          <p className="lb-note">
            Donation counts are self-reported by donors.
            Join {donors.length} heroes — log your donations in Profile to appear here!
          </p>
        </>
      )}
    </div>
  );
}

function PodiumCard({ donor, rank, isMe }) {
  const badges = getEarnedBadges(donor).slice(0, 3);
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const cls = rank === 1 ? "podium-gold" : rank === 2 ? "podium-silver" : "podium-bronze";

  return (
    <div className={`lb-podium-card ${cls}${isMe ? " lb-me" : ""}`}>
      {isMe && <div className="lb-you-tag">YOU</div>}
      <div className="lb-podium-rank">{rankEmoji}</div>
      <DonorAvatar donor={donor} size={rank === 1 ? 72 : 60} />
      <div className="lb-podium-name">{donor.name}</div>
      {donor.blood_type && <div className="lb-blood-badge">{donor.blood_type}</div>}
      <div className="lb-podium-count">
        <strong>{donor.donation_count}</strong>
        <span>{donor.donation_count === 1 ? "donation" : "donations"}</span>
      </div>
      {donor.location_text && <div className="lb-podium-loc">📍 {donor.location_text}</div>}
      {badges.length > 0 && (
        <div className="lb-badge-row">
          {badges.map(b => <span key={b.id} title={`${b.name}: ${b.desc}`}>{b.emoji}</span>)}
        </div>
      )}
    </div>
  );
}

function RankRow({ donor, rank, isMe }) {
  const badges = getEarnedBadges(donor).slice(0, 4);

  return (
    <div className={`lb-row${isMe ? " lb-me" : ""}`}>
      <div className="lb-row-rank">#{rank}</div>
      <DonorAvatar donor={donor} size={40} />
      <div className="lb-row-info">
        <div className="lb-row-name">
          {donor.name}
          {isMe && <span className="lb-you-sm">YOU</span>}
        </div>
        {donor.location_text && <div className="lb-row-loc">📍 {donor.location_text}</div>}
      </div>
      <div className="lb-row-right">
        {donor.blood_type && <span className="lb-blood-sm">{donor.blood_type}</span>}
        <div className="lb-row-count">{donor.donation_count} <span>{donor.donation_count === 1 ? "donation" : "donations"}</span></div>
        {badges.length > 0 && (
          <div className="lb-row-badges">
            {badges.map(b => <span key={b.id} title={b.name}>{b.emoji}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
