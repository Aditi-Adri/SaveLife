import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/contacts — the current user's emergency contacts
router.get("/", async (req, res) => {
  const result = await query(
    "SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY created_at",
    [req.user.id]
  );
  res.json({ contacts: result.rows });
});

// POST /api/contacts
router.post("/", async (req, res) => {
  const { name, phone, relationship } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: "name and phone are required" });
  }
  const result = await query(
    `INSERT INTO emergency_contacts (user_id, name, phone, relationship)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, name, phone, relationship || null]
  );
  res.status(201).json({ contact: result.rows[0] });
});

// DELETE /api/contacts/:id
router.delete("/:id", async (req, res) => {
  const result = await query(
    "DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Contact not found" });
  }
  res.json({ deleted: result.rows[0].id });
});

export default router;
