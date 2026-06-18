import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PUBLIC_FIELDS = "id, name, email, phone, blood_type, role, created_at";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, phone, blood_type, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  const safeRole = role === "responder" ? "responder" : "user";

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, phone, blood_type, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PUBLIC_FIELDS}`,
      [name, email, hash, phone || null, blood_type || null, safeRole]
    );

    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password: _pw, ...user } = row;
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log in" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json({ user: result.rows[0] || null });
});

// PUT /api/auth/profile — update phone / blood type
router.put("/profile", requireAuth, async (req, res) => {
  const { phone, blood_type } = req.body || {};
  const result = await query(
    `UPDATE users
        SET phone = COALESCE($1, phone),
            blood_type = COALESCE($2, blood_type)
      WHERE id = $3
      RETURNING ${PUBLIC_FIELDS}`,
    [phone ?? null, blood_type ?? null, req.user.id]
  );
  res.json({ user: result.rows[0] });
});

export default router;
