-- ============================================================================
-- ELECTRORECK SOCIETY — NIT KURUKSHETRA
-- SUPABASE COMPLETE DATABASE SCHEMA & SECURITY POLICIES
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('Pending', 'Confirmed', 'Rejected', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE induction_status AS ENUM ('Pending', 'Accepted', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE SEQUENCE IF NOT EXISTS pass_seq START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    coordinator_event_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    venue TEXT NOT NULL DEFAULT '[PLACEHOLDER_VENUE: LHC, NIT Kurukshetra]',
    event_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    registration_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '25 days'),
    max_seats INTEGER NOT NULL DEFAULT 50 CHECK (max_seats > 0),
    min_team_size INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
    max_team_size INTEGER NOT NULL DEFAULT 1 CHECK (max_team_size >= min_team_size),
    is_registration_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$ BEGIN
    ALTER TABLE public.profiles
    ADD CONSTRAINT fk_coordinator_event 
    FOREIGN KEY (coordinator_event_id) REFERENCES public.events(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 4. WINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 5. EVENT REGISTRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id TEXT NOT NULL UNIQUE DEFAULT ('ER-2026-' || LPAD(nextval('pass_seq')::text, 5, '0')),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    roll_number TEXT NOT NULL CHECK (roll_number ~ '^[0-9]{9}$'),
    department TEXT NOT NULL,
    year_of_study TEXT NOT NULL,
    phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
    team_name TEXT,
    team_members JSONB DEFAULT '[]'::jsonb,
    status registration_status NOT NULL DEFAULT 'Confirmed',
    consent_given BOOLEAN NOT NULL CHECK (consent_given = true),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT unique_user_per_event UNIQUE (event_id, user_id),
    CONSTRAINT unique_roll_per_event UNIQUE (event_id, roll_number)
);

-- ============================================================================
-- 6. SOCIETY INDUCTION APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.induction_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    roll_number TEXT NOT NULL UNIQUE CHECK (roll_number ~ '^[0-9]{9}$'),
    department TEXT NOT NULL,
    year_of_study TEXT NOT NULL,
    phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
    preferred_wing_id UUID NOT NULL REFERENCES public.wings(id) ON DELETE RESTRICT,
    reason_for_joining TEXT NOT NULL CHECK (char_length(reason_for_joining) BETWEEN 10 AND 500),
    consent_given BOOLEAN NOT NULL CHECK (consent_given = true),
    status induction_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_for_event(p_event_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND (
        role = 'admin' 
        OR (role = 'coordinator' AND coordinator_event_id = p_event_id)
      )
  );
$$;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- A. Email Domain Restriction & Profile Auto-Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allowed_domain TEXT := '@nitkkr.ac.in';
BEGIN
    IF lower(NEW.email) NOT LIKE ('%' || allowed_domain) THEN
        RAISE EXCEPTION 'Registration restricted: Only college email addresses ending in % are permitted.', allowed_domain;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        lower(NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
        'student'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Prevent Non-Admin from Changing Roles
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.coordinator_event_id IS DISTINCT FROM NEW.coordinator_event_id) THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied: Only a Super Admin can alter user roles or coordinator event assignments.';
        END IF;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();

-- C. Validate Event Registration Rules (Capacity, Deadline, Status, Team Size)
CREATE OR REPLACE FUNCTION public.validate_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_event public.events%ROWTYPE;
    active_count INTEGER;
    team_count INTEGER;
BEGIN
    SELECT * INTO target_event FROM public.events WHERE id = NEW.event_id FOR SHARE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected event does not exist.';
    END IF;

    IF NOT target_event.is_registration_open THEN
        RAISE EXCEPTION 'Registration for "%" is currently closed.', target_event.title;
    END IF;

    IF now() > target_event.registration_deadline THEN
        RAISE EXCEPTION 'Registration deadline for "%" has passed.', target_event.title;
    END IF;

    -- Rejected and Cancelled registrations DO NOT count against seats
    SELECT count(*) INTO active_count
    FROM public.event_registrations
    WHERE event_id = NEW.event_id
      AND status NOT IN ('Rejected', 'Cancelled');

    IF active_count >= target_event.max_seats THEN
        RAISE EXCEPTION 'Event "%" has reached maximum capacity (% seats filled).', target_event.title, target_event.max_seats;
    END IF;

    IF target_event.max_team_size > 1 THEN
        team_count := 1 + COALESCE(jsonb_array_length(NEW.team_members), 0);
        IF team_count < target_event.min_team_size OR team_count > target_event.max_team_size THEN
            RAISE EXCEPTION 'Team size for "%" must be between % and % members (provided: %).',
                target_event.title, target_event.min_team_size, target_event.max_team_size, team_count;
        END IF;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_event_registration ON public.event_registrations;
CREATE TRIGGER trg_validate_event_registration
    BEFORE INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.validate_event_registration();

-- ============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.induction_applications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid() OR public.is_admin()
    );

-- EVENTS POLICIES
DROP POLICY IF EXISTS "events_public_select" ON public.events;
CREATE POLICY "events_public_select" ON public.events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
CREATE POLICY "events_admin_insert" ON public.events
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "events_coordinator_admin_update" ON public.events;
CREATE POLICY "events_coordinator_admin_update" ON public.events
    FOR UPDATE USING (public.is_coordinator_for_event(id));

DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
CREATE POLICY "events_admin_delete" ON public.events
    FOR DELETE USING (public.is_admin());

-- WINGS POLICIES
DROP POLICY IF EXISTS "wings_public_select" ON public.wings;
CREATE POLICY "wings_public_select" ON public.wings
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "wings_admin_manage" ON public.wings;
CREATE POLICY "wings_admin_manage" ON public.wings
    FOR ALL USING (public.is_admin());

-- EVENT REGISTRATIONS POLICIES
DROP POLICY IF EXISTS "event_reg_select_policy" ON public.event_registrations;
CREATE POLICY "event_reg_select_policy" ON public.event_registrations
    FOR SELECT USING (
        user_id = auth.uid() 
        OR public.is_coordinator_for_event(event_id)
    );

DROP POLICY IF EXISTS "event_reg_insert_policy" ON public.event_registrations;
CREATE POLICY "event_reg_insert_policy" ON public.event_registrations
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "event_reg_update_policy" ON public.event_registrations;
CREATE POLICY "event_reg_update_policy" ON public.event_registrations
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR public.is_coordinator_for_event(event_id)
    );

-- INDUCTION APPLICATIONS POLICIES
DROP POLICY IF EXISTS "induction_select_policy" ON public.induction_applications;
CREATE POLICY "induction_select_policy" ON public.induction_applications
    FOR SELECT USING (
        user_id = auth.uid() 
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "induction_insert_policy" ON public.induction_applications;
CREATE POLICY "induction_insert_policy" ON public.induction_applications
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "induction_update_policy" ON public.induction_applications;
CREATE POLICY "induction_update_policy" ON public.induction_applications
    FOR UPDATE USING (
        public.is_admin()
    );

-- ============================================================================
-- 10. INITIAL SEED DATA
-- ============================================================================
INSERT INTO public.events (slug, title, category, tagline, description, venue, event_date, registration_deadline, max_seats, min_team_size, max_team_size, is_registration_open)
VALUES
('electrica', 'Electrica', 'Cultural', 'Where circuits meet creativity', 
 'Flagship cultural quiz and creative electrical engineering competition.', 
 '[PLACEHOLDER_VENUE: Lecture Hall Complex, NIT Kurukshetra]', now() + INTERVAL '20 days', now() + INTERVAL '18 days', 50, 1, 2, true),

('advanza', 'Advanza', 'Technical', 'Engineer the future, advertise the value', 
 'Real-world circuit design and power solutions presentation challenge.', 
 '[PLACEHOLDER_VENUE: Seminar Hall, Electrical Engineering Block, NIT KKR]', now() + INTERVAL '21 days', now() + INTERVAL '19 days', 70, 2, 4, true),

('digispark', 'Digispark', 'Technical', 'Logic meets innovation', 
 'Digital logic design, FPGA systems, and microcontroller interfacing challenge.', 
 '[PLACEHOLDER_VENUE: Digital Systems Lab, Electrical Block, NIT KKR]', now() + INTERVAL '22 days', now() + INTERVAL '20 days', 60, 1, 3, true),

('vidhwaan', 'Vidhwaan', 'Research', 'Design the national power grid', 
 'Premier research and national power grid simulation event.', 
 '[PLACEHOLDER_VENUE: Conference Hall, Admin Block, NIT Kurukshetra]', now() + INTERVAL '23 days', now() + INTERVAL '21 days', 40, 3, 5, true)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    category = EXCLUDED.category,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description;

INSERT INTO public.wings (name, description, display_order, is_active)
VALUES
('Technical (Core Electrical & Circuit Design)', 'Focuses on power electronics, machinery, and circuit modeling.', 1, true),
('Embedded Systems & IoT / AI', 'Microcontroller firmware, sensors, and machine intelligence in EE.', 2, true),
('Web & Software Operations', 'Society portal, event automation, and software engineering.', 3, true),
('Corporate Relations & Sponsorship', 'Industry partnerships, alumni network, and fest budget management.', 4, true),
('Media, Design & Public Relations', 'Visual design, branding, coverage, and creative outreach.', 5, true)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;
