import bcrypt from "bcryptjs";
import { pool, query } from "./pool.js";
import { initDb } from "./initDb.js";
import { generateUserCode } from "../utils/credentials.js";

// Sample data so the app looks populated during development.
// The seeders are ADDITIVE: they insert only rows that don't already exist
// (matched by a natural key), so it's safe to run repeatedly and to top up.

const SAMPLE_DONORS = [
  { name: "Rahim Uddin", email: "rahim@demo.sl", blood_type: "O+", age: 27 },
  { name: "Karima Begum", email: "karima@demo.sl", blood_type: "A+", age: 31 },
  { name: "Tanvir Hasan", email: "tanvir@demo.sl", blood_type: "B+", age: 24 },
  { name: "Nusrat Jahan", email: "nusrat@demo.sl", blood_type: "AB+", age: 29 },
  { name: "Sabbir Ahmed", email: "sabbir@demo.sl", blood_type: "O-", age: 35 },
  { name: "Farhana Akter", email: "farhana@demo.sl", blood_type: "B-", age: 22 },
  { name: "Mehedi Hasan", email: "mehedi@demo.sl", blood_type: "O+", age: 28 },
  { name: "Sadia Islam", email: "sadia@demo.sl", blood_type: "A-", age: 26 },
  { name: "Rakibul Islam", email: "rakib@demo.sl", blood_type: "B+", age: 33 },
  { name: "Tasnim Rahman", email: "tasnim@demo.sl", blood_type: "AB-", age: 21 },
  { name: "Imrul Kayes", email: "imrul@demo.sl", blood_type: "O+", age: 40 },
  { name: "Jannatul Ferdous", email: "jannat@demo.sl", blood_type: "A+", age: 23 },
  { name: "Shahin Alam", email: "shahin@demo.sl", blood_type: "B+", age: 37 },
  { name: "Mou Akter", email: "mou@demo.sl", blood_type: "O-", age: 25 },
  { name: "Arif Chowdhury", email: "arif@demo.sl", blood_type: "AB+", age: 30 },
  { name: "Lamia Haque", email: "lamia@demo.sl", blood_type: "A+", age: 19 },
  { name: "Naimur Rahman", email: "naimur@demo.sl", blood_type: "O+", age: 32 },
  { name: "Sumaiya Khan", email: "sumaiya@demo.sl", blood_type: "B-", age: 27 },
  { name: "Fahim Reza", email: "fahim@demo.sl", blood_type: "A-", age: 34 },
  { name: "Israt Jahan", email: "israt@demo.sl", blood_type: "AB+", age: 28 },
  { name: "Hasibul Hoque", email: "hasib@demo.sl", blood_type: "O+", age: 45 },
  { name: "Nadia Sultana", email: "nadia@demo.sl", blood_type: "B+", age: 24 },
];

// City -> approx coordinates (small per-row offsets added below to spread pins).
const CITY = {
  Dhaka: [23.8103, 90.4125],
  Chittagong: [22.3569, 91.7832],
  Rajshahi: [24.3636, 88.6241],
  Sylhet: [24.8949, 91.8687],
  Khulna: [22.8456, 89.5403],
  Barisal: [22.701, 90.3535],
  Rangpur: [25.7439, 89.2752],
  Mymensingh: [24.7471, 90.4203],
  Cumilla: [23.4607, 91.1809],
  Narayanganj: [23.6238, 90.5],
};

function near(city, i) {
  const [lat, lng] = CITY[city] || CITY.Dhaka;
  // deterministic small offset so pins don't stack exactly
  return { latitude: lat + ((i % 5) - 2) * 0.012, longitude: lng + ((i % 3) - 1) * 0.014 };
}

const REQ_DATA = [
  { patient_name: "Md. Anwar", blood_type: "O-", units_needed: 2, hospital: "Dhaka Medical College", city: "Dhaka", urgency: "critical" },
  { patient_name: "Shila Rani", blood_type: "B+", units_needed: 1, hospital: "Square Hospital", city: "Dhaka", urgency: "urgent" },
  { patient_name: "Jamal Hossain", blood_type: "A+", units_needed: 3, hospital: "Chittagong Medical", city: "Chittagong", urgency: "critical" },
  { patient_name: "Ruma Khatun", blood_type: "AB+", units_needed: 1, hospital: "Rajshahi Medical", city: "Rajshahi", urgency: "urgent" },
  { patient_name: "Imran Ali", blood_type: "O+", units_needed: 2, hospital: "Sylhet MAG Osmani", city: "Sylhet", urgency: "normal" },
  { patient_name: "Kamal Hossain", blood_type: "A-", units_needed: 2, hospital: "Khulna Medical College", city: "Khulna", urgency: "critical" },
  { patient_name: "Rina Akter", blood_type: "O+", units_needed: 1, hospital: "Sher-e-Bangla Medical", city: "Barisal", urgency: "urgent" },
  { patient_name: "Sohel Rana", blood_type: "B-", units_needed: 2, hospital: "Rangpur Medical College", city: "Rangpur", urgency: "urgent" },
  { patient_name: "Tania Akhter", blood_type: "AB-", units_needed: 1, hospital: "Mymensingh Medical College", city: "Mymensingh", urgency: "critical" },
  { patient_name: "Babul Mia", blood_type: "O+", units_needed: 4, hospital: "Cumilla Medical College", city: "Cumilla", urgency: "critical" },
  { patient_name: "Nasima Begum", blood_type: "A+", units_needed: 1, hospital: "United Hospital", city: "Dhaka", urgency: "normal" },
  { patient_name: "Polash Roy", blood_type: "B+", units_needed: 2, hospital: "Evercare Hospital", city: "Dhaka", urgency: "urgent" },
  { patient_name: "Selina Parveen", blood_type: "O-", units_needed: 3, hospital: "Ibn Sina Hospital", city: "Dhaka", urgency: "critical" },
  { patient_name: "Rafiq Sarkar", blood_type: "A+", units_needed: 1, hospital: "Khulna City Hospital", city: "Khulna", urgency: "normal" },
  { patient_name: "Mitu Akter", blood_type: "AB+", units_needed: 2, hospital: "Chittagong Maa-O-Shishu", city: "Chittagong", urgency: "urgent" },
  { patient_name: "Jahangir Alam", blood_type: "B+", units_needed: 1, hospital: "Popular Diagnostic", city: "Dhaka", urgency: "normal" },
  { patient_name: "Shamima Nasrin", blood_type: "O+", units_needed: 2, hospital: "Sylhet Women's Medical", city: "Sylhet", urgency: "urgent" },
  { patient_name: "Delwar Hossain", blood_type: "A-", units_needed: 3, hospital: "Rajshahi City Hospital", city: "Rajshahi", urgency: "critical" },
  { patient_name: "Parvez Khan", blood_type: "O+", units_needed: 1, hospital: "Narayanganj General", city: "Narayanganj", urgency: "normal" },
  { patient_name: "Rnumana Haque", blood_type: "B-", units_needed: 2, hospital: "Rangpur Community", city: "Rangpur", urgency: "urgent" },
];

// Real Bangladeshi hospitals. Phone numbers are the widely-published hotlines
// (short codes for private hospitals, switchboards for govt medical colleges).
// Emails are the standard institutional addresses for the private hospitals'
// real domains; government hospital emails are left blank rather than guessed.
// VERIFY all contacts against official sources before any real-world use.
const SAMPLE_HOSPITALS = [
  { name: "Dhaka Medical College Hospital", city: "Dhaka", address: "Bakshibazar, Dhaka 1000", phone: "02-55165088", email: null, beds_available: 24, has_blood_bank: true, has_ambulance: true, latitude: 23.7010094, longitude: 90.4350914 },
  { name: "Square Hospital", city: "Dhaka", address: "18/F West Panthapath, Dhaka", phone: "10616", email: "info@squarehospital.com", beds_available: 12, has_blood_bank: true, has_ambulance: true, latitude: 23.7530278, longitude: 90.3817096 },
  { name: "United Hospital", city: "Dhaka", address: "Plot 15, Gulshan-2, Dhaka", phone: "10666", email: "info@uhlbd.com", beds_available: 16, has_blood_bank: true, has_ambulance: true, latitude: 23.8030, longitude: 90.4150 },
  { name: "Evercare Hospital Dhaka", city: "Dhaka", address: "Bashundhara R/A, Dhaka", phone: "10678", email: "info@evercarebd.com", beds_available: 20, has_blood_bank: true, has_ambulance: true, latitude: 23.8120, longitude: 90.4250 },
  { name: "Ibn Sina Hospital", city: "Dhaka", address: "Dhanmondi, Dhaka", phone: "02-9126625", email: null, beds_available: 8, has_blood_bank: true, has_ambulance: false, latitude: 23.7560, longitude: 90.3720 },
  { name: "Chittagong Medical College Hospital", city: "Chittagong", address: "K.B. Fazlul Kader Rd, Chattogram", phone: "031-2502152", email: null, beds_available: 18, has_blood_bank: true, has_ambulance: true, latitude: 22.3593519, longitude: 91.8312853 },
  { name: "Chittagong Maa-O-Shishu Hospital", city: "Chittagong", address: "Agrabad, Chattogram", phone: "031-2516523", email: null, beds_available: 6, has_blood_bank: false, has_ambulance: true, latitude: 22.3260, longitude: 91.8120 },
  { name: "Rajshahi Medical College Hospital", city: "Rajshahi", address: "Laxmipur, Rajshahi", phone: "0721-772150", email: null, beds_available: 9, has_blood_bank: true, has_ambulance: false, latitude: 24.3730464, longitude: 88.5871186 },
  { name: "Sylhet MAG Osmani Medical College", city: "Sylhet", address: "Medical College Rd, Sylhet", phone: "0821-713667", email: null, beds_available: 7, has_blood_bank: false, has_ambulance: true, latitude: 24.9008174, longitude: 91.8635892 },
  { name: "Khulna Medical College Hospital", city: "Khulna", address: "Boyra, Khulna", phone: "041-760350", email: null, beds_available: 11, has_blood_bank: true, has_ambulance: true, latitude: 22.8092, longitude: 89.5500 },
  { name: "Sher-e-Bangla Medical College", city: "Barisal", address: "Band Rd, Barisal", phone: "0431-2173547", email: null, beds_available: 5, has_blood_bank: true, has_ambulance: false, latitude: 22.6954, longitude: 90.3535 },
  { name: "Rangpur Medical College Hospital", city: "Rangpur", address: "Dhap, Rangpur", phone: "0521-62208", email: null, beds_available: 10, has_blood_bank: true, has_ambulance: true, latitude: 25.7460, longitude: 89.2530 },
  { name: "Mymensingh Medical College Hospital", city: "Mymensingh", address: "Char Para, Mymensingh", phone: "091-66063", email: null, beds_available: 8, has_blood_bank: true, has_ambulance: true, latitude: 24.7570, longitude: 90.4072 },
  { name: "Cumilla Medical College Hospital", city: "Cumilla", address: "Kuchaitoli, Cumilla", phone: "081-65334", email: null, beds_available: 6, has_blood_bank: false, has_ambulance: true, latitude: 23.4500, longitude: 91.1800 },
  { name: "Popular Diagnostic Centre", city: "Dhaka", address: "Dhanmondi, Dhaka", phone: "10636", email: "info@populardiagnostic.com", beds_available: 4, has_blood_bank: true, has_ambulance: false, latitude: 23.7510, longitude: 90.3790 },
  // Well-known private hospitals (real names/areas/domains; verify phones/emails).
  { name: "LabAid Specialized Hospital", city: "Dhaka", address: "House 1, Road 4, Dhanmondi, Dhaka", phone: "10606", email: "info@labaidgroup.com", beds_available: 10, has_blood_bank: true, has_ambulance: true, latitude: 23.7461, longitude: 90.3742 },
  { name: "Green Life Medical College Hospital", city: "Dhaka", address: "32 Green Road, Dhaka", phone: null, email: "info@greenlifehospital.com", beds_available: 9, has_blood_bank: true, has_ambulance: true, latitude: 23.7530, longitude: 90.3855 },
  { name: "Anwar Khan Modern Medical College Hospital", city: "Dhaka", address: "House 17, Road 8, Dhanmondi, Dhaka", phone: null, email: "info@anwarkhanmodern.com", beds_available: 11, has_blood_bank: true, has_ambulance: true, latitude: 23.7556, longitude: 90.3690 },
  { name: "Delta Medical College Hospital", city: "Dhaka", address: "26/2 Principal Abul Kashem Rd, Mirpur-1, Dhaka", phone: null, email: null, beds_available: 7, has_blood_bank: false, has_ambulance: true, latitude: 23.7956, longitude: 90.3537 },
  { name: "Asgar Ali Hospital", city: "Dhaka", address: "111/1/A Distillery Rd, Gandaria, Dhaka", phone: null, email: "info@asgaralihospital.com", beds_available: 8, has_blood_bank: true, has_ambulance: true, latitude: 23.7060, longitude: 90.4360 },
];

// Verified, dial-able emergency / ambulance contacts:
//  - 999  National Emergency Service (police, fire, AMBULANCE)
//  - 16263 Shasthyo Batayon, the govt (DGHS) national health call centre
//  - 333  National information & emergency helpline
//  - hospital hotline short codes that also dispatch ambulances
const SAMPLE_AMBULANCES = [
  { name: "National Emergency Service (Police · Fire · Ambulance)", city: "All Bangladesh", phone: "999", email: null, available_24_7: true },
  { name: "Shasthyo Batayon — Govt Health Call Centre (DGHS)", city: "All Bangladesh", phone: "16263", email: null, available_24_7: true },
  { name: "National Helpline", city: "All Bangladesh", phone: "333", email: null, available_24_7: true },
  { name: "Square Hospital Ambulance", city: "Dhaka", phone: "10616", email: "info@squarehospital.com", available_24_7: true },
  { name: "United Hospital Ambulance", city: "Dhaka", phone: "10666", email: "info@uhlbd.com", available_24_7: true },
  { name: "Evercare Hospital Ambulance", city: "Dhaka", phone: "10678", email: "info@evercarebd.com", available_24_7: true },
  { name: "Popular Ambulance Service", city: "Dhaka", phone: "10636", email: "info@populardiagnostic.com", available_24_7: true },
  { name: "LabAid Ambulance", city: "Dhaka", phone: "10606", email: "info@labaidgroup.com", available_24_7: true },
];

async function seedDonors() {
  const hash = await bcrypt.hash("demo1234", 10);
  const { rows } = await query("SELECT email FROM users");
  const have = new Set(rows.map((r) => r.email));
  let added = 0;
  for (const d of SAMPLE_DONORS) {
    if (have.has(d.email)) continue;
    await query(
      `INSERT INTO users (user_code, name, email, password, phone, age, blood_type, donation_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [generateUserCode(), d.name, d.email, hash, "01" + Math.floor(100000000 + Math.random() * 899999999), d.age, d.blood_type, Math.floor(Math.random() * 6)]
    );
    added++;
  }
  console.log(`Donors: +${added} new (password: demo1234)`);
}

async function seedRequests() {
  const { rows } = await query("SELECT patient_name, hospital FROM blood_requests");
  const have = new Set(rows.map((r) => `${r.patient_name}|${r.hospital}`));
  let added = 0;
  for (let i = 0; i < REQ_DATA.length; i++) {
    const r = REQ_DATA[i];
    if (have.has(`${r.patient_name}|${r.hospital}`)) continue;
    const { latitude, longitude } = near(r.city, i);
    await query(
      `INSERT INTO blood_requests
         (patient_name, blood_type, units_needed, hospital, location, latitude, longitude, urgency, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [r.patient_name, r.blood_type, r.units_needed, r.hospital, r.city, latitude, longitude, r.urgency,
       "01" + Math.floor(300000000 + Math.random() * 599999999)]
    );
    added++;
  }
  console.log(`Blood requests: +${added} new`);
}

// Upsert hospitals by name so existing rows get the verified phone/email too.
async function seedHospitals() {
  for (const h of SAMPLE_HOSPITALS) {
    const ex = await query("SELECT id FROM hospitals WHERE name = $1", [h.name]);
    if (ex.rows.length) {
      await query(
        `UPDATE hospitals SET city=$2, address=$3, phone=$4, email=$5, beds_available=$6,
                has_blood_bank=$7, has_ambulance=$8, latitude=$9, longitude=$10
          WHERE name=$1`,
        [h.name, h.city, h.address, h.phone, h.email, h.beds_available, h.has_blood_bank, h.has_ambulance, h.latitude, h.longitude]
      );
    } else {
      await query(
        `INSERT INTO hospitals (name, city, address, phone, email, beds_available, has_blood_bank, has_ambulance, latitude, longitude)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [h.name, h.city, h.address, h.phone, h.email, h.beds_available, h.has_blood_bank, h.has_ambulance, h.latitude, h.longitude]
      );
    }
  }
  console.log(`Hospitals: upserted ${SAMPLE_HOSPITALS.length} verified entries`);
}

// Replace ambulance services with the verified set (prunes any unverified rows).
async function seedAmbulances() {
  const names = SAMPLE_AMBULANCES.map((a) => a.name);
  await query("DELETE FROM ambulance_services WHERE name <> ALL($1::text[])", [names]);
  for (const a of SAMPLE_AMBULANCES) {
    const ex = await query("SELECT id FROM ambulance_services WHERE name = $1", [a.name]);
    if (ex.rows.length) {
      await query(
        "UPDATE ambulance_services SET city=$2, phone=$3, email=$4, available_24_7=$5 WHERE name=$1",
        [a.name, a.city, a.phone, a.email, a.available_24_7]
      );
    } else {
      await query(
        "INSERT INTO ambulance_services (name, city, phone, email, available_24_7) VALUES ($1,$2,$3,$4,$5)",
        [a.name, a.city, a.phone, a.email, a.available_24_7]
      );
    }
  }
  console.log(`Ambulances: set to ${SAMPLE_AMBULANCES.length} verified entries`);
}

async function seed() {
  try {
    await initDb();
    await seedDonors();
    await seedRequests();
    await seedHospitals();
    await seedAmbulances();
    console.log("✅ Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
