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
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS email VARCHAR(200);

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

-- ─── Medicines & Health Products ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medicines (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(200) NOT NULL,
  category              VARCHAR(100) NOT NULL,
  brand                 VARCHAR(100),
  description           TEXT,
  price                 NUMERIC(10,2) NOT NULL,
  original_price        NUMERIC(10,2),
  unit                  VARCHAR(80),
  stock                 INTEGER DEFAULT 100,
  emoji                 VARCHAR(10) DEFAULT '💊',
  requires_prescription BOOLEAN DEFAULT false,
  rating                NUMERIC(3,1) DEFAULT 4.0,
  reviews_count         INTEGER DEFAULT 0,
  is_featured           BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS medicines_category_idx ON medicines(category);

CREATE TABLE IF NOT EXISTS medicine_orders (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id),
  items            JSONB NOT NULL,
  total            NUMERIC(10,2) NOT NULL,
  address          TEXT NOT NULL,
  phone            VARCHAR(20),
  payment_method   VARCHAR(50) DEFAULT 'COD',
  status           VARCHAR(30) DEFAULT 'placed',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Seed 120 medicines (only if table is empty)
INSERT INTO medicines (name,category,brand,description,price,original_price,unit,emoji,requires_prescription,rating,reviews_count,is_featured)
SELECT name,category,brand,description,price,original_price,unit,emoji,requires_prescription,rating,reviews_count,is_featured
FROM (VALUES
  ('Napa 500mg','Medicines','Beximco','Fast-acting paracetamol for fever, headache and mild pain relief',25.00,NULL,'10 tablets','💊',false,4.7,1240,true),
  ('Napa Extra','Medicines','Beximco','Paracetamol + caffeine combination for stronger headache and migraine relief',35.00,NULL,'10 tablets','💊',false,4.6,980,true),
  ('Ibuprofen 400mg','Medicines','Square','Anti-inflammatory and analgesic for pain, fever and inflammation',30.00,NULL,'10 tablets','💊',false,4.5,760,false),
  ('Aspirin 75mg','Medicines','Opsonin','Low-dose aspirin for cardiovascular protection and anti-platelet therapy',20.00,NULL,'30 tablets','💊',false,4.4,540,false),
  ('Amoxicillin 500mg','Medicines','ACI','Broad-spectrum penicillin antibiotic for bacterial infections',60.00,NULL,'10 capsules','💊',true,4.6,820,false),
  ('Azithromycin 500mg','Medicines','Incepta','Macrolide antibiotic for respiratory tract and skin infections',80.00,NULL,'3 tablets','💊',true,4.7,1100,true),
  ('Metronidazole 400mg','Medicines','Square','Antibiotic and antiprotozoal for gastrointestinal and gynaecological infections',40.00,NULL,'10 tablets','💊',true,4.4,620,false),
  ('Cetirizine 10mg','Medicines','Beximco','Non-drowsy antihistamine for allergic rhinitis, urticaria and hay fever',30.00,NULL,'10 tablets','💊',false,4.6,890,false),
  ('Loratadine 10mg','Medicines','ACI','Second-generation antihistamine for allergy relief without sedation',35.00,NULL,'10 tablets','💊',false,4.5,670,false),
  ('Omeprazole 20mg','Medicines','Square','Proton pump inhibitor for gastric ulcers and acid reflux',45.00,55.00,'10 capsules','💊',true,4.7,1020,true),
  ('Ranitidine 150mg','Medicines','Opsonin','H2 blocker for heartburn, acid indigestion and gastritis',25.00,NULL,'10 tablets','💊',false,4.3,480,false),
  ('Pantoprazole 40mg','Medicines','Incepta','Proton pump inhibitor for gastroesophageal reflux and erosive oesophagitis',55.00,NULL,'10 tablets','💊',true,4.6,740,false),
  ('Domperidone 10mg','Medicines','ACI','Anti-nausea and prokinetic agent for vomiting and stomach motility',35.00,NULL,'10 tablets','💊',true,4.4,560,false),
  ('Metformin 500mg','Medicines','Square','First-line oral medication for type 2 diabetes mellitus',25.00,NULL,'10 tablets','💊',true,4.7,1380,true),
  ('Losartan 50mg','Medicines','Beximco','Angiotensin receptor blocker for hypertension and kidney protection',50.00,NULL,'10 tablets','💊',true,4.6,820,false),
  ('Amlodipine 5mg','Medicines','Incepta','Calcium channel blocker for high blood pressure and angina',40.00,NULL,'10 tablets','💊',true,4.5,760,false),
  ('Atorvastatin 20mg','Medicines','ACI','Statin medication for lowering cholesterol and cardiovascular risk',70.00,85.00,'10 tablets','💊',true,4.7,960,false),
  ('ORS Saline Powder','Medicines','ICDDRB','Oral rehydration salts for dehydration from diarrhoea and vomiting',15.00,NULL,'10 sachets','💊',false,4.8,2100,true),
  ('Antacid Syrup 200ml','Medicines','Square','Antacid suspension for quick relief from acidity and heartburn',90.00,110.00,'200 ml bottle','🧴',false,4.5,680,false),
  ('Benadryl Cough Syrup','Medicines','Johnson & Johnson','Diphenhydramine-based cough suppressant for dry and wet cough',120.00,NULL,'100 ml bottle','🧴',false,4.4,580,false),
  ('Ciprofloxacin 500mg','Medicines','Square','Fluoroquinolone antibiotic for urinary tract and respiratory infections',65.00,NULL,'10 tablets','💊',true,4.5,640,false),
  ('Doxycycline 100mg','Medicines','Opsonin','Tetracycline antibiotic for acne, malaria prophylaxis and STIs',55.00,NULL,'10 capsules','💊',true,4.4,510,false),
  ('Fluconazole 150mg','Medicines','Incepta','Antifungal for vaginal candidiasis and other fungal infections',45.00,NULL,'1 capsule','💊',true,4.6,720,false),
  ('Loperamide 2mg','Medicines','Beximco','Anti-diarrhoeal for acute and chronic diarrhoea',25.00,NULL,'10 capsules','💊',false,4.5,590,false),
  ('Mebendazole 100mg','Medicines','ACI','Anthelmintic for intestinal worm infections including threadworms',30.00,NULL,'6 tablets','💊',false,4.6,680,false),
  ('Naproxen 500mg','Medicines','Square','NSAID for musculoskeletal pain, arthritis and dysmenorrhoea',45.00,NULL,'10 tablets','💊',false,4.4,490,false),
  ('Ondansetron 4mg','Medicines','Beximco','Antiemetic for nausea and vomiting from chemotherapy and surgery',55.00,NULL,'10 tablets','💊',true,4.7,830,false),
  ('Prednisolone 5mg','Medicines','Incepta','Corticosteroid for inflammatory and autoimmune conditions',30.00,NULL,'10 tablets','💊',true,4.5,610,false),
  ('Salbutamol Inhaler 100mcg','Medicines','ACI','Bronchodilator inhaler for rapid asthma and COPD symptom relief',180.00,220.00,'200 doses','💊',true,4.8,1450,true),
  ('Metoclopramide 10mg','Medicines','Opsonin','Prokinetic antiemetic for nausea, vomiting and gastroparesis',25.00,NULL,'10 tablets','💊',true,4.3,420,false),
  ('Vitamin C 500mg','Vitamins & Supplements','Square','Ascorbic acid antioxidant for immune support and collagen synthesis',180.00,220.00,'60 tablets','🌿',false,4.8,1820,true),
  ('Vitamin D3 1000IU','Vitamins & Supplements','Beximco','Cholecalciferol for bone health, immune function and mood support',220.00,270.00,'60 tablets','🌿',false,4.7,1340,true),
  ('Calcium + D3','Vitamins & Supplements','ACI','Combined calcium carbonate and vitamin D3 for strong bones and teeth',250.00,300.00,'60 tablets','🌿',false,4.6,980,false),
  ('Folic Acid 5mg','Vitamins & Supplements','Square','Essential B-vitamin for pregnancy, neural tube defect prevention',60.00,NULL,'30 tablets','🌿',false,4.7,1120,false),
  ('Iron + Folic Acid','Vitamins & Supplements','Opsonin','Combined iron and folic acid for anaemia treatment and prevention',80.00,95.00,'30 tablets','🌿',false,4.6,890,false),
  ('Multivitamin Adults','Vitamins & Supplements','Incepta','Complete daily multivitamin with 23 essential vitamins and minerals',290.00,350.00,'30 tablets','🌿',false,4.7,1560,true),
  ('Zinc 20mg','Vitamins & Supplements','ACI','Zinc supplement for immune support, wound healing and skin health',150.00,180.00,'30 tablets','🌿',false,4.5,720,false),
  ('B-Complex Forte','Vitamins & Supplements','Beximco','Complete B-vitamin complex for energy metabolism and nervous system health',120.00,150.00,'30 tablets','🌿',false,4.6,840,false),
  ('Omega-3 Fish Oil 1000mg','Vitamins & Supplements','Square','High-potency EPA and DHA fish oil for heart, brain and joint health',380.00,450.00,'60 softgels','🌿',false,4.8,2100,true),
  ('Biotin 5000mcg','Vitamins & Supplements','Incepta','High-dose biotin for hair growth, stronger nails and skin health',320.00,380.00,'60 tablets','🌿',false,4.7,1680,true),
  ('Vitamin B12 500mcg','Vitamins & Supplements','ACI','Methylcobalamin for nerve health, red blood cell production and energy',180.00,220.00,'30 tablets','🌿',false,4.6,920,false),
  ('Magnesium 400mg','Vitamins & Supplements','Beximco','Magnesium glycinate for muscle relaxation, sleep and stress reduction',280.00,330.00,'60 tablets','🌿',false,4.5,760,false),
  ('Coenzyme Q10 100mg','Vitamins & Supplements','Square','Cellular energy booster and antioxidant for heart health',590.00,680.00,'30 softgels','🌿',false,4.7,580,false),
  ('Turmeric Curcumin 500mg','Vitamins & Supplements','Herbal','Anti-inflammatory curcumin extract with black pepper for bioavailability',350.00,420.00,'60 capsules','🌿',false,4.6,840,false),
  ('Ashwagandha 500mg','Vitamins & Supplements','Herbal','Adaptogenic herb for stress relief, energy and cognitive support',420.00,490.00,'60 capsules','🌿',false,4.7,1020,false),
  ('Probiotics 10 Billion CFU','Vitamins & Supplements','ACI','Multi-strain probiotic for gut health, digestion and immunity',480.00,560.00,'30 capsules','🌿',false,4.8,1240,true),
  ('Vitamin E 400IU','Vitamins & Supplements','Incepta','Tocopherol antioxidant for skin health and immune function',260.00,310.00,'60 softgels','🌿',false,4.5,640,false),
  ('Melatonin 3mg','Vitamins & Supplements','Square','Natural sleep hormone for insomnia, jet lag and sleep cycle regulation',290.00,350.00,'60 tablets','🌿',false,4.6,980,false),
  ('Glucosamine + Chondroitin','Vitamins & Supplements','Beximco','Joint support supplement for arthritis, cartilage repair and mobility',520.00,620.00,'60 tablets','🌿',false,4.5,720,false),
  ('Johnson''s Baby Lotion 200ml','Baby Care','Johnson & Johnson','Clinically proven mild moisturising lotion with no parabens or dyes',280.00,320.00,'200 ml','👶',false,4.8,2400,true),
  ('Johnson''s Baby Powder 100g','Baby Care','Johnson & Johnson','Soft talc-free baby powder to keep baby skin dry and comfortable',180.00,210.00,'100 g','👶',false,4.7,1860,false),
  ('Johnson''s Baby Shampoo 200ml','Baby Care','Johnson & Johnson','No more tears formula gentle shampoo for delicate baby hair and scalp',250.00,290.00,'200 ml','👶',false,4.8,2100,true),
  ('Pampers Newborn Diaper S','Baby Care','Pampers','Soft breathable newborn diapers with wetness indicator (0-5kg)',550.00,620.00,'32 pieces','👶',false,4.8,3200,true),
  ('Pampers Baby Dry Diaper M','Baby Care','Pampers','Overnight protection diapers keeping baby dry for up to 12 hours (6-11kg)',620.00,700.00,'30 pieces','👶',false,4.8,2900,true),
  ('Pampers Baby Dry Diaper L','Baby Care','Pampers','Larger size diapers with 12-hour dryness protection (11-16kg)',680.00,760.00,'28 pieces','👶',false,4.7,2600,false),
  ('Baby Wet Wipes 80pcs','Baby Care','Huggies','Fragrance-free hypoallergenic wipes with aloe vera for sensitive skin',180.00,210.00,'80 wipes','👶',false,4.7,1920,false),
  ('NAN Pro 1 Infant Formula','Baby Care','Nestle','Starter formula with probiotics and whey-dominant protein (0-6 months)',890.00,980.00,'400 g tin','🍼',false,4.8,1680,true),
  ('Baby Massage Oil 100ml','Baby Care','Johnson & Johnson','Gentle mineral oil blend for relaxing baby massage and moisturisation',160.00,190.00,'100 ml','👶',false,4.6,1340,false),
  ('Woodward''s Gripe Water','Baby Care','Woodward','Herbal formula for infant colic, gas and stomach discomfort',220.00,260.00,'150 ml','🍼',false,4.6,1580,false),
  ('Pediatric ORS Orange','Baby Care','ICDDRB','Child-friendly flavoured oral rehydration salts for diarrhoea management',90.00,NULL,'5 sachets','🍼',false,4.7,1240,false),
  ('Baby Nappy Rash Cream','Baby Care','Sudocrem','Zinc oxide cream for preventing and treating nappy rash and skin irritation',195.00,230.00,'60 g','👶',false,4.7,1460,false),
  ('Baby Saline Nasal Drops','Baby Care','Sterimar','Isotonic saline drops for clearing blocked noses in infants and toddlers',120.00,145.00,'10 ml','👶',false,4.5,980,false),
  ('Vitamin D Drops for Infants','Baby Care','ACI','Liquid vitamin D3 400IU for breastfed infant bone and immune development',280.00,330.00,'30 ml','🍼',false,4.8,1120,true),
  ('Baby Safe Digital Thermometer','Baby Care','Braun','Fast 10-second underarm thermometer with flexible tip for infant safety',350.00,420.00,'1 piece','🌡️',false,4.7,860,false),
  ('Digital Thermometer','Medical Devices','Omron','Fast and accurate 60-second underarm and oral digital thermometer',280.00,340.00,'1 piece','🌡️',false,4.7,1680,true),
  ('Blood Pressure Monitor','Medical Devices','Omron','Automatic upper arm blood pressure monitor with irregular heartbeat detection',1850.00,2200.00,'1 device','🩺',false,4.8,2400,true),
  ('Glucometer Starter Kit','Medical Devices','Accu-Chek','Blood glucose monitor with 10 test strips and lancing device included',1200.00,1450.00,'1 kit','🩺',false,4.8,1860,true),
  ('Pulse Oximeter','Medical Devices','Beurer','Fingertip pulse oximeter for SpO2 and heart rate monitoring',790.00,950.00,'1 piece','🩺',false,4.7,1540,true),
  ('Nebulizer Machine','Medical Devices','Omron','Compressor nebulizer for asthma, COPD and upper respiratory treatments',3200.00,3800.00,'1 device','🩺',false,4.8,980,false),
  ('Glucose Test Strips 50pcs','Medical Devices','Accu-Chek','Compatible test strips for accurate blood glucose measurement',650.00,780.00,'50 strips','🩺',false,4.7,1240,false),
  ('Lancets 100pcs','Medical Devices','OneTouch','Sterile single-use lancets for pain-free blood glucose sampling',220.00,260.00,'100 pieces','🩺',false,4.6,920,false),
  ('Heating Pad Electric','Medical Devices','Omron','6 temperature settings electric heating pad for muscle and joint pain',890.00,1050.00,'1 piece','🩺',false,4.6,780,false),
  ('Reusable Ice Pack','Medical Devices','Generic','Flexible gel ice pack for cold therapy and post-injury swelling reduction',280.00,330.00,'1 piece','🧊',false,4.4,540,false),
  ('Wrist Support Brace','Medical Devices','Futuro','Adjustable wrist brace for carpal tunnel syndrome and wrist injuries',380.00,450.00,'1 piece','🩺',false,4.5,680,false),
  ('Knee Support Brace','Medical Devices','Futuro','Compression knee sleeve for knee pain, arthritis and sports injuries',490.00,580.00,'1 piece','🩺',false,4.6,860,false),
  ('Ankle Brace','Medical Devices','Futuro','Stirrup ankle support for sprains and chronic ankle instability',350.00,420.00,'1 piece','🩺',false,4.5,620,false),
  ('Surgical Mask 50pcs','Medical Devices','3M','3-layer disposable surgical masks with ear loops for infection protection',380.00,450.00,'50 pieces','😷',false,4.6,2100,false),
  ('N95 Respirator Mask','Medical Devices','3M','NIOSH-approved N95 particulate respirator for high-level protection',450.00,520.00,'5 pieces','😷',false,4.7,1580,true),
  ('Stethoscope','Medical Devices','Littmann','Dual-head stethoscope for auscultating heart and lung sounds',1250.00,1480.00,'1 piece','🩺',false,4.8,740,false),
  ('Crepe Bandage 4"','First Aid','Generic','Conforming crepe bandage for strains, sprains and compression support',85.00,NULL,'1 roll','🩹',false,4.5,860,false),
  ('Adhesive Bandages 50pcs','First Aid','Band-Aid','Flexible fabric adhesive plasters for minor cuts and abrasions',180.00,210.00,'50 pieces','🩹',false,4.7,1560,true),
  ('Absorbent Cotton Wool 100g','First Aid','Generic','Medical-grade sterile cotton wool for wound cleaning and dressing',95.00,NULL,'100 g roll','🩹',false,4.5,720,false),
  ('Dettol Antiseptic Liquid','First Aid','Dettol','Multipurpose antiseptic disinfectant for wound cleaning and surface hygiene',220.00,260.00,'100 ml','🩹',false,4.7,1920,true),
  ('Betadine Antiseptic Solution','First Aid','Cipla','Povidone-iodine antiseptic for pre-operative skin prep and wound care',160.00,190.00,'30 ml','🩹',false,4.6,1240,false),
  ('Complete First Aid Kit','First Aid','Generic','Comprehensive 42-piece first aid kit for home, office and travel use',850.00,1000.00,'1 kit','🩹',false,4.7,680,true),
  ('Sterile Gauze Pads','First Aid','Generic','Non-woven sterile gauze pads for wound dressing and absorption',120.00,NULL,'10 pieces','🩹',false,4.5,580,false),
  ('Medical Adhesive Tape','First Aid','3M','Hypoallergenic paper tape for securing dressings to sensitive skin',75.00,90.00,'1 roll','🩹',false,4.5,640,false),
  ('Hydrogen Peroxide 3%','First Aid','Generic','Antiseptic solution for wound cleaning and surface disinfection',110.00,NULL,'100 ml','🩹',false,4.3,480,false),
  ('Burn Relief Gel 50g','First Aid','Burnshield','Cooling hydrogel for minor burns, scalds and sunburn treatment',195.00,230.00,'50 g tube','🩹',false,4.6,520,false),
  ('Elastic Bandage 6"','First Aid','Generic','Wide elastic bandage for ankle, knee and wrist compression support',140.00,NULL,'1 roll','🩹',false,4.4,460,false),
  ('Antiseptic Wound Spray','First Aid','Dettol','Ready-to-use antiseptic spray for touchless wound cleaning',260.00,300.00,'75 ml','🩹',false,4.6,680,false),
  ('Sunscreen SPF 50 75ml','Personal Care','Neutrogena','Broad-spectrum UVA/UVB protection for daily sun defence',380.00,450.00,'75 ml','🧴',false,4.7,1480,true),
  ('Hand Sanitizer Gel 100ml','Personal Care','Dettol','70% alcohol instant hand sanitizer gel for on-the-go hygiene',120.00,150.00,'100 ml','🧴',false,4.6,2100,true),
  ('Pain Relief Balm 50g','Personal Care','Tiger Balm','Herbal balm with camphor and menthol for muscle and joint pain',180.00,210.00,'50 g','🧴',false,4.7,1680,true),
  ('Lubricating Eye Drops','Personal Care','Refresh','Carboxymethylcellulose eye drops for dry eye relief and lubrication',195.00,230.00,'10 ml','👁️',false,4.6,980,false),
  ('Nasal Saline Spray','Personal Care','Otrivin','Isotonic saline nasal spray for congestion relief and nasal hygiene',220.00,260.00,'100 ml','🧴',false,4.5,840,false),
  ('Throat Lozenges Honey-Lemon','Personal Care','Strepsils','Antiseptic throat lozenges for sore throat and mouth irritation',120.00,NULL,'16 pieces','🍋',false,4.6,1240,false),
  ('Anti-fungal Powder 75g','Personal Care','Canesten','Clotrimazole powder for athlete''s foot and fungal skin infections',180.00,210.00,'75 g','🧴',false,4.5,680,false),
  ('Acne Treatment Gel 30g','Personal Care','Differin','Adapalene gel for treating and preventing acne breakouts',250.00,290.00,'30 g','🧴',true,4.6,820,false),
  ('Feminine Intimate Wash','Personal Care','Lactacyd','pH-balanced feminine wash for daily intimate hygiene and comfort',280.00,330.00,'150 ml','🧴',false,4.7,1120,false),
  ('Moisturising Body Cream','Personal Care','Cetaphil','Fragrance-free daily moisturiser for dry and sensitive skin',320.00,380.00,'100 g','🧴',false,4.7,1380,false),
  ('Sensodyne Toothpaste 100g','Dental Care','Sensodyne','Clinically proven toothpaste for sensitive teeth and lasting protection',290.00,340.00,'100 g','🦷',false,4.8,2200,true),
  ('Listerine Mouthwash 500ml','Dental Care','Johnson & Johnson','Antiseptic mouthwash killing 99.9% of germs for fresh breath and gum health',350.00,420.00,'500 ml','🦷',false,4.7,1860,true),
  ('Dental Floss 50m','Dental Care','Oral-B','Waxed dental floss for effective plaque removal between teeth',120.00,NULL,'50 m','🦷',false,4.6,980,false),
  ('Teeth Whitening Strips','Dental Care','Crest','14-day professional whitening strips for visibly whiter teeth',580.00,680.00,'14 pairs','🦷',false,4.5,760,false),
  ('Gum Care Toothpaste 150g','Dental Care','Colgate','Clinically proven formula reducing gum problems and strengthening enamel',220.00,260.00,'150 g','🦷',false,4.7,1480,false),
  ('Tongue Cleaner Set','Dental Care','Generic','Stainless steel tongue scrapers for bacteria removal and fresh breath',80.00,NULL,'2 pieces','🦷',false,4.5,640,false),
  ('Orthodontic Wax 5 strips','Dental Care','Generic','Dental wax for covering sharp braces and preventing mouth irritation',150.00,NULL,'5 strips','🦷',false,4.4,420,false),
  ('Kids Strawberry Toothpaste','Dental Care','Colgate','Fluoride toothpaste with fun strawberry flavour for children 2-6 years',180.00,210.00,'80 g','🦷',false,4.8,1680,true),
  ('Ensure Nutrition Powder 400g','Nutrition','Abbott','Complete balanced nutrition shake for adults needing dietary supplementation',790.00,920.00,'400 g','💪',false,4.8,1940,true),
  ('Horlicks Original 500g','Nutrition','GSK','Malted milk drink with 23 vital nutrients for health and vitality',450.00,520.00,'500 g','💪',false,4.7,2340,true),
  ('Milo Chocolate Malt 400g','Nutrition','Nestle','Cocoa and malt energy drink rich in iron, calcium and vitamins',380.00,440.00,'400 g','💪',false,4.7,2100,false),
  ('Complan Chocolate 500g','Nutrition','Heinz','Energy drink with 34 vital nutrients for growth and development',420.00,490.00,'500 g','💪',false,4.6,1680,false),
  ('Whey Protein Chocolate 500g','Nutrition','Optimum','Fast-absorbing whey protein isolate for post-workout muscle recovery',890.00,1050.00,'500 g','💪',false,4.7,1240,false),
  ('Electrolyte Powder 10 sachets','Nutrition','Pocari','Ionic drink powder replenishing minerals lost through sweat and exercise',280.00,330.00,'10 sachets','💪',false,4.6,980,false),
  ('BCAA Supplement 200g','Nutrition','MuscleBlaze','Branched-chain amino acids for muscle synthesis and exercise recovery',780.00,920.00,'200 g','💪',false,4.6,680,false),
  ('Collagen Peptides Powder','Nutrition','Vital','Hydrolysed marine collagen for skin elasticity, joints and hair health',690.00,820.00,'200 g','💪',false,4.7,920,false),
  ('Apple Cider Vinegar 500ml','Nutrition','Bragg','Raw unfiltered apple cider vinegar with mother for metabolism support',380.00,440.00,'500 ml','🍎',false,4.5,1560,false),
  ('Green Tea Extract 60 caps','Nutrition','GNC','High-potency EGCG green tea extract for metabolism and antioxidant support',450.00,530.00,'60 capsules','🍵',false,4.6,840,false)
) AS t(name,category,brand,description,price,original_price,unit,emoji,requires_prescription,rating,reviews_count,is_featured)
WHERE NOT EXISTS (SELECT 1 FROM medicines LIMIT 1);
