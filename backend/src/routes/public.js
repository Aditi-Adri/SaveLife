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
              latitude, longitude, urgency, created_at
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

// GET /api/public/hospitals — browsable hospital list.
router.get("/hospitals", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, city, address, phone, email, beds_available, has_blood_bank,
              has_ambulance, latitude, longitude
         FROM hospitals
        ORDER BY city, name`
    );
    res.json({ hospitals: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load hospitals" });
  }
});

// GET /api/public/ambulances — emergency ambulance services (public for emergencies).
router.get("/ambulances", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, city, phone, email, available_24_7
         FROM ambulance_services
        ORDER BY (phone = '999') DESC, city, name`
    );
    res.json({ ambulances: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ambulances" });
  }
});

export default router;
