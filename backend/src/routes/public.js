import { Router } from "express";
import { query } from "../db/pool.js";

// Public, read-only endpoints for the Explore page. No authentication.
const router = Router();

// GET /api/public/stats — headline numbers for the Explore page.
router.get("/stats", async (req, res) => {
  try {
    const [donors, openReqs, critical, units] = await Promise.all([
      query("SELECT COUNT(*)::int AS n FROM users"),
      query("SELECT COUNT(*)::int AS n FROM blood_requests WHERE status = 'open'"),
      query("SELECT COUNT(*)::int AS n FROM blood_requests WHERE status = 'open' AND urgency = 'critical'"),
      query("SELECT COALESCE(SUM(units_needed),0)::int AS n FROM blood_requests WHERE status = 'open'"),
    ]);
    res.json({
      donors: donors.rows[0].n,
      openRequests: openReqs.rows[0].n,
      criticalRequests: critical.rows[0].n,
      unitsNeeded: units.rows[0].n,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// GET /api/public/requests — open blood requests (read-only, contact details hidden).
router.get("/requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, patient_name, blood_type, units_needed, hospital, location,
              urgency, created_at
         FROM blood_requests
        WHERE status = 'open'
        ORDER BY CASE urgency WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END,
                 created_at DESC
        LIMIT 30`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

export default router;
