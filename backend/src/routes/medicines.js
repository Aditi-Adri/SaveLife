import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET / — public, optional ?category=&q=&sort=
router.get("/", async (req, res) => {
  try {
    const { category, q, sort } = req.query;
    const params = [];
    let sql = "SELECT * FROM medicines WHERE 1=1";

    if (category && category !== "All") {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      const idx = params.length;
      sql += ` AND (name ILIKE $${idx} OR brand ILIKE $${idx} OR description ILIKE $${idx})`;
    }

    const sortMap = {
      featured:   "is_featured DESC, rating DESC, reviews_count DESC",
      price_asc:  "price ASC",
      price_desc: "price DESC",
      rating:     "rating DESC, reviews_count DESC",
      newest:     "id DESC",
    };
    sql += ` ORDER BY ${sortMap[sort] || sortMap.featured}`;

    const { rows } = await query(sql, params);
    res.json({ medicines: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /orders — auth required
router.post("/orders", requireAuth, async (req, res) => {
  try {
    const { items, total, address, phone, payment_method } = req.body;
    if (!items || !items.length || !total || !address) {
      return res.status(400).json({ error: "items, total and address are required" });
    }
    const { rows } = await query(
      `INSERT INTO medicine_orders (user_id, items, total, address, phone, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, JSON.stringify(items), total, address, phone || "", payment_method || "COD"]
    );
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/mine — auth required
router.get("/orders/mine", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM medicine_orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
