import { pool, query } from "./pool.js";
import { initDb } from "./initDb.js";
import { geocodeAddress, sleep } from "../utils/geocode.js";

// Backfills latitude/longitude for blood requests that don't have them yet,
// by geocoding "hospital, location, Bangladesh" via Nominatim.
// Run with: npm run db:geocode
async function run() {
  try {
    await initDb();
    const { rows } = await query(
      `SELECT id, hospital, location FROM blood_requests
        WHERE latitude IS NULL AND status = 'open'`
    );
    if (rows.length === 0) {
      console.log("Nothing to geocode — all open requests already have coordinates.");
      return;
    }
    console.log(`Geocoding ${rows.length} request(s)…`);
    for (const r of rows) {
      const address = [r.hospital, r.location, "Bangladesh"].filter(Boolean).join(", ");
      const geo = await geocodeAddress(address);
      if (geo) {
        await query("UPDATE blood_requests SET latitude = $1, longitude = $2 WHERE id = $3", [
          geo.latitude,
          geo.longitude,
          r.id,
        ]);
        console.log(`  #${r.id} ${address} -> ${geo.latitude}, ${geo.longitude}`);
      } else {
        console.log(`  #${r.id} ${address} -> not found`);
      }
      await sleep(1100); // respect Nominatim's 1 req/sec policy
    }
    console.log("✅ Geocoding complete.");
  } catch (err) {
    console.error("❌ Geocoding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
