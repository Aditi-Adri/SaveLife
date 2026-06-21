import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

// Authenticated hospital booking actions.
const router = Router();
router.use(requireAuth);

// GET /api/hospitals/bookings — the current user's bookings.
router.get("/bookings", async (req, res) => {
  const result = await query(
    `SELECT b.id, b.patient_name, b.reason, b.booking_date, b.status, b.created_at,
            h.name AS hospital_name, h.city AS hospital_city, h.phone AS hospital_phone
       FROM hospital_bookings b
       JOIN hospitals h ON h.id = b.hospital_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ bookings: result.rows });
});

// POST /api/hospitals/:id/book — book a hospital.
router.post("/:id/book", async (req, res) => {
  const { patient_name, reason, booking_date } = req.body || {};
  if (!patient_name) {
    return res.status(400).json({ error: "Patient name is required" });
  }

  const hospital = await query("SELECT id, name FROM hospitals WHERE id = $1", [req.params.id]);
  if (hospital.rows.length === 0) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  const result = await query(
    `INSERT INTO hospital_bookings (user_id, hospital_id, patient_name, reason, booking_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, req.params.id, patient_name, reason || null, booking_date || null]
  );
  res.status(201).json({ booking: { ...result.rows[0], hospital_name: hospital.rows[0].name } });
});

export default router;
