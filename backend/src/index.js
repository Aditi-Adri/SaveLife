import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import contactRoutes from "./routes/contacts.js";
import alertRoutes from "./routes/alerts.js";
import publicRoutes from "./routes/public.js";
import requestRoutes from "./routes/requests.js";
import hospitalRoutes from "./routes/hospitals.js";
import uploadRoutes from "./routes/uploads.js";
import { initDb } from "./db/initDb.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SaveLife API", time: new Date().toISOString() });
});

// Serve uploaded files (avatars, documents) as static assets.
const uploadsDir = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

app.use("/api/public", publicRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/uploads", uploadRoutes);

// Unknown API routes -> JSON 404
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// In production, serve the built React app and let it handle client-side routes.
if (isProd) {
  const distPath = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
}

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await initDb();
    console.log("✅ Database schema ready.");
  } catch (err) {
    console.error("⚠️  Could not initialise database:", err.message);
    // Keep serving — the API will surface DB errors per-request.
  }
  app.listen(PORT, () => {
    console.log(`🚀 SaveLife API listening on http://localhost:${PORT}`);
  });
}

start();
