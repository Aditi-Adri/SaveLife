import { Router } from "express";
import { query } from "../db/pool.js";

const router = Router();

// GET /api/public/stats
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

// GET /api/public/requests — filterable list of open blood requests.
// Supports: blood_type, donation_type, urgency, gender, religion, drug_free, min_age, max_age
router.get("/requests", async (req, res) => {
  try {
    const { blood_type, donation_type, urgency, gender, religion, drug_free, min_age, max_age } = req.query;
    const conds = ["br.status = 'open'"];
    const params = [];
    let i = 1;

    if (blood_type)    { conds.push(`br.blood_type = $${i++}`);    params.push(blood_type); }
    if (donation_type) { conds.push(`br.donation_type = $${i++}`); params.push(donation_type); }
    if (urgency)       { conds.push(`br.urgency = $${i++}`);        params.push(urgency); }
    if (gender)        { conds.push(`u.gender = $${i++}`);          params.push(gender); }
    if (religion)      { conds.push(`u.religion = $${i++}`);        params.push(religion); }
    if (drug_free === "true") conds.push("(u.drug_addicted = false OR u.drug_addicted IS NULL)");
    if (min_age)       { conds.push(`u.age >= $${i++}`);            params.push(parseInt(min_age, 10)); }
    if (max_age)       { conds.push(`u.age <= $${i++}`);            params.push(parseInt(max_age, 10)); }

    const sql = `
      SELECT br.id, br.requester_id, br.patient_name, br.blood_type, br.donation_type,
             br.units_needed, br.hospital, br.location, br.latitude, br.longitude,
             br.urgency, br.note, br.created_at,
             u.name  AS requester_name,
             u.age   AS requester_age,
             u.gender AS requester_gender,
             u.religion AS requester_religion,
             u.drug_addicted AS requester_drug_addicted,
             u.avatar_url AS requester_avatar
        FROM blood_requests br
        LEFT JOIN users u ON u.id = br.requester_id
       WHERE ${conds.join(" AND ")}
       ORDER BY CASE br.urgency WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END,
                br.created_at DESC
       LIMIT 60`;

    const result = await query(sql, params);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load requests" });
  }
});

// GET /api/public/donors — browse registered donors with rich filters.
// Supports: blood_type, gender, religion, drug_free, min_age, max_age, q (name/location search)
router.get("/donors", async (req, res) => {
  try {
    const { blood_type, gender, religion, drug_free, min_age, max_age, q } = req.query;
    const conds = ["1=1"];
    const params = [];
    let i = 1;

    if (blood_type) { conds.push(`u.blood_type = $${i++}`);   params.push(blood_type); }
    if (gender)     { conds.push(`u.gender = $${i++}`);        params.push(gender); }
    if (religion)   { conds.push(`u.religion = $${i++}`);      params.push(religion); }
    if (drug_free === "true") conds.push("(u.drug_addicted = false OR u.drug_addicted IS NULL)");
    if (min_age)    { conds.push(`u.age >= $${i++}`);           params.push(parseInt(min_age, 10)); }
    if (max_age)    { conds.push(`u.age <= $${i++}`);           params.push(parseInt(max_age, 10)); }
    if (q) {
      conds.push(`(u.name ILIKE $${i} OR u.location_text ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }

    const sql = `
      SELECT u.id, u.name, u.blood_type, u.age, u.gender, u.religion,
             u.drug_addicted, u.medical_conditions, u.avatar_url,
             u.donation_count, u.last_donation, u.location_text,
             u.latitude, u.longitude, u.created_at
        FROM users u
       WHERE ${conds.join(" AND ")}
       ORDER BY u.donation_count DESC NULLS LAST, u.created_at DESC
       LIMIT 60`;

    const result = await query(sql, params);
    res.json({ donors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load donors" });
  }
});

// GET /api/public/profile/:id — public (non-sensitive) profile of any user.
router.get("/profile/:id", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, blood_type, age, gender, religion,
              drug_addicted, medical_conditions, avatar_url,
              donation_count, last_donation, donation_history,
              location_text, latitude, longitude, created_at
         FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// GET /api/public/hospitals
router.get("/hospitals", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, city, address, phone, email, beds_available, has_blood_bank,
              has_ambulance, latitude, longitude
         FROM hospitals ORDER BY city, name`
    );
    res.json({ hospitals: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load hospitals" });
  }
});

// GET /api/public/ambulances
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
