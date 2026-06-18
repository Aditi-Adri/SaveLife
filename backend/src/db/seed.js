import bcrypt from "bcryptjs";
import { pool, query } from "./pool.js";
import { initDb } from "./initDb.js";
import { generateUserCode, generatePassword } from "../utils/credentials.js";

// Sample data so the public Explore page isn't empty during development.
// Safe to run repeatedly: it only seeds when the tables are empty.

const SAMPLE_DONORS = [
  { name: "Rahim Uddin", email: "rahim@demo.sl", blood_type: "O+", age: 27 },
  { name: "Karima Begum", email: "karima@demo.sl", blood_type: "A+", age: 31 },
  { name: "Tanvir Hasan", email: "tanvir@demo.sl", blood_type: "B+", age: 24 },
  { name: "Nusrat Jahan", email: "nusrat@demo.sl", blood_type: "AB+", age: 29 },
  { name: "Sabbir Ahmed", email: "sabbir@demo.sl", blood_type: "O-", age: 35 },
  { name: "Farhana Akter", email: "farhana@demo.sl", blood_type: "B-", age: 22 },
];

const SAMPLE_REQUESTS = [
  { patient_name: "Md. Anwar", blood_type: "O-", units_needed: 2, hospital: "Dhaka Medical College", location: "Dhaka", urgency: "critical", contact_phone: "01700000001" },
  { patient_name: "Shila Rani", blood_type: "B+", units_needed: 1, hospital: "Square Hospital", location: "Dhaka", urgency: "urgent", contact_phone: "01700000002" },
  { patient_name: "Jamal Hossain", blood_type: "A+", units_needed: 3, hospital: "Chittagong Medical", location: "Chittagong", urgency: "critical", contact_phone: "01700000003" },
  { patient_name: "Ruma Khatun", blood_type: "AB+", units_needed: 1, hospital: "Rajshahi Medical", location: "Rajshahi", urgency: "urgent", contact_phone: "01700000004" },
  { patient_name: "Imran Ali", blood_type: "O+", units_needed: 2, hospital: "Sylhet MAG Osmani", location: "Sylhet", urgency: "normal", contact_phone: "01700000005" },
];

async function seedDonors() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  if (rows[0].n > 0) {
    console.log(`Users table already has ${rows[0].n} row(s) — skipping donor seed.`);
    return;
  }
  const hash = await bcrypt.hash("demo1234", 10);
  for (const d of SAMPLE_DONORS) {
    await query(
      `INSERT INTO users (user_code, name, email, password, phone, age, blood_type, donation_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [generateUserCode(), d.name, d.email, hash, "01" + Math.floor(100000000 + Math.random() * 899999999), d.age, d.blood_type, Math.floor(Math.random() * 5)]
    );
  }
  console.log(`Seeded ${SAMPLE_DONORS.length} sample donors (password: demo1234).`);
}

async function seedRequests() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM blood_requests");
  if (rows[0].n > 0) {
    console.log(`blood_requests already has ${rows[0].n} row(s) — skipping request seed.`);
    return;
  }
  for (const r of SAMPLE_REQUESTS) {
    await query(
      `INSERT INTO blood_requests (patient_name, blood_type, units_needed, hospital, location, urgency, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.patient_name, r.blood_type, r.units_needed, r.hospital, r.location, r.urgency, r.contact_phone]
    );
  }
  console.log(`Seeded ${SAMPLE_REQUESTS.length} sample blood requests.`);
}

async function seed() {
  try {
    await initDb();
    await seedDonors();
    await seedRequests();
    console.log("✅ Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
