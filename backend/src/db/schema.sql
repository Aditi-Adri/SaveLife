-- SaveLife — blood / organ / plasma donation database schema
-- Idempotent: safe to run repeatedly. Runs automatically on server boot,
-- or manually with: npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  user_code          VARCHAR(20) UNIQUE,        -- auto-generated login ID, e.g. SLF-7K9QF2
  name               VARCHAR(120) NOT NULL,
  email              VARCHAR(255) UNIQUE NOT NULL,
  password           VARCHAR(255) NOT NULL,
  phone              VARCHAR(20),               -- 11-digit number
  age                INTEGER,
  gender             VARCHAR(20),
  weight             NUMERIC(5,2),              -- kg
  blood_type         VARCHAR(5),
  donation_count     INTEGER DEFAULT 0,
  last_donation      DATE,
  donation_history   TEXT,
  drug_addicted      BOOLEAN DEFAULT false,
  medical_conditions TEXT,                      -- any sickness / conditions
  role               VARCHAR(20) NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'responder')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patch older installs that created `users` before these columns existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code          VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age                INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender             VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight             NUMERIC(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_count     INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_donation      DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_history   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS drug_addicted      BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url         VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS religion           VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude           DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude          DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_text      VARCHAR(255);

-- People to notify when a user triggers an SOS.
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(40) NOT NULL,
  relationship  VARCHAR(60),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON emergency_contacts(user_id);

-- An SOS alert raised by a user. Responders pick these up.
CREATE TABLE IF NOT EXISTS alerts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responder_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type          VARCHAR(20) NOT NULL DEFAULT 'other'
                CHECK (type IN ('medical', 'accident', 'fire', 'crime', 'other')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'responded', 'resolved', 'cancelled')),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- Blood requests posted by users; browsable read-only on the public Explore page.
CREATE TABLE IF NOT EXISTS blood_requests (
  id            SERIAL PRIMARY KEY,
  requester_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  patient_name  VARCHAR(120) NOT NULL,
  blood_type    VARCHAR(5) NOT NULL,
  units_needed  INTEGER NOT NULL DEFAULT 1,
  hospital      VARCHAR(160),
  location      VARCHAR(160),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  contact_phone VARCHAR(20),
  urgency       VARCHAR(20) NOT NULL DEFAULT 'urgent'
                CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'fulfilled', 'cancelled')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);

-- Patch older installs that created blood_requests before geo columns existed.
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS latitude      DOUBLE PRECISION;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS longitude     DOUBLE PRECISION;
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS donation_type VARCHAR(20) NOT NULL DEFAULT 'blood';

-- Hospitals users can browse and book.
CREATE TABLE IF NOT EXISTS hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(160) NOT NULL,
  city            VARCHAR(80),
  address         VARCHAR(200),
  phone           VARCHAR(30),
  email           VARCHAR(160),
  beds_available  INTEGER DEFAULT 0,
  has_blood_bank  BOOLEAN DEFAULT false,
  has_ambulance   BOOLEAN DEFAULT false,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS email            VARCHAR(160);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_type   VARCHAR(20) NOT NULL DEFAULT 'public'
                                               CHECK (hospital_type IN ('public','private'));
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 0;

-- Auto-classify well-known private hospitals in Bangladesh
UPDATE hospitals SET hospital_type = 'private'
WHERE name ILIKE '%square%' OR name ILIKE '%united%' OR name ILIKE '%apollo%'
   OR name ILIKE '%evercare%' OR name ILIKE '%labaid%' OR name ILIKE '%popular%'
   OR name ILIKE '%clinic%' OR name ILIKE '%ibn sina%' OR name ILIKE '%delta%'
   OR name ILIKE '%holy family%' OR name ILIKE '%birdem%' OR name ILIKE '%national heart%'
   OR name ILIKE '%medinova%' OR name ILIKE '%diagnostic%' OR name ILIKE '%city%'
   OR name ILIKE '%green life%' OR name ILIKE '%anwar khan%' OR name ILIKE '%asgar ali%';

CREATE TABLE IF NOT EXISTS hospital_bookings (
  id                        SERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id               INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Patient details
  patient_name              VARCHAR(120) NOT NULL,
  patient_age               INTEGER,
  patient_gender            VARCHAR(20),
  patient_nid               VARCHAR(50),
  contact_phone             VARCHAR(20),

  -- Admission details
  admission_type            VARCHAR(20) NOT NULL DEFAULT 'planned'
                            CHECK (admission_type IN ('emergency','planned','day_care')),
  ward_type                 VARCHAR(20) NOT NULL DEFAULT 'general'
                            CHECK (ward_type IN ('general','semi_cabin','cabin','icu','emergency')),
  booking_date              DATE,
  expected_days             INTEGER NOT NULL DEFAULT 1,
  reason                    VARCHAR(200),
  symptoms                  TEXT,
  referred_doctor           VARCHAR(120),

  -- Emergency contact
  emergency_contact_name    VARCHAR(120),
  emergency_contact_phone   VARCHAR(20),
  emergency_contact_rel     VARCHAR(60),

  -- Insurance
  insurance_provider        VARCHAR(100),
  insurance_number          VARCHAR(50),

  special_requirements      TEXT,

  -- Payment (private hospitals only)
  advance_paid              BOOLEAN NOT NULL DEFAULT false,
  advance_amount            NUMERIC(10,2) DEFAULT 0,
  payment_method            VARCHAR(30),
  payment_ref               VARCHAR(50),

  status                    VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','cancelled')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON hospital_bookings(user_id);

-- Patch older hospital_bookings that were created before the full schema
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS patient_age             INTEGER;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS patient_gender          VARCHAR(20);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS patient_nid             VARCHAR(50);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS contact_phone           VARCHAR(20);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS admission_type          VARCHAR(20) NOT NULL DEFAULT 'planned';
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS ward_type               VARCHAR(20) NOT NULL DEFAULT 'general';
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS expected_days           INTEGER NOT NULL DEFAULT 1;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS symptoms                TEXT;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS referred_doctor         VARCHAR(120);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS emergency_contact_name  VARCHAR(120);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS emergency_contact_rel   VARCHAR(60);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS insurance_provider      VARCHAR(100);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS insurance_number        VARCHAR(50);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS special_requirements    TEXT;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS advance_paid            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS advance_amount          NUMERIC(10,2) DEFAULT 0;
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS payment_method          VARCHAR(30);
ALTER TABLE hospital_bookings ADD COLUMN IF NOT EXISTS payment_ref             VARCHAR(50);

-- Medical documents attached to a booking
CREATE TABLE IF NOT EXISTS booking_documents (
  id           SERIAL PRIMARY KEY,
  booking_id   INTEGER NOT NULL REFERENCES hospital_bookings(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    VARCHAR(255) NOT NULL,
  file_path    VARCHAR(500) NOT NULL,
  doc_label    VARCHAR(40) DEFAULT 'medical',
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bdocs_booking ON booking_documents(booking_id);

-- Ambulance services for the emergency "call ambulance" page.
CREATE TABLE IF NOT EXISTS ambulance_services (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(160) NOT NULL,
  city           VARCHAR(80),
  phone          VARCHAR(30) NOT NULL,
  email          VARCHAR(160),
  available_24_7 BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ambulance_services ADD COLUMN IF NOT EXISTS email VARCHAR(160);

-- Documents and certificates uploaded by donors.
CREATE TABLE IF NOT EXISTS user_documents (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type     VARCHAR(40) NOT NULL DEFAULT 'other'
               CHECK (doc_type IN ('certificate', 'medical', 'identity', 'other')),
  file_name    VARCHAR(255) NOT NULL,
  file_path    VARCHAR(500) NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_user ON user_documents(user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- DOCTORS directory
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  specialty        VARCHAR(80)  NOT NULL,
  qualifications   VARCHAR(255),
  experience_years INTEGER      DEFAULT 0,
  hospital         VARCHAR(160),
  city             VARCHAR(80),
  phone            VARCHAR(30),
  email            VARCHAR(160),
  bio              TEXT,
  consultation_fee INTEGER      DEFAULT 500,
  available_days   VARCHAR(100) DEFAULT 'Sun, Mon, Tue, Wed, Thu',
  available_time   VARCHAR(60)  DEFAULT '09:00 AM - 02:00 PM',
  languages        VARCHAR(100) DEFAULT 'Bengali, English',
  rating           NUMERIC(2,1) DEFAULT 4.5,
  total_patients   INTEGER      DEFAULT 0,
  avatar_url       VARCHAR(500),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id        INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name     VARCHAR(120) NOT NULL,
  patient_age      INTEGER,
  patient_gender   VARCHAR(20),
  patient_phone    VARCHAR(20),
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20),
  reason           TEXT,
  notes            TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('pending','confirmed','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user   ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

-- Seed 50 doctors (only if table is empty)
INSERT INTO doctors (name, specialty, qualifications, experience_years, hospital, city, consultation_fee, available_days, available_time, rating, total_patients, bio)
SELECT * FROM (VALUES
  ('Dr. Ahmed Kamal','Cardiologist','MBBS, MD (Cardiology), FCPS',25,'Square Hospital','Dhaka',1500,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 02:00 PM',4.9,4200,'Senior Cardiologist with 25 years of expertise in interventional cardiology, heart failure management, and echocardiography.'),
  ('Dr. Farida Begum','Cardiologist','MBBS, FCPS (Cardiology), Fellowship (UK)',20,'United Hospital','Dhaka',1200,'Mon, Tue, Wed, Thu, Fri','10:00 AM - 03:00 PM',4.8,3800,'Specialist in preventive cardiology and cardiac rehabilitation. Completed fellowship training at Royal Brompton Hospital, London.'),
  ('Dr. Nasir Uddin','Cardiologist','MBBS, MD, FRCP (Edinburgh)',18,'Evercare Hospital','Dhaka',1500,'Sun, Mon, Tue, Wed',  '08:00 AM - 01:00 PM',4.7,3200,'Expert in complex coronary interventions and structural heart disease. Pioneer in minimally invasive cardiac procedures in Bangladesh.'),
  ('Dr. Rehana Khatun','Cardiologist','MBBS, FCPS, DCard',15,'LabAid Specialized Hospital','Dhaka',1000,'Mon, Wed, Thu, Sat',  '03:00 PM - 07:00 PM',4.6,2600,'Specialises in women''s heart disease, valvular disorders, and cardiac imaging. Active researcher in cardiovascular prevention.'),
  ('Dr. Aminul Islam','Cardiologist','MBBS, MD (Cardiology)',12,'Chittagong Medical College Hospital','Chittagong',800,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.5,1900,'Leading cardiologist in Chittagong with expertise in echocardiography and cardiac stress testing.'),
  ('Dr. Shahabuddin Ahmed','Neurologist','MBBS, MD (Neurology), FCPS',22,'Square Hospital','Dhaka',1500,'Sun, Tue, Thu',        '10:00 AM - 02:00 PM',4.9,3600,'Renowned neurologist specialising in stroke management, epilepsy, and movement disorders. Trained at Johns Hopkins University.'),
  ('Dr. Maksuda Rahman','Neurologist','MBBS, MD, MRCP (UK)',16,'United Hospital','Dhaka',1200,'Mon, Wed, Fri',           '09:00 AM - 01:00 PM',4.7,2800,'Expert in headache disorders, multiple sclerosis, and neurodegenerative diseases. Published researcher in Bangladeshi neurology.'),
  ('Dr. Rafiqul Islam','Neurologist','MBBS, FCPS (Neurology)',19,'Dhaka Medical College Hospital','Dhaka',1000,'Sun, Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.6,3100,'Specialist in cerebrovascular disease and neuro-rehabilitation. Head of Neurology at Dhaka Medical College.'),
  ('Dr. Nusrat Jahan','Neurologist','MBBS, MD (Neurology)',10,'Evercare Hospital','Dhaka',800,'Tue, Thu, Sat',           '02:00 PM - 06:00 PM',4.5,1500,'Focuses on paediatric neurology and neuropathy. Certified in EEG and nerve conduction studies.'),
  ('Dr. Mohammad Zahirul Haq','Orthopedic Surgeon','MBBS, MS (Ortho), FCPS',20,'Square Hospital','Dhaka',1500,'Sun, Mon, Tue, Wed','09:00 AM - 01:00 PM',4.8,3400,'Expert in joint replacement, spine surgery, and sports injuries. Performed over 2,000 total knee and hip replacements.'),
  ('Dr. Sumaiya Akter','Orthopedic Surgeon','MBBS, MS (Ortho)',14,'Ibn Sina Hospital','Dhaka',1000,'Mon, Wed, Thu, Sat',   '10:00 AM - 03:00 PM',4.6,2200,'Specialist in paediatric orthopaedics and limb deformity correction. One of few female orthopaedic surgeons in Bangladesh.'),
  ('Dr. Khaled Hossain','Orthopedic Surgeon','MBBS, FCPS (Ortho), Fellowship',17,'Green Life Medical College Hospital','Dhaka',1200,'Sun, Tue, Wed, Thu',  '08:00 AM - 12:00 PM',4.7,2700,'Arthroscopic surgery specialist for knee, shoulder, and ankle. Trained in arthroscopy at Singapore General Hospital.'),
  ('Dr. Rina Dey','Orthopedic Surgeon','MBBS, MS, Fellowship (Germany)',12,'Chittagong Medical College Hospital','Chittagong',800,'Mon, Tue, Wed, Thu',   '09:00 AM - 02:00 PM',4.5,1800,'Specialises in trauma surgery and fracture management. Expertise in complex pelvic and acetabular fractures.'),
  ('Dr. Farhana Islam','Dermatologist','MBBS, DDV, FCPS (Derm)',15,'Popular Diagnostic Centre','Dhaka',800,'Sun, Mon, Wed, Fri',  '10:00 AM - 02:00 PM',4.7,2900,'Specialist in acne, eczema, psoriasis, and cosmetic dermatology. Pioneer in laser treatment for skin disorders in Bangladesh.'),
  ('Dr. Tawhid Hassan','Dermatologist','MBBS, MD (Dermatology)',12,'LabAid Specialized Hospital','Dhaka',700,'Tue, Thu, Sat',    '03:00 PM - 07:00 PM',4.6,2300,'Expertise in skin cancer detection, hair loss treatments, and aesthetic dermatology procedures.'),
  ('Dr. Sabrina Akhter','Dermatologist','MBBS, DDV, CCD',10,'United Hospital','Dhaka',600,'Mon, Wed, Sat',              '11:00 AM - 03:00 PM',4.5,1700,'Focuses on paediatric dermatology and allergic skin conditions. Certified in cosmetic dermatology from Thailand.'),
  ('Dr. Shamima Sultana','Gynecologist','MBBS, FCPS (Obstet & Gynae), MS',25,'Evercare Hospital','Dhaka',1500,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.9,5100,'Senior consultant in high-risk pregnancy, laparoscopic surgery, and infertility treatment. Over 10,000 deliveries performed.'),
  ('Dr. Hasna Begum','Gynecologist','MBBS, FCPS (Obstet & Gynae)',20,'Dhaka Medical College Hospital','Dhaka',1000,'Sun, Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.7,4200,'Expert in normal and complicated deliveries, uterine fibroid management, and cervical cancer screening.'),
  ('Dr. Monira Islam','Gynecologist','MBBS, MS (Gynaecology)',18,'Square Hospital','Dhaka',1200,'Mon, Tue, Wed, Thu',     '10:00 AM - 02:00 PM',4.8,3600,'Specialist in minimally invasive gynaecological surgery and reproductive endocrinology.'),
  ('Dr. Roksana Parvin','Gynecologist','MBBS, FCPS (Gynae)',15,'Popular Diagnostic Centre','Dhaka',800,'Sun, Tue, Thu, Sat',    '02:00 PM - 06:00 PM',4.6,2800,'Focuses on adolescent gynaecology, polycystic ovary syndrome, and menopausal disorders.'),
  ('Dr. Sultana Razia','Gynecologist','MBBS, DGO, FCPS',12,'Chittagong Maa-O-Shishu Hospital','Chittagong',700,'Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.5,2100,'Expert in maternal and foetal medicine, premature birth prevention, and neonatal care coordination.'),
  ('Dr. Mahbub Alam','Pediatrician','MBBS, FCPS (Paediatrics), MD',22,'Evercare Hospital','Dhaka',1200,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.8,4800,'Specialist in neonatal intensive care, childhood infectious diseases, and developmental paediatrics.'),
  ('Dr. Nazmun Nahar','Pediatrician','MBBS, FCPS (Paediatrics)',18,'Dhaka Medical College Hospital','Dhaka',800,'Sun, Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.7,3900,'Expert in paediatric nutrition, growth disorders, and childhood asthma management.'),
  ('Dr. Rafat Chowdhury','Pediatrician','MBBS, MD (Paediatrics)',15,'United Hospital','Dhaka',1000,'Mon, Wed, Thu, Fri',    '10:00 AM - 03:00 PM',4.6,2900,'Specialises in paediatric gastroenterology and liver disease. Trained in paediatric hepatology at AIIMS, New Delhi.'),
  ('Dr. Israt Jahan','Pediatrician','MBBS, DCH, FCPS',12,'LabAid Specialized Hospital','Dhaka',700,'Tue, Thu, Sat',        '03:00 PM - 07:00 PM',4.5,2000,'Focuses on childhood vaccination, developmental milestones, and paediatric emergency care.'),
  ('Dr. Anwar Hossain','General Physician','MBBS, FCPS (Medicine), MRCP (UK)',20,'Square Hospital','Dhaka',700,'Mon, Tue, Wed, Thu, Fri','09:00 AM - 02:00 PM',4.7,3200,'Internal medicine specialist with expertise in hypertension, diabetes, and chronic disease management. MRCP trained from the UK.'),
  ('Dr. Selina Khatun','General Physician','MBBS, FCPS (Medicine)',15,'Rajshahi Medical College Hospital','Rajshahi',500,'Sun, Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.5,2500,'Expert in tropical diseases, typhoid, and liver disorders common in Bangladesh. Head of Medicine Dept at Rajshahi Medical.'),
  ('Dr. Nurul Amin','General Physician','MBBS, MD (Medicine)',18,'Mymensingh Medical College Hospital','Mymensingh',500,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.6,2800,'Specialist in infectious diseases, fever management, and rural healthcare. Expertise in dengue and malaria.'),
  ('Dr. Ayesha Siddiqua','General Physician','MBBS, FCPS',12,'Green Life Medical College Hospital','Dhaka',600,'Mon, Wed, Fri, Sat',     '02:00 PM - 06:00 PM',4.5,1800,'Focuses on preventive medicine, health checkups, and chronic disease monitoring. Certified in lifestyle medicine.'),
  ('Dr. Abul Kalam Azad','Gastroenterologist','MBBS, MD (Gastroenterology), FCPS',20,'Square Hospital','Dhaka',1200,'Sun, Mon, Tue, Thu', '09:00 AM - 01:00 PM',4.8,3300,'Expert in colonoscopy, endoscopy, and hepatitis management. Specialist in liver cirrhosis and inflammatory bowel disease.'),
  ('Dr. Fahmida Khanam','Gastroenterologist','MBBS, FCPS (Gastroenterology)',16,'United Hospital','Dhaka',1000,'Mon, Tue, Wed, Fri',    '10:00 AM - 02:00 PM',4.7,2700,'Specialist in functional GI disorders, peptic ulcer disease, and ERCP procedures.'),
  ('Dr. Jashim Uddin','Gastroenterologist','MBBS, MD (Gastro)',14,'Ibn Sina Hospital','Dhaka',800,'Sun, Tue, Thu, Sat',        '02:00 PM - 06:00 PM',4.5,2100,'Expertise in viral hepatitis, fatty liver disease, and pancreatic disorders.'),
  ('Dr. Abdus Sattar','Ophthalmologist','MBBS, MS (Ophthalmology), FCPS',18,'Delta Medical College Hospital','Dhaka',800,'Sun, Mon, Tue, Wed','09:00 AM - 01:00 PM',4.7,2900,'Specialist in cataract surgery, glaucoma management, and retinal diseases. Performed over 5,000 cataract surgeries.'),
  ('Dr. Rozina Begum','Ophthalmologist','MBBS, DO, MS (Ophthalmology)',15,'Dhaka Medical College Hospital','Dhaka',700,'Sun, Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.6,2400,'Expert in corneal transplantation, paediatric ophthalmology, and low-vision rehabilitation.'),
  ('Dr. Lutfor Rahman','Ophthalmologist','MBBS, FCPS (Eye)',12,'Khulna Medical College Hospital','Khulna',600,'Mon, Tue, Wed, Thu',   '09:00 AM - 01:00 PM',4.5,1800,'Specialist in refractive surgery, diabetic retinopathy screening, and squint correction.'),
  ('Dr. Minhajul Islam','ENT Specialist','MBBS, MS (ENT), FCPS',18,'Evercare Hospital','Dhaka',900,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.7,2800,'Expert in endoscopic sinus surgery, cochlear implants, and head & neck tumour management.'),
  ('Dr. Rehana Parvin','ENT Specialist','MBBS, DLO, MS (ENT)',14,'LabAid Specialized Hospital','Dhaka',700,'Mon, Wed, Thu, Sat',   '10:00 AM - 03:00 PM',4.6,2200,'Specialist in hearing disorders, tinnitus management, and snoring/sleep apnea treatment.'),
  ('Dr. Touhidul Alam','ENT Specialist','MBBS, FCPS (ENT)',12,'Sylhet MAG Osmani Medical College','Sylhet',600,'Mon, Tue, Wed, Thu','08:00 AM - 12:00 PM',4.5,1700,'Expert in voice disorders, laryngoscopy, and thyroid surgery. Leading ENT in the Sylhet region.'),
  ('Dr. Meher Nigar','Psychiatrist','MBBS, MD (Psychiatry), FCPS',20,'Green Life Medical College Hospital','Dhaka',1000,'Sun, Mon, Tue, Wed, Thu','10:00 AM - 02:00 PM',4.8,2600,'Specialist in depression, anxiety disorders, schizophrenia, and addiction psychiatry. Trained in cognitive behavioural therapy.'),
  ('Dr. Zahid Hassan','Psychiatrist','MBBS, FCPS (Psychiatry)',16,'Square Hospital','Dhaka',900,'Mon, Tue, Thu, Sat',         '03:00 PM - 07:00 PM',4.7,2100,'Expert in bipolar disorder, OCD, PTSD, and child & adolescent psychiatry.'),
  ('Dr. Sadia Rahman','Psychiatrist','MBBS, MD (Psychiatry)',10,'Anwar Khan Modern Medical College Hospital','Dhaka',800,'Sun, Tue, Wed, Fri',  '11:00 AM - 03:00 PM',4.5,1400,'Focuses on anxiety, insomnia, and trauma-related disorders. Certified in mindfulness-based cognitive therapy.'),
  ('Dr. Tofail Ahmed','Endocrinologist','MBBS, MD (Endocrinology), FCPS',22,'Ibn Sina Hospital','Dhaka',1200,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.8,3500,'Pioneer in diabetes management in Bangladesh. Expert in thyroid disorders, adrenal diseases, and pituitary disorders.'),
  ('Dr. Farida Yasmin','Endocrinologist','MBBS, FCPS (Medicine), MD (Endocrine)',18,'United Hospital','Dhaka',1000,'Mon, Tue, Wed, Fri',    '10:00 AM - 02:00 PM',4.7,2900,'Specialist in type 1 and type 2 diabetes, obesity management, and hormonal imbalances.'),
  ('Dr. Ruhul Amin','Endocrinologist','MBBS, MD (Diabetology)',15,'Anwar Khan Modern Medical College Hospital','Dhaka',800,'Sun, Tue, Thu, Sat',    '02:00 PM - 06:00 PM',4.6,2300,'Expert in insulin therapy, diabetic complications, and metabolic syndrome management.'),
  ('Dr. Shahidullah Mia','Pulmonologist','MBBS, FCPS (Chest Medicine), MD',20,'Evercare Hospital','Dhaka',800,'Sun, Mon, Tue, Wed',  '09:00 AM - 01:00 PM',4.7,2700,'Specialist in COPD, asthma, tuberculosis, and sleep-disordered breathing. Expertise in bronchoscopy.'),
  ('Dr. Salma Begum','Pulmonologist','MBBS, FCPS (Respiratory Medicine)',15,'Dhaka Medical College Hospital','Dhaka',700,'Mon, Tue, Wed, Thu, Fri','08:00 AM - 12:00 PM',4.6,2200,'Expert in lung cancer diagnosis, pleural diseases, and pulmonary rehabilitation.'),
  ('Dr. Enamul Haq','Nephrologist','MBBS, MD (Nephrology), FCPS',18,'Square Hospital','Dhaka',1200,'Sun, Mon, Tue, Wed, Thu','09:00 AM - 01:00 PM',4.8,2800,'Specialist in chronic kidney disease, dialysis management, and kidney transplant evaluation.'),
  ('Dr. Nasreen Akhter','Nephrologist','MBBS, FCPS (Nephrology)',14,'Dhaka Medical College Hospital','Dhaka',1000,'Mon, Tue, Wed, Thu',   '10:00 AM - 02:00 PM',4.6,2100,'Expert in glomerulonephritis, hypertensive nephropathy, and renal biopsy.'),
  ('Dr. Shafiqul Islam','Urologist','MBBS, MS (Urology), FCPS',16,'United Hospital','Dhaka',1200,'Sun, Mon, Tue, Wed',        '09:00 AM - 01:00 PM',4.7,2500,'Specialist in laparoscopic urology, kidney stones, prostate disorders, and urological oncology.'),
  ('Dr. Arifur Rahman','Urologist','MBBS, FCPS (Urology)',12,'Ibn Sina Hospital','Dhaka',1000,'Tue, Thu, Sat',              '10:00 AM - 03:00 PM',4.5,1800,'Expert in endoscopic urological procedures, male infertility, and paediatric urology.')
) AS v(name,specialty,qualifications,experience_years,hospital,city,consultation_fee,available_days,available_time,rating,total_patients,bio)
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);
