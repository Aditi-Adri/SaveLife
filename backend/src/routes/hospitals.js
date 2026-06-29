import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { sendHospitalBookingEmail } from "../utils/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, "../../uploads/booking-docs");
fs.mkdirSync(docsDir, { recursive: true });

const docStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, docsDir),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const ok = /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only PDF/image files allowed"), ok);
  },
});

const router = Router();
router.use(requireAuth);

// POST /api/hospitals — register a new hospital (any logged-in user)
router.post("/", async (req, res) => {
  const {
    name, city, address, phone, email,
    hospital_type, beds_available,
    has_blood_bank, has_ambulance,
    latitude, longitude, consultation_fee,
  } = req.body || {};

  if (!name?.trim()) return res.status(400).json({ error: "Hospital name is required" });
  if (!city?.trim()) return res.status(400).json({ error: "City is required" });

  try {
    const result = await query(
      `INSERT INTO hospitals
         (name, city, address, phone, email, hospital_type,
          beds_available, has_blood_bank, has_ambulance,
          latitude, longitude, consultation_fee)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        name.trim(), city.trim(), address || null, phone || null, email || null,
        hospital_type === "private" ? "private" : "public",
        parseInt(beds_available, 10) || 0,
        Boolean(has_blood_bank), Boolean(has_ambulance),
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        parseInt(consultation_fee, 10) || 0,
      ]
    );
    res.status(201).json({ hospital: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register hospital" });
  }
});

// GET /api/hospitals/bookings — logged-in user's booking history
router.get("/bookings", async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.patient_name, b.patient_age, b.patient_gender,
              b.patient_nid, b.contact_phone,
              b.admission_type, b.ward_type, b.booking_date, b.expected_days,
              b.reason, b.symptoms, b.referred_doctor,
              b.emergency_contact_name, b.emergency_contact_phone, b.emergency_contact_rel,
              b.insurance_provider, b.insurance_number,
              b.advance_paid, b.advance_amount, b.payment_method, b.payment_ref,
              b.special_requirements, b.status, b.created_at,
              h.name AS hospital_name, h.city AS hospital_city,
              h.address AS hospital_address, h.phone AS hospital_phone, h.hospital_type
         FROM hospital_bookings b
         JOIN hospitals h ON h.id = b.hospital_id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// GET /api/hospitals/bookings/:id/documents
router.get("/bookings/:id/documents", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, file_name, file_path, doc_label, uploaded_at
         FROM booking_documents
        WHERE booking_id = $1 AND user_id = $2
        ORDER BY uploaded_at`,
      [req.params.id, req.user.id]
    );
    res.json({ documents: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load documents" });
  }
});

// POST /api/hospitals/bookings/:id/documents — upload medical docs for a booking
router.post("/bookings/:id/documents", docUpload.array("docs", 10), async (req, res) => {
  try {
    const booking = await query(
      "SELECT id FROM hospital_bookings WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!booking.rows[0]) return res.status(403).json({ error: "Not your booking" });

    if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });

    const inserted = [];
    for (const f of req.files) {
      const r = await query(
        `INSERT INTO booking_documents (booking_id, user_id, file_name, file_path, doc_label)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, file_name, doc_label`,
        [req.params.id, req.user.id, f.originalname, `/uploads/booking-docs/${f.filename}`, req.body.doc_label || "medical"]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json({ documents: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/hospitals/:id/book — create a full booking
router.post("/:id/book", async (req, res) => {
  const {
    // patient
    patient_name, patient_age, patient_gender, patient_nid, contact_phone,
    // admission
    admission_type, ward_type, booking_date, expected_days,
    reason, symptoms, referred_doctor,
    // emergency contact
    emergency_contact_name, emergency_contact_phone, emergency_contact_rel,
    // insurance
    insurance_provider, insurance_number,
    special_requirements,
    // payment
    advance_paid, advance_amount, payment_method, payment_ref,
  } = req.body || {};

  if (!patient_name?.trim()) {
    return res.status(400).json({ error: "Patient name is required" });
  }

  try {
    const hResult = await query(
      "SELECT id, name, hospital_type FROM hospitals WHERE id = $1",
      [req.params.id]
    );
    if (!hResult.rows[0]) return res.status(404).json({ error: "Hospital not found" });

    const hospital = hResult.rows[0];

    // Private hospitals must have advance payment confirmed
    if (hospital.hospital_type === "private" && !advance_paid) {
      return res.status(402).json({ error: "Advance payment required for private hospitals" });
    }

    const result = await query(
      `INSERT INTO hospital_bookings (
        user_id, hospital_id,
        patient_name, patient_age, patient_gender, patient_nid, contact_phone,
        admission_type, ward_type, booking_date, expected_days,
        reason, symptoms, referred_doctor,
        emergency_contact_name, emergency_contact_phone, emergency_contact_rel,
        insurance_provider, insurance_number,
        special_requirements,
        advance_paid, advance_amount, payment_method, payment_ref,
        status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
        $25
      ) RETURNING *`,
      [
        req.user.id, req.params.id,
        patient_name.trim(),
        patient_age  ? parseInt(patient_age, 10)  : null,
        patient_gender || null,
        patient_nid || null,
        contact_phone || null,
        admission_type || "planned",
        ward_type || "general",
        booking_date || null,
        parseInt(expected_days, 10) || 1,
        reason || null,
        symptoms || null,
        referred_doctor || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        emergency_contact_rel || null,
        insurance_provider || null,
        insurance_number || null,
        special_requirements || null,
        Boolean(advance_paid),
        advance_amount ? parseFloat(advance_amount) : 0,
        payment_method || null,
        payment_ref || null,
        hospital.hospital_type === "private" && advance_paid ? "confirmed" : "pending",
      ]
    );

    const booking = result.rows[0];

    // Send confirmation email to the booker
    query("SELECT name, email FROM users WHERE id = $1", [req.user.id])
      .then(({ rows: uRows }) => {
        const u = uRows[0];
        if (u) {
          sendHospitalBookingEmail({
            toEmail: u.email,
            toName: u.name,
            booking,
            hospitalName: hospital.name,
          }).catch(() => {});
        }
      })
      .catch(() => {});

    res.status(201).json({
      booking: { ...booking, hospital_name: hospital.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
});

export default router;
