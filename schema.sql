-- ====================================================================
-- HERITAGE ACUPUNCTURE & TRADITIONAL CHINESE MEDICINE
-- Database Schema for Appointment Booking & Clinic Owner Management
-- Target: PostgreSQL 14+ / Supabase
-- Compliance: Ontario PHIPA (Personal Health Information Protection Act)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_preference AS ENUM ('sms', 'phone', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM (
        'initial-acupuncture',     -- Initial Consultation & Acupuncture (75 min)
        'follow-up-acupuncture',   -- Acupuncture Follow-up & Treatment (50 min)
        'herbal-consultation',     -- Chinese Herbal Medicine Consultation (45 min)
        'cupping-guasha',          -- Therapeutic Cupping & Gua Sha (40 min)
        'massage-therapy'          -- TCM Massage / Tui Na Therapy (60 min)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CLINIC OPERATING SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS clinic_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
    day_name VARCHAR(20) NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    slot_interval_minutes INT NOT NULL DEFAULT 45,
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BLOCKED DATES & HOLIDAYS
CREATE TABLE IF NOT EXISTS clinic_blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocked_date DATE NOT NULL UNIQUE,
    reason VARCHAR(255) DEFAULT 'Clinic Closed / Holiday',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(12) NOT NULL UNIQUE,
    service service_type NOT NULL DEFAULT 'initial-acupuncture',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    
    -- Patient Information (PHIPA Sensitive)
    patient_name VARCHAR(120) NOT NULL,
    patient_phone VARCHAR(30) NOT NULL,
    patient_email VARCHAR(120),
    preferred_contact contact_preference NOT NULL DEFAULT 'phone',
    is_first_visit BOOLEAN NOT NULL DEFAULT true,
    chief_complaint TEXT,
    
    -- Clinical & Administrative (Owner Portal)
    status appointment_status NOT NULL DEFAULT 'pending',
    clinical_notes TEXT,
    internal_notes TEXT,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast portal queries and slot checks
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments (appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments (booking_reference);

-- 6. ROW LEVEL SECURITY (RLS) FOR PHIPA COMPLIANCE
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Public Anonymous Clients can view schedules and blocked dates to book
CREATE POLICY "Public can view clinic schedule"
    ON clinic_schedules FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public can view blocked dates"
    ON clinic_blocked_dates FOR SELECT
    TO anon, authenticated
    USING (true);

-- Public Anonymous Clients can insert their own appointment request
CREATE POLICY "Public can create appointment request"
    ON appointments FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'pending' AND 
        patient_name IS NOT NULL AND 
        patient_phone IS NOT NULL
    );

-- Only authenticated staff/practitioner (Dr. Leng) can view patient health data
CREATE POLICY "Staff can view all appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (true);

-- Only authenticated staff can update appointment status and add clinical notes
CREATE POLICY "Staff can update appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. SEED CLINIC OPERATING HOURS (Heritage Acupuncture Official Schedule)
INSERT INTO clinic_schedules (day_of_week, day_name, is_open, open_time, close_time, slot_interval_minutes, note)
VALUES 
    (1, 'Monday', true, '09:00:00', '18:00:00', 45, 'Regular Clinic'),
    (2, 'Tuesday', true, '09:00:00', '18:00:00', 45, 'Regular Clinic'),
    (3, 'Wednesday', true, '09:00:00', '18:00:00', 45, 'Regular Clinic'),
    (4, 'Thursday', true, '16:00:00', '20:00:00', 45, 'Evening Clinic'),
    (5, 'Friday', true, '09:00:00', '18:00:00', 45, 'Regular Clinic'),
    (6, 'Saturday', true, '10:00:00', '16:00:00', 60, 'By Appointment / Massage Therapy'),
    (0, 'Sunday', false, '09:00:00', '17:00:00', 45, 'Closed')
ON CONFLICT DO NOTHING;

-- 8. SEED MOCK APPOINTMENTS FOR CLINIC PORTAL TESTING
INSERT INTO appointments (
    booking_reference, service, appointment_date, appointment_time, duration_minutes,
    patient_name, patient_phone, patient_email, preferred_contact, is_first_visit,
    chief_complaint, status, clinical_notes, created_at
)
VALUES
    (
        'HA-8492', 'initial-acupuncture', CURRENT_DATE, '10:00:00', 75,
        'Sarah Miller', '613-555-0194', 'sarah.m@kanatatech.ca', 'sms', true,
        'Desk-job tech neck, severe right shoulder blade spasm and chronic tension headaches radiating up cervical spine. Wants Sun Life insurance receipt.',
        'confirmed', 'Examined cervical range of motion. Muscle spasms at GB20, BL10, SI14. Electro-acupuncture applied with IR heat lamp.',
        NOW() - INTERVAL '2 days'
    ),
    (
        'HA-8501', 'follow-up-acupuncture', CURRENT_DATE, '14:30:00', 50,
        'Robert Davies', '613-555-0142', 'robert.davies@bell.net', 'phone', false,
        'Lumbar spinal stenosis and left-sided sciatica radiating to calf. Second visit, reported 40% pain reduction after session 1.',
        'confirmed', 'Needled BL23, BL25, GB30, BL40. Patient reported improved gait and decreased morning stiffness.',
        NOW() - INTERVAL '1 day'
    ),
    (
        'HA-8517', 'initial-acupuncture', CURRENT_DATE + 1, '11:15:00', 75,
        'Zhang Wei (张伟)', '613-555-0188', 'zhangwei1953@gmail.com', 'phone', true,
        'Bilateral knee osteoarthritis (老寒腿), worse in damp weather, with mild insomnia. Prefers consultation in Mandarin.',
        'pending', NULL,
        NOW() - INTERVAL '3 hours'
    ),
    (
        'HA-8523', 'herbal-consultation', CURRENT_DATE + 1, '15:00:00', 45,
        'Brenda S.', '613-555-0177', 'brenda.s@rogers.com', 'email', false,
        'Chronic digestive fatigue, bloating after meals, and cold extremities. Follow-up herbal prescription renewal.',
        'pending', NULL,
        NOW() - INTERVAL '1 hour'
    ),
    (
        'HA-8530', 'cupping-guasha', CURRENT_DATE + 2, '16:45:00', 40,
        'David Tremblay', '613-555-0163', 'david.tremblay@ottawa.ca', 'sms', false,
        'Upper back and rhomboid tightness from weekend cycling marathon.',
        'pending', NULL,
        NOW() - INTERVAL '30 minutes'
    )
ON CONFLICT (booking_reference) DO NOTHING;
