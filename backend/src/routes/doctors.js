import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/doctors — public list with optional filters
router.get("/", async (req, res) => {
  try {
    const { specialty, city, q } = req.query;
    const conds = ["1=1"];
    const params = [];
    let i = 1;

    if (specialty) { conds.push(`specialty ILIKE $${i++}`); params.push(`%${specialty}%`); }
    if (city)      { conds.push(`city ILIKE $${i++}`);      params.push(`%${city}%`); }
    if (q) {
      conds.push(`(name ILIKE $${i} OR specialty ILIKE $${i} OR hospital ILIKE $${i} OR qualifications ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }

    const result = await query(
      `SELECT * FROM doctors WHERE ${conds.join(" AND ")} ORDER BY rating DESC, total_patients DESC`,
      params
    );
    res.json({ doctors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load doctors" });
  }
});

// POST /api/doctors/appointments — book appointment (auth required)
router.post("/appointments", requireAuth, async (req, res) => {
  try {
    const {
      doctor_id, patient_name, patient_age, patient_gender,
      patient_phone, appointment_date, appointment_time, reason, notes,
    } = req.body;

    if (!doctor_id || !patient_name || !appointment_date)
      return res.status(400).json({ error: "doctor_id, patient_name, and appointment_date are required" });

    const result = await query(
      `INSERT INTO appointments
         (user_id, doctor_id, patient_name, patient_age, patient_gender,
          patient_phone, appointment_date, appointment_time, reason, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'confirmed')
       RETURNING *`,
      [req.user.id, doctor_id, patient_name,
       patient_age || null, patient_gender || null, patient_phone || null,
       appointment_date, appointment_time || null, reason || null, notes || null]
    );

    const docResult = await query("SELECT * FROM doctors WHERE id = $1", [doctor_id]);
    res.status(201).json({ appointment: result.rows[0], doctor: docResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// GET /api/doctors/appointments/mine — my appointments (auth required)
router.get("/appointments/mine", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, d.name AS doctor_name, d.specialty, d.qualifications,
              d.hospital AS doctor_hospital, d.city AS doctor_city,
              d.consultation_fee, d.phone AS doctor_phone
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
        WHERE a.user_id = $1
        ORDER BY a.appointment_date DESC, a.created_at DESC`,
      [req.user.id]
    );
    res.json({ appointments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load appointments" });
  }
});

export default router;
