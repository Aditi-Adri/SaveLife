import { pool } from "./pool.js";
import { initDb } from "./initDb.js";

try {
  await initDb();
  console.log("✅ Migration complete — tables are ready.");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
