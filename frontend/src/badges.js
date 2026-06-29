// Shared badge definitions and computation logic.
// Used by Profile (achievements tab) and Leaderboard (per-donor badges).

export const BADGE_DEFS = [
  { id: "first_drop", emoji: "🩸", name: "First Drop",      desc: "Made your first blood donation",       type: "count", need: 1  },
  { id: "triple",     emoji: "⭐", name: "Triple Donor",    desc: "Donated blood 3 times",                type: "count", need: 3  },
  { id: "dedicated",  emoji: "🏅", name: "Dedicated Donor", desc: "Donated blood 5 times",                type: "count", need: 5  },
  { id: "champion",   emoji: "🥇", name: "Champion",        desc: "Donated blood 10 times",               type: "count", need: 10 },
  { id: "lifesaver",  emoji: "👑", name: "Lifesaver",       desc: "Donated blood 25 times",               type: "count", need: 25 },
  { id: "legend",     emoji: "💎", name: "Legend",          desc: "Donated blood 50 times — true hero",   type: "count", need: 50 },
  { id: "universal",  emoji: "🦸", name: "Universal Hero",  desc: "O− blood type — can donate to anyone", type: "special" },
  { id: "active",     emoji: "🔥", name: "Active Donor",    desc: "Donated within the last 90 days",      type: "special" },
  { id: "profile",    emoji: "✅", name: "Full Profile",    desc: "All profile details completed",        type: "special" },
  { id: "veteran",    emoji: "🌟", name: "Veteran",         desc: "Member of SaveLife for over 1 year",   type: "special" },
];

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
}

export function getBadges(user) {
  const c = user.donation_count || 0;
  const hasProfile = !!(user.blood_type && user.age && user.phone && user.location_text);

  return BADGE_DEFS.map(b => ({
    ...b,
    earned:
      b.id === "first_drop" ? c >= 1 :
      b.id === "triple"     ? c >= 3 :
      b.id === "dedicated"  ? c >= 5 :
      b.id === "champion"   ? c >= 10 :
      b.id === "lifesaver"  ? c >= 25 :
      b.id === "legend"     ? c >= 50 :
      b.id === "universal"  ? user.blood_type === "O-" :
      b.id === "active"     ? daysAgo(user.last_donation) <= 90 :
      b.id === "profile"    ? hasProfile :
      b.id === "veteran"    ? daysAgo(user.created_at) >= 365 :
      false,
  }));
}

// Returns only earned badges, most impressive first (count badges desc, then special).
export function getEarnedBadges(user) {
  const all = getBadges(user);
  const countBadges   = all.filter(b => b.type === "count"   && b.earned).reverse();
  const specialBadges = all.filter(b => b.type === "special" && b.earned);
  return [...countBadges, ...specialBadges];
}

// Next count-based badge the user hasn't earned yet.
export function getNextBadge(user) {
  const c = user.donation_count || 0;
  return BADGE_DEFS.filter(b => b.type === "count" && b.need > c)
    .sort((a, b) => a.need - b.need)[0] || null;
}
