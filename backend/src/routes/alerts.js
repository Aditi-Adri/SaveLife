import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth, requireResponder } from "../middleware/auth.js";
import { sendSOSNotificationEmail, sendSOSContactEmail } from "../utils/email.js";

const router = Router();
router.use(requireAuth);

const VALID_TYPES = ["medical", "accident", "fire", "crime", "other"];

// POST /api/alerts — raise an SOS
router.post("/", async (req, res) => {
  const { type, latitude, longitude, message } = req.body || {};
  const safeType = VALID_TYPES.includes(type) ? type : "other";

  const result = await query(
    `INSERT INTO alerts (user_id, type, latitude, longitude, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, safeType, latitude ?? null, longitude ?? null, message || null]
  );
  const alert = result.rows[0];

  // Fire-and-forget: email the user confirming their SOS was logged
  const mapsUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;
  query("SELECT name, email, phone FROM users WHERE id = $1", [req.user.id])
    .then(async ({ rows: uRows }) => {
      const u = uRows[0];
      if (!u) return;
      const { rows: contacts } = await query(
        "SELECT name, phone, email, relationship FROM emergency_contacts WHERE user_id = $1",
        [req.user.id]
      );

      // 1. Email the user themselves — confirmation + their contacts listed
      await sendSOSNotificationEmail({
        toEmail: u.email,
        toName: u.name,
        location: { latitude, longitude },
        mapsUrl,
        contacts,
      }).catch(() => {});

      // 2. Email each contact that has an email address
      for (const c of contacts) {
        if (c.email) {
          await sendSOSContactEmail({
            toEmail: c.email,
            toName: c.name,
            fromName: u.name,
            fromPhone: u.phone || "—",
            fromEmail: u.email,
            location: { latitude, longitude },
            mapsUrl,
          }).catch(() => {});
        }
      }
    })
    .catch(e => console.warn("[alerts] SOS email failed:", e.message));

  res.status(201).json({ alert });
});

// GET /api/alerts/mine — the current user's own alerts
router.get("/mine", async (req, res) => {
  const result = await query(
    `SELECT a.*, r.name AS responder_name, r.phone AS responder_phone
       FROM alerts a
       LEFT JOIN users r ON r.id = a.responder_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC`,
    [req.user.id]
  );
  res.json({ alerts: result.rows });
});

// GET /api/alerts/active — responders see open alerts with requester details
router.get("/active", requireResponder, async (req, res) => {
  const result = await query(
    `SELECT a.*, u.name AS requester_name, u.phone AS requester_phone,
            u.blood_type AS requester_blood_type
       FROM alerts a
       JOIN users u ON u.id = a.user_id
      WHERE a.status IN ('active', 'responded')
      ORDER BY a.created_at DESC`
  );
  res.json({ alerts: result.rows });
});

// Helper: update an alert's status with ownership/role rules.
async function setStatus(id, status, fields = {}) {
  const sets = ["status = $2", "updated_at = now()"];
  const params = [id, status];
  let i = 3;
  for (const [col, val] of Object.entries(fields)) {
    sets.push(`${col} = $${i++}`);
    params.push(val);
  }
  const result = await query(
    `UPDATE alerts SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

// PATCH /api/alerts/:id/respond — a responder accepts the alert
router.patch("/:id/respond", requireResponder, async (req, res) => {
  const alert = await setStatus(req.params.id, "responded", {
    responder_id: req.user.id,
  });
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json({ alert });
});

// PATCH /api/alerts/:id/resolve — responder or owner marks it resolved
router.patch("/:id/resolve", async (req, res) => {
  const existing = await query("SELECT * FROM alerts WHERE id = $1", [req.params.id]);
  const alert = existing.rows[0];
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const isOwner = alert.user_id === req.user.id;
  const isResponder = req.user.role === "responder";
  if (!isOwner && !isResponder) {
    return res.status(403).json({ error: "Not allowed" });
  }
  res.json({ alert: await setStatus(req.params.id, "resolved") });
});

// PATCH /api/alerts/:id/cancel — owner cancels their own alert
router.patch("/:id/cancel", async (req, res) => {
  const existing = await query("SELECT user_id FROM alerts WHERE id = $1", [req.params.id]);
  const alert = existing.rows[0];
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  if (alert.user_id !== req.user.id) {
    return res.status(403).json({ error: "Not allowed" });
  }
  res.json({ alert: await setStatus(req.params.id, "cancelled") });
});

export default router;
