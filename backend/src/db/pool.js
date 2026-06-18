import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Render's managed Postgres (and most hosted providers) require SSL.
// Locally we connect without it. Toggle with PGSSL=true in the environment.
const useSSL =
  process.env.PGSSL === "true" ||
  (process.env.DATABASE_URL || "").includes("render.com");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

// Small helper so route files can run queries without touching the pool directly.
export const query = (text, params) => pool.query(text, params);
