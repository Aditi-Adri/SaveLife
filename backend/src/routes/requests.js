import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { sendDonorAcceptedEmail } from "../utils/email.js";

const router = Router();
router.use(requireAuth);

const VALID_TYPES = ["blood", "plasma", "platelets", "whole_blood"];
const VALID_URGENCY = ["normal", "urgent", "critical"];

// POST /api/requests — create a blood / plasma / platelets request
router.post("/", async (req, res) => {
  const {
    patient_name,
    blood_type,
    donation_type = "blood",
    units_needed = 1,
    hospital,
    location,
    contact_phone,
    urgency = "urgent",
    note,
  } = req.body || {};

  if (!patient_name || !blood_type || !contact_phone) {
    return res.status(400).json({ error: "Patient name, blood type, and contact phone are required" });
  }
  if (!/^\d{11}$/.test(String(contact_phone))) {
    return res.status(400).json({ error: "Contact phone must be an 11-digit number" });
  }

  const safeType = VALID_TYPES.includes(donation_type) ? donation_type : "blood";
  const safeUrgency = VALID_URGENCY.includes(urgency) ? urgency : "urgent";

  try {
    const { rows } = await query(
      `INSERT INTO blood_requests
         (requester_id, patient_name, blood_type, donation_type, units_needed,
          hospital, location, contact_phone, urgency, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, created_at`,
      [
        req.user.id,
        patient_name,
        blood_type,
        safeType,
        Number(units_needed) || 1,
        hospital || null,
        location || null,
        String(contact_phone),
        safeUrgency,
        note || null,
      ]
    );
    res.status(201).json({ request: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// GET /api/requests/mine — logged-in user's own requests
router.get("/mine", async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ requests: rows });
});

// DELETE /api/requests/:id — cancel the user's own request
router.delete("/:id", async (req, res) => {
  const { rows } = await query(
    `UPDATE blood_requests
     SET status = 'cancelled'
     WHERE id = $1 AND requester_id = $2
     RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Request not found or not yours" });
  res.json({ ok: true });
});

// GET /api/requests/:id/contact — reveal contact info + notify the requester
router.get("/:id/contact", async (req, res) => {
  const { rows } = await query(
    `SELECT br.patient_name, br.contact_phone, br.requester_id,
            u.user_code AS requester_code
     FROM blood_requests br
     LEFT JOIN users u ON u.id = br.requester_id
     WHERE br.id = $1 AND br.status = 'open'`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Request not found" });

  const { patient_name, contact_phone, requester_id, requester_code } = rows[0];

  // Fire-and-forget email notification to the requester
  if (requester_id && requester_id !== req.user.id) {
    query(
      `SELECT u.name AS requester_name, u.email AS requester_email,
              d.name AS donor_name, d.phone AS donor_phone,
              br.blood_type, br.donation_type, br.units_needed, br.hospital
       FROM blood_requests br
       JOIN users u ON u.id = br.requester_id
       JOIN users d ON d.id = $2
       WHERE br.id = $1`,
      [req.params.id, req.user.id]
    ).then(({ rows }) => {
      const r = rows[0];
      if (r) {
        sendDonorAcceptedEmail({
          toEmail: r.requester_email,
          toName: r.requester_name,
          donorName: r.donor_name,
          donorPhone: r.donor_phone,
          bloodType: r.blood_type,
          donationType: r.donation_type || "blood",
          units: r.units_needed,
          hospital: r.hospital,
        });
      }
    }).catch(() => {});
  }

  res.json({ patient_name, contact_phone });
});

export default router;
