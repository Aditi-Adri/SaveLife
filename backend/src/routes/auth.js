import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { generateUserCode } from "../utils/credentials.js";
import { sendTestEmail, emailConfigured } from "../utils/email.js";

const router = Router();

// Columns safe to send to the client (never the password hash).
const PUBLIC_FIELDS = `id, user_code, name, email, phone, age, gender, weight,
  blood_type, donation_count, last_donation, donation_history,
  drug_addicted, medical_conditions, avatar_url, religion,
  latitude, longitude, location_text, role, created_at`;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, user_code: user.user_code },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// Generate a user_code that isn't already taken (handles the rare collision).
async function uniqueUserCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateUserCode();
    const { rows } = await query("SELECT 1 FROM users WHERE user_code = $1", [code]);
    if (rows.length === 0) return code;
  }
  throw new Error("Could not generate a unique user code");
}

// POST /api/auth/register — donor fills the form and chooses a password.
// We auto-generate a Donor ID (user_code) for matching.
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    age,
    gender,
    weight,
    blood_type,
    donation_count,
    last_donation,
    donation_history,
    drug_addicted,
    medical_conditions,
  } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: "Name, email, password and phone are required" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!/^\d{11}$/.test(String(phone))) {
    return res.status(400).json({ error: "Phone must be an 11-digit number" });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const userCode = await uniqueUserCode();
    const hash = await bcrypt.hash(String(password), 10);

    const result = await query(
      `INSERT INTO users
         (user_code, name, email, password, phone, age, gender, weight, blood_type,
          donation_count, last_donation, donation_history, drug_addicted, medical_conditions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${PUBLIC_FIELDS}`,
      [
        userCode,
        name,
        email,
        hash,
        String(phone),
        toInt(age),
        gender || null,
        toNum(weight),
        blood_type || null,
        toInt(donation_count) ?? 0,
        last_donation || null,
        donation_history || null,
        drug_addicted === true || drug_addicted === "yes",
        medical_conditions || null,
      ]
    );

    const user = result.rows[0];
    res.status(201).json({
      user,
      credentials: { user_code: user.user_code },
      token: signToken(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
});

// POST /api/auth/login — log in with the auto-generated User ID (or email) + password.
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: "User ID and password are required" });
  }

  try {
    const result = await query(
      "SELECT * FROM users WHERE user_code = $1 OR email = $1",
      [identifier]
    );
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({ error: "Invalid User ID or password" });
    }

    const { password: _pw, ...user } = row;
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log in" });
  }
});

// GET /api/auth/me — full profile of the logged-in donor.
router.get("/me", requireAuth, async (req, res) => {
  const result = await query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [
    req.user.id,
  ]);
  res.json({ user: result.rows[0] || null, emailNotifications: emailConfigured() });
});

// POST /api/auth/test-email — send a test notification to the logged-in user's email.
router.post("/test-email", requireAuth, async (req, res) => {
  const result = await query("SELECT name, email FROM users WHERE id = $1", [req.user.id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  try {
    await sendTestEmail(user.email, user.name);
    res.json({ ok: true, sentTo: user.email });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// PUT /api/auth/profile — update editable profile fields.
router.put("/profile", requireAuth, async (req, res) => {
  const { name, phone, age, weight, blood_type, donation_count, last_donation,
    donation_history, drug_addicted, medical_conditions,
    religion, latitude, longitude, location_text } = req.body || {};

  if (phone != null && !/^\d{11}$/.test(String(phone))) {
    return res.status(400).json({ error: "Phone must be an 11-digit number" });
  }

  const result = await query(
    `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        age = COALESCE($3, age),
        weight = COALESCE($4, weight),
        blood_type = COALESCE($5, blood_type),
        donation_count = COALESCE($6, donation_count),
        last_donation = COALESCE($7, last_donation),
        donation_history = COALESCE($8, donation_history),
        drug_addicted = COALESCE($9, drug_addicted),
        medical_conditions = COALESCE($10, medical_conditions),
        religion = COALESCE($11, religion),
        latitude = COALESCE($12, latitude),
        longitude = COALESCE($13, longitude),
        location_text = COALESCE($14, location_text)
      WHERE id = $15
      RETURNING ${PUBLIC_FIELDS}`,
    [
      name ? String(name).trim() : null,
      phone != null ? String(phone) : null,
      toInt(age),
      toNum(weight),
      blood_type ?? null,
      toInt(donation_count),
      last_donation ?? null,
      donation_history ?? null,
      typeof drug_addicted === "boolean" ? drug_addicted : null,
      medical_conditions ?? null,
      religion ?? null,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      location_text ?? null,
      req.user.id,
    ]
  );
  res.json({ user: result.rows[0] });
});

export default router;
