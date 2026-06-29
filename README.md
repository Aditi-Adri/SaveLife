# 🩺 SaveLife — Bangladesh's All-in-One Health & Blood Donation Platform

> A full-stack web application connecting blood donors, hospitals, doctors, diagnostic labs and emergency responders across Bangladesh. Built to save lives through technology.

---

## 🚀 Live Features at a Glance

| Module | What it does |
|--------|-------------|
| 🩸 Blood Donation | Post & search blood/plasma/platelet requests with live map |
| 🏥 Hospital Booking | Full admission wizard with document upload & payment |
| 👨‍⚕️ Doctor Appointments | Browse specialists, book slots, get email confirmation |
| 💊 Pharmacy | Browse medicines, place home-delivery orders |
| 🚑 Ambulance Directory | Instant access to Dhaka ambulance services & numbers |
| 🔬 Medical Tests | Book 23 tests at 10 certified labs, sorted by your location |
| 🆘 Emergency SOS | One-tap SOS that emails all your emergency contacts instantly |
| 🫀 Organ Donation Pledge | Pledge organs, get a certificate, guided office visit flow |
| 🩸 Blood Guide | Interactive blood compatibility chart + educational content |
| 💡 Health Tips | 10 professional health articles with category filtering |
| 🏆 Leaderboard | Ranked donor board with 10 achievement badges |
| 📧 Email Notifications | 12 fully designed HTML email templates for every action |

---

## 🛠 Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 19 | UI component framework |
| **Vite** | 8 | Build tool & dev server |
| **Leaflet** | 1.9.4 | Interactive donor & hospital maps |
| **jsPDF** | 4.2 | Client-side donation certificate generation |
| **Pure CSS** | — | Custom CSS with CSS variables (no UI framework) |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 20 | Runtime (ES Modules) |
| **Express** | 4 | REST API framework |
| **PostgreSQL** | — | Relational database |
| **pg** | 8.12 | PostgreSQL client |
| **bcryptjs** | 2.4 | Password hashing |
| **jsonwebtoken** | 9 | JWT authentication |
| **Nodemailer** | 9 | Email via Gmail SMTP |
| **Multer** | 2 | File uploads (avatars, documents, reports) |
| **Morgan** | 1.10 | HTTP request logging |
| **dotenv** | 16 | Environment variable management |
| **Nodemon** | 3 | Dev auto-restart |

### Architecture
- **Single Page Application** with custom hash-based routing (no React Router)
- **Browser history API** — back/forward buttons work natively
- **JWT in localStorage** — stateless auth, token sent in `Authorization: Bearer` header
- **Vite proxy** — `/api` requests forwarded to Express in dev, served directly in production
- **Idempotent schema** — `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` runs on every boot, zero downtime migrations
- **Fire-and-forget emails** — all emails use `.catch()` so a failed email never blocks the API response

---

## 📁 Project Structure

```
SaveLife/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql        # Full database schema (idempotent)
│   │   │   ├── initDb.js         # Runs schema on boot
│   │   │   ├── pool.js           # PostgreSQL connection pool
│   │   │   ├── seed.js           # Sample data seeder
│   │   │   └── geocode.js        # Lat/lng geocoding utility
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT requireAuth middleware
│   │   ├── routes/
│   │   │   ├── auth.js           # Register, login, profile, organ pledge
│   │   │   ├── public.js         # Public stats, requests, hospitals, leaderboard
│   │   │   ├── requests.js       # Blood/plasma/platelet requests (CRUD)
│   │   │   ├── hospitals.js      # Hospital listing + full booking wizard
│   │   │   ├── doctors.js        # Doctor listing + appointments
│   │   │   ├── medicines.js      # Medicine catalog + orders
│   │   │   ├── alerts.js         # Emergency SOS raise/respond/resolve
│   │   │   ├── contacts.js       # Emergency contact management
│   │   │   ├── uploads.js        # Avatar + document file upload
│   │   │   └── tests.js          # Medical test bookings + report upload
│   │   ├── utils/
│   │   │   ├── email.js          # 12 HTML email templates (Nodemailer)
│   │   │   ├── credentials.js    # Auto-generate SLF-XXXXXX user codes
│   │   │   ├── geocode.js        # Location resolution helper
│   │   │   └── notify.js         # Push notification utility
│   │   └── index.js              # Express app entry point
│   ├── uploads/                  # Uploaded files (gitignored)
│   │   ├── avatars/
│   │   ├── documents/
│   │   └── reports/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root: routing, auth state, view manager
│   │   ├── Home.jsx              # Landing page
│   │   ├── Explore.jsx           # Main dashboard (donor search + map + all features)
│   │   ├── Profile.jsx           # User profile, donation history, documents, cert
│   │   ├── BloodGuide.jsx        # Blood compatibility + organ donation + pledge
│   │   ├── HealthTips.jsx        # 10 health articles with reader
│   │   ├── Hospitals.jsx         # Hospital search + multi-step booking
│   │   ├── Doctors.jsx           # Doctor directory + appointment booking
│   │   ├── Medicines.jsx         # Pharmacy catalog + cart + ordering
│   │   ├── Ambulance.jsx         # Ambulance directory
│   │   ├── MedicalTests.jsx      # 23 tests × 10 labs + booking + reports
│   │   ├── Leaderboard.jsx       # Donor rankings + badges
│   │   ├── SOS.jsx               # Floating SOS widget + active emergency screen
│   │   ├── LeafletMap.jsx        # Interactive map component
│   │   ├── ThemeToggle.jsx       # Dark / light mode toggle
│   │   ├── api.js                # All API calls (fetch wrapper + auth)
│   │   ├── badges.js             # 10 achievement badge definitions
│   │   └── main.jsx              # React entry point
│   └── package.json
```

---

## 🗃 Database Schema

### `users`
Stores every registered donor's full profile.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_code` | VARCHAR(20) | Auto-generated login ID e.g. `SLF-7K9QF2` |
| `name`, `email`, `password` | TEXT | Credentials (password is bcrypt hashed) |
| `phone` | VARCHAR(20) | 11-digit BD phone number |
| `age`, `gender`, `weight` | INT/VARCHAR/NUMERIC | Physical profile |
| `blood_type` | VARCHAR(5) | ABO+Rh e.g. `O+`, `AB-` |
| `donation_count` | INTEGER | Total donations logged |
| `last_donation` | DATE | Date of last donation |
| `donation_history` | TEXT | Free-text donation log |
| `drug_addicted`, `medical_conditions` | BOOL/TEXT | Eligibility data |
| `avatar_url` | VARCHAR | Profile photo URL |
| `religion` | VARCHAR | Optional for donor matching preferences |
| `latitude`, `longitude` | DOUBLE PRECISION | GPS location |
| `location_text` | VARCHAR | Human-readable area |
| `organ_pledge` | BOOLEAN | Has pledged organs |
| `organ_pledge_date` | TIMESTAMPTZ | When pledge was made |
| `organs_pledged` | JSONB | Array of pledged organ IDs |
| `role` | VARCHAR | `donor` or `admin` |

### `blood_requests`
Every blood/plasma/platelet/whole-blood request posted.

| Column | Description |
|--------|-------------|
| `blood_type`, `donation_type` | What is needed |
| `urgency` | `critical` / `urgent` / `normal` |
| `patient_name`, `hospital`, `location_text` | Request details |
| `latitude`, `longitude` | For map display and distance sorting |
| `status` | `open` / `fulfilled` / `cancelled` |

### `hospitals` + `hospital_bookings`
Full hospital directory with multi-step admission bookings including ward type, payment method, insurance, emergency contacts, and uploaded medical documents.

### `booking_documents`
Files (PDF/images) attached to hospital bookings.

### `doctors` + `appointments`
Doctor profiles with specialty, qualifications, consultation fee, and availability. Appointments store date, time slot, reason, and confirmation status.

### `medicines` + `medicine_orders`
Medicine catalog with type, price, brand, and availability. Orders link to a user with delivery address and line-item details.

### `ambulance_services`
Directory of ambulance services — name, area, phone, 24-hour flag.

### `emergency_contacts`
Up to 5 emergency contacts per user (name, phone, relationship, email) — all notified on SOS.

### `alerts`
SOS events — stores location, status (`active` / `responded` / `resolved` / `cancelled`), responder info.

### `test_bookings`
Medical test bookings — test name, lab/centre, date, time slot, patient info, report URL, status.

### `user_documents`
User-uploaded medical documents (X-rays, prescriptions, lab reports) stored as files.

---

## ✨ Feature Details

### 🔐 Authentication & User Management
- **Registration**: Full donor profile — name, email, password (≥ 6 chars), 11-digit phone, blood type, age, weight, gender, donation history, medical conditions, drug status
- **Auto User Code**: On registration a unique ID like `SLF-7K9QF2` is generated. Used to log in instead of email for privacy
- **Login**: Works with either the User Code or email address + password
- **JWT Tokens**: 7-day expiry, stored in `localStorage`, sent as `Authorization: Bearer` header on every protected request
- **Protected routes**: All write operations require valid JWT via `requireAuth` middleware
- **Return after login**: After logging in, the user is sent back to the exact page they came from (not always the explore page)

### 🩸 Blood Donation System
- **Post requests**: Donors in need post a request specifying blood type (O+, A-, etc.), donation type (blood / plasma / platelets / whole blood), urgency level (critical / urgent / normal), patient name, hospital, and location
- **Smart filtering**: Filter by blood type, donation type, urgency, donor gender, religion, age range, drug-free status, and keyword search
- **Live map**: All donors and requests plotted on a Leaflet map with colour-coded markers per blood type. Click a pin to see the donor's public profile
- **Distance sorting**: Donors sorted by distance from the user's GPS location
- **Contact reveal**: Click "Contact donor" (logged-in users only) to reveal phone number — this fires a push notification to the donor that someone wants their blood
- **Donor thank-you email**: When a donor responds to a request and the patient marks it fulfilled, a thank-you email is sent

### 🆘 Emergency SOS System
- **Floating SOS button**: Visible on every page of the app, positioned as a fixed bottom-right FAB
- **One-tap SOS**: Press the button → confirm → the system captures your GPS location and raises an alert
- **Email blast**: Every emergency contact you've saved instantly receives a beautifully formatted HTML email with your name, phone, location address, and a Google Maps link
- **You also get notified**: The SOS user receives their own email confirming the alert was sent and listing all contacts that were notified
- **Active emergency screen**: A full-screen overlay shows while an SOS is active, listing who was notified and offering Cancel / Resolved buttons
- **Alert log**: View your past SOS alerts and their statuses
- **Emergency contacts manager**: Add/edit/delete up to 5 contacts with name, phone, relationship, and email from the profile page

### 🏥 Hospital Booking System
- **Hospital directory**: Browse registered hospitals with type (public/private/clinic), location, available beds, consultation fee, contact details
- **Full booking wizard** (multi-step):
  1. Patient details — name, age, gender, NID number
  2. Medical info — symptoms, referred doctor
  3. Ward selection — General, Cabin, ICU, CCU, HDU, NICU, Emergency (with bed counts and pricing)
  4. Admission type — Planned / Emergency
  5. Emergency contact for the patient
  6. Insurance — provider name and policy number
  7. Special requirements (dietary, accessibility)
  8. Payment — advance payment option (bKash / Nagad / card / cash), payment reference
  9. Document upload — attach medical records, prescriptions, referral letters (PDF/images)
- **Booking confirmation email**: Sent with all admission details, ward info, what to bring, hospital address
- **My bookings**: View all past and upcoming hospital bookings with status and documents

### 👨‍⚕️ Doctor Appointments
- **Doctor directory**: Browse doctors by specialty (Cardiology, Neurology, Dermatology, Orthopedics, etc.) with qualifications, hospital affiliation, consultation fee
- **Appointment booking**: Choose date, available time slot, describe reason for visit, enter contact details
- **Confirmation email**: Doctor details, appointment date/time, location, preparation instructions

### 💊 Pharmacy / Medicine Ordering
- **Medicine catalog**: Browse medicines by type (tablet, syrup, injection, inhaler, etc.), search by name or brand
- **Cart system**: Add medicines to cart, adjust quantities
- **Checkout**: Enter delivery address, choose payment method
- **Order confirmation email**: Full itemised receipt with delivery address and estimated timeline

### 🚑 Ambulance Directory
- **Dhaka ambulance services**: List of ambulance providers across Dhaka with service area, 24/7 availability flag, contact phone number and email
- **No login required**: Accessible to all users, even without an account — critical for emergencies

### 🔬 Medical Tests Booking
- **23 diagnostic tests** across 7 categories:
  - 🩸 Blood: CBC, Fasting Blood Sugar, HbA1c, Lipid Profile, LFT, KFT, Thyroid Panel, Blood Group, Dengue NS1, Hepatitis B, Iron Studies
  - 🩻 Imaging: Chest X-Ray, Abdominal Ultrasound, MRI Brain, CT Scan
  - 🫀 Heart: ECG/EKG, 2D Echocardiogram, Treadmill Stress Test (TMT)
  - 🧪 Urine: Routine & Microscopy, Culture & Sensitivity
  - 🦠 Stool: Routine Examination
  - ⚗️ Hormones: Vitamin D, Pregnancy Test (Beta-hCG)
- **10 certified labs & hospitals**: Square Hospital, United Hospital, Labaid, Popular Diagnostic, Ibn Sina, Apollo Hospitals Dhaka, Evercare Hospital, BIRDEM, Green Life Medical, Impulse Hospital
- **Location sorting**: Browser geolocation API used to sort labs by distance from the user
- **"Advanced" filter**: MRI, CT Scan, Echo, TMT only appear at equipped centres
- **Preparation instructions**: Each test card shows fasting requirements and prep notes
- **Booking modal**: Patient name, age, phone (pre-filled from profile), date picker, time slot (30-min slots, 8AM–5:30PM), notes
- **Confirmation email**: Booking reference, test name, centre details, date/time, what to bring, preparation checklist
- **Report management**: Users can upload their PDF/image report after testing. The report is stored on the server and downloadable anytime from "My Bookings"

### 🫀 Blood Guide (Educational)
Three-tab interactive educational section:

**Tab 1 — Blood Compatibility Chart**
- Interactive grid showing which blood types can donate to / receive from which types
- "My compatibility" — users see their own blood type highlighted
- Universal donor / universal recipient info
- Colour-coded by blood type

**Tab 2 — Organ Donation**
- 10 organ cards with emoji, description, lives saved, eligibility (living donor vs post-death)
- **Organ Pledge System**:
  - Logged-out users see a clear prompt explaining the 4-step process with a Log In CTA
  - Logged-in users see a full form to select which organs they wish to donate (corneas, kidneys, heart, lungs, liver, pancreas, skin & tissue, bone marrow, blood vessels, intestines)
  - Legal consent checkbox explaining this is a digital first step
  - After submission: pledge stored in DB, confirmation email sent (purple themed) with certificate number (`ODP-SLF-XXXX`)
  - An in-app **Organ Donation Pledge Certificate** is shown with the donor's name, pledged organs as colour pills, legal framework note (Human Organ Transplantation Act 1999), SVG signature, and office visit instructions
  - **Printable certificate**: Opens a print window with fully styled, print-ready certificate
  - **Banani office visit info**: Address, phone, hours, what to bring (NID, 2 photos, printed certificate, family consent)
- **ABO compatibility for organs** table

**Tab 3 — Before You Donate Checklist**
- Eligibility requirements (age, weight, health conditions)
- Preparation steps (hydration, food, sleep, medication)
- What to expect on donation day
- Recovery and donation frequency guide

### 💡 Health Tips & Articles
- **10 full professional articles** covering:
  - When can you donate again after donation
  - What to eat before and after donating
  - What happens to your blood after donation
  - Top myths about blood donation debunked
  - Iron-rich foods for regular donors
  - How to recover quickly after donation
  - Understanding your blood test results
  - Benefits of regular blood donation for the donor
  - Dengue fever: what donors need to know
  - First-time donor guide
- **Category filter**: All / Donation Tips / Nutrition / Health Science / Recovery / Facts & Myths
- **Featured strip on Explore page**: 3 featured articles shown inline in a horizontal scroll strip
- **Full article reader**: Click any card to open the full article with reading time, author, date, and formatted body text
- **Accessible without login**: All articles readable by any visitor

### 🏆 Donor Leaderboard & Gamification
- **Public leaderboard**: Ranked by total donation count — visible to everyone without login
- **Podium top 3**: Gold / Silver / Bronze podium cards with avatar, name, blood type, donation count, and badges
- **Rank rows**: All other donors listed in rank order with their donation count and earned badges
- **10 Achievement Badges** — automatically awarded based on profile data:

| Badge | Emoji | Requirement |
|-------|-------|-------------|
| First Drop | 🩸 | 1 donation |
| Triple Donor | ⭐ | 3 donations |
| Dedicated Donor | 🏅 | 5 donations |
| Champion | 🥇 | 10 donations |
| Lifesaver | 👑 | 25 donations |
| Legend | 💎 | 50 donations |
| Universal Hero | 🦸 | O− blood type |
| Active Donor | 🔥 | Donated within 90 days |
| Full Profile | ✅ | All profile details completed |
| Veteran | 🌟 | Member for over 1 year |

- **Shareable donation certificate**: Generate and print a styled certificate showing donor name, blood type, donation count, User Code, SaveLife branding, and an SVG signature

### 👤 User Profile
- **Avatar upload**: Upload profile photo (5MB limit, images only)
- **Full profile editing**: Name, phone, age, weight, blood type, gender, religion, donation count, last donation date, donation history, drug status, medical conditions
- **Location setting**: GPS auto-detect or manual text entry of location/area
- **Document vault**: Upload personal medical documents (prescriptions, X-rays, lab reports) — stored securely, downloadable anytime
- **Donation certificate**: Generate and print certificate from Profile page
- **Emergency contacts**: Manage your SOS notification list
- **Organ pledge status**: Shows current pledge status and certificate
- **Account settings**: Email notifications preference

### 📧 Email Notification System
12 fully designed HTML email templates — all responsive, branded with the SaveLife logo and colour-coded by feature:

| Email | Trigger | Theme colour |
|-------|---------|-------------|
| Welcome | New registration | Red gradient |
| Blood Request Alert | Posted a request | Red |
| Donor Accepted | Someone contacted donor | Green |
| Donor Thank-You | Donation fulfilled | Green |
| Hospital Booking | Admission confirmed | Blue |
| Doctor Appointment | Appointment booked | Teal |
| Medicine Order | Order placed | Purple |
| SOS Alert (contacts) | SOS triggered | Red/urgent |
| SOS Notification (user) | Own SOS confirmation | Red/urgent |
| Organ Pledge Confirmation | Pledge submitted | Purple gradient |
| Medical Test Booking | Test appointment confirmed | Teal/sky blue |
| Test Email | Admin verification | Grey |

### 🗺 Interactive Map
- **Leaflet.js** integration with OpenStreetMap tiles
- Donors plotted as coloured circle markers (red = O, blue = A, green = B, purple = AB)
- Blood requests shown as pulsing markers
- Click a marker to open donor profile popup with blood type, location, distance
- Geolocation button to center map on user's current position
- Hospitals shown on hospital search page map

### 🌙 Dark / Light Mode
- One-click theme toggle (sun/moon icon) in every page's nav bar
- Theme saved to `localStorage` — persists across sessions
- Full dark palette using CSS custom properties (`--bg`, `--card`, `--text`, `--muted`, `--line`, `--accent`)

### 📱 Fully Responsive Design
- Mobile-first across all 15 CSS files
- Breakpoints: 480px (small phones), 640px (phones), 768px (tablets), 900px+ (desktop)
- All modals become **bottom sheets** on mobile (slide up from bottom edge)
- Navigation bars convert to horizontal-scroll on mobile
- Grids reflow: 3-col → 2-col → 1-col
- Touch targets minimum 44px height on all buttons
- `overflow-x: hidden` globally to prevent horizontal scroll
- Category pills, tabs, nav links all scroll horizontally on small screens

---

## 📡 API Reference

### Public (no auth required)
GET  /api/public/stats           — Platform stats (total donors, requests, etc.)
GET  /api/public/requests        — Browse blood requests (with filters)
GET  /api/public/hospitals       — Hospital directory
GET  /api/public/ambulances      — Ambulance directory
GET  /api/public/leaderboard     — Donor leaderboard
GET  /api/public/profile/:id     — Public donor profile
GET  /api/health                 — API health check



### Authentication
POST /api/auth/register          — Create new donor account
POST /api/auth/login             — Login (User Code or email + password)
GET  /api/auth/me                — Get current user's full profile (auth required)
PUT  /api/auth/profile           — Update profile fields (auth required)
POST /api/auth/organ-pledge      — Submit organ donation pledge (auth required)
POST /api/auth/test-email        — Send test email to self (auth required)



### Blood Requests
GET    /api/requests/mine        — My posted requests
POST   /api/requests             — Post new request
DELETE /api/requests/:id         — Cancel a request
GET    /api/requests/:id/contact — Reveal donor contact info



### Hospitals
POST /api/hospitals              — Register hospital (admin)
POST /api/hospitals/:id/book     — Book hospital admission
GET  /api/hospitals/bookings     — My bookings
GET  /api/hospitals/bookings/:id/documents — Get booking documents
POST /api/hospitals/bookings/:id/documents — Upload document



### Doctors
GET  /api/doctors                — Doctor directory (with filters)
POST /api/doctors/appointments   — Book appointment
GET  /api/doctors/appointments/mine — My appointments



### Medicines
GET  /api/medicines              — Medicine catalog (with filters)
POST /api/medicines/orders       — Place order
GET  /api/medicines/orders/mine  — My orders



### Emergency SOS
POST  /api/alerts                — Raise SOS alert
GET   /api/alerts/mine           — My alert history
GET   /api/alerts/active         — Active alerts
PATCH /api/alerts/:id/respond    — Mark as responded
PATCH /api/alerts/:id/resolve    — Mark as resolved
PATCH /api/alerts/:id/cancel     — Cancel alert



### Emergency Contacts
GET    /api/contacts             — List contacts
POST   /api/contacts             — Add contact
DELETE /api/contacts/:id         — Delete contact



### File Uploads
POST /api/uploads/avatar         — Upload profile photo
POST /api/uploads/document       — Upload medical document
GET  /api/uploads/documents      — My documents
DELETE /api/uploads/documents/:id — Delete document



### Medical Tests
POST /api/tests/book             — Book a test
GET  /api/tests/my-bookings      — My test bookings
POST /api/tests/bookings/:id/report — Upload test report




Production Build

cd frontend
npm run build
Then start the backend with NODE_ENV=production — it will serve the built React app from frontend/dist/.
