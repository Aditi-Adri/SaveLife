import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOrderConfirmationEmail } from "../utils/email.js";

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

    // Ensure table exists (safe for already-migrated DBs)
    await query(`
      CREATE TABLE IF NOT EXISTS medicine_orders (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER REFERENCES users(id),
        items          JSONB NOT NULL,
        total          NUMERIC(10,2) NOT NULL,
        address        TEXT NOT NULL,
        phone          VARCHAR(20),
        payment_method VARCHAR(50) DEFAULT 'COD',
        status         VARCHAR(30) DEFAULT 'placed',
        created_at     TIMESTAMPTZ DEFAULT now()
      )
    `);

    const { rows } = await query(
      `INSERT INTO medicine_orders (user_id, items, total, address, phone, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, JSON.stringify(items), total, address, phone || "", payment_method || "COD"]
    );
    const order = rows[0];

    // Send confirmation email (non-blocking — don't fail the request if email fails)
    try {
      const userRows = await query("SELECT name, email FROM users WHERE id = $1", [req.user.id]);
      const user = userRows.rows[0];
      if (user) {
        await sendOrderConfirmationEmail({
          toEmail: user.email,
          toName: user.name,
          order,
          items,
        });
      }
    } catch (emailErr) {
      console.warn("[pharmacy] Confirmation email failed:", emailErr.message);
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders/mine — auth required
router.get("/orders/mine", requireAuth, async (req, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS medicine_orders (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER REFERENCES users(id),
        items          JSONB NOT NULL,
        total          NUMERIC(10,2) NOT NULL,
        address        TEXT NOT NULL,
        phone          VARCHAR(20),
        payment_method VARCHAR(50) DEFAULT 'COD',
        status         VARCHAR(30) DEFAULT 'placed',
        created_at     TIMESTAMPTZ DEFAULT now()
      )
    `);
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
