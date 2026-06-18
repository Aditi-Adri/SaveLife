import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

// Authenticated actions on blood requests. Contact details are only revealed
// to logged-in users who choose to donate / request.
const router = Router();
router.use(requireAuth);

// GET /api/requests/:id/contact — reveal the requester's phone (login required).
router.get("/:id/contact", async (req, res) => {
  const result = await query(
    "SELECT patient_name, contact_phone FROM blood_requests WHERE id = $1 AND status = 'open'",
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Request not found" });
  }
  res.json(result.rows[0]);
});

export default router;
