import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { sendTestBookingEmail } from "../utils/email.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, "../../uploads/reports");
fs.mkdirSync(REPORT_DIR, { recursive: true });

function diskStorage() {
  return multer.diskStorage({
    destination: REPORT_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || "";
      cb(null, `${req.user.id}_${Date.now()}${ext}`);
    },
  });
}

const reportUpload = multer({
  storage: diskStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(ok.includes(file.mimetype) ? null : new Error("Only PDF/JPG/PNG/WebP files are allowed"), ok.includes(file.mimetype));
  },
});

function refCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "TBK-";
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

// POST /api/tests/book
router.post("/book", requireAuth, async (req, res) => {
  const {
    test_id, test_name, center_id, center_name, center_area, center_address, center_phone,
    scheduled_date, scheduled_time, patient_name, patient_age, patient_phone, notes,
  } = req.body || {};

  if (!test_id || !test_name || !center_id || !center_name || !scheduled_date || !scheduled_time)
    return res.status(400).json({ error: "Missing required booking fields." });

  if (new Date(scheduled_date) < new Date(new Date().toDateString()))
    return res.status(400).json({ error: "Scheduled date must be today or in the future." });

  let ref;
  for (let i = 0; i < 5; i++) {
    ref = refCode();
    const { rows } = await query("SELECT 1 FROM test_bookings WHERE booking_ref=$1", [ref]);
    if (!rows.length) break;
  }

  const { rows } = await query(
    `INSERT INTO test_bookings
       (user_id, booking_ref, test_id, test_name, center_id, center_name, center_area,
        center_address, center_phone, scheduled_date, scheduled_time,
        patient_name, patient_age, patient_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      req.user.id, ref, test_id, test_name, center_id, center_name, center_area,
      center_address || null, center_phone || null, scheduled_date, scheduled_time,
      patient_name || null, patient_age ? parseInt(patient_age) : null,
      patient_phone || null, notes || null,
    ]
  );

  const booking = rows[0];

  const { rows: uRows } = await query("SELECT name, email FROM users WHERE id=$1", [req.user.id]);
  sendTestBookingEmail({ toEmail: uRows[0].email, toName: uRows[0].name, booking })
    .catch(e => console.warn("[test-booking] email failed:", e.message));

  res.status(201).json({ booking });
});

// GET /api/tests/my-bookings
router.get("/my-bookings", requireAuth, async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM test_bookings WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ bookings: rows });
});

// POST /api/tests/bookings/:id/report — upload PDF/image report
router.post("/bookings/:id/report", requireAuth, (req, res, next) => {
  reportUpload.single("report")(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const { rows: existing } = await query(
    "SELECT id FROM test_bookings WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  if (!existing.length) return res.status(404).json({ error: "Booking not found." });
  if (!req.file)        return res.status(400).json({ error: "No file uploaded." });

  const reportUrl  = `/uploads/reports/${req.file.filename}`;
  const reportName = req.file.originalname;

  const { rows } = await query(
    `UPDATE test_bookings
        SET report_url=$1, report_name=$2, status='completed'
      WHERE id=$3 AND user_id=$4
      RETURNING *`,
    [reportUrl, reportName, req.params.id, req.user.id]
  );
  res.json({ booking: rows[0] });
});

export default router;
