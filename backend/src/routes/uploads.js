import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(path.join(UPLOAD_DIR, "avatars"), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "documents"), { recursive: true });

function diskStorage(sub) {
  return multer.diskStorage({
    destination: path.join(UPLOAD_DIR, sub),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || "";
      cb(null, `${req.user.id}_${Date.now()}${ext}`);
    },
  });
}

const avatarUpload = multer({
  storage: diskStorage("avatars"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const docUpload = multer({
  storage: diskStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ok.includes(file.mimetype)) {
      return cb(new Error("Only images (JPG/PNG/WebP) and PDF files are allowed"));
    }
    cb(null, true);
  },
});

function multerError(err, req, res, next) {
  if (err) return res.status(400).json({ error: err.message });
  next();
}

const router = Router();

// POST /api/uploads/avatar — replace profile picture
router.post(
  "/avatar",
  requireAuth,
  (req, res, next) => avatarUpload.single("avatar")(req, res, (err) => multerError(err, req, res, next)),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file received" });
    const url = `/uploads/avatars/${req.file.filename}`;
    try {
      await query("UPDATE users SET avatar_url = $1 WHERE id = $2", [url, req.user.id]);
      res.json({ avatar_url: url });
    } catch (err) {
      res.status(500).json({ error: "Failed to save avatar" });
    }
  }
);

// POST /api/uploads/document — upload a certificate or document
router.post(
  "/document",
  requireAuth,
  (req, res, next) => docUpload.single("document")(req, res, (err) => multerError(err, req, res, next)),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file received" });
    const { doc_type = "other" } = req.body;
    const validTypes = ["certificate", "medical", "identity", "other"];
    const safeType = validTypes.includes(doc_type) ? doc_type : "other";
    const url = `/uploads/documents/${req.file.filename}`;
    try {
      const { rows } = await query(
        `INSERT INTO user_documents (user_id, doc_type, file_name, file_path)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, safeType, req.file.originalname, url]
      );
      res.status(201).json({ document: rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to save document record" });
    }
  }
);

// GET /api/uploads/documents — list current user's documents
router.get("/documents", requireAuth, async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM user_documents WHERE user_id = $1 ORDER BY uploaded_at DESC",
    [req.user.id]
  );
  res.json({ documents: rows });
});

// DELETE /api/uploads/documents/:id — delete a document
router.delete("/documents/:id", requireAuth, async (req, res) => {
  const { rows } = await query(
    "DELETE FROM user_documents WHERE id = $1 AND user_id = $2 RETURNING *",
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Document not found" });
  const filePath = path.join(UPLOAD_DIR, rows[0].file_path.replace("/uploads/", ""));
  fs.unlink(filePath, () => {});
  res.json({ ok: true });
});

export default router;
