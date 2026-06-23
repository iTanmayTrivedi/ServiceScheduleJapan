-- ════════════════════════════════════════════════════════════════════════════
--  Enso Salon — Reservation System
--  Full database setup for a fresh Supabase project.
--  Run this entire file in: Supabase Dashboard → SQL Editor → New query.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. ENUMS ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM (
    'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. updated_at TRIGGER FUNCTION ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 3. PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 4. USER ROLES + has_role / is_admin / is_staff ─────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'staff'
  )
$$;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ─── 5. NEW USER TRIGGER (auto-create profile + role) ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 6. SERVICES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INT  NOT NULL DEFAULT 30,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  category         TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT TO anon, authenticated
  USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 7. BUSINESS HOURS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_hours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT  NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  open_time   TIME,
  close_time  TIME,
  is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT ALL ON public.business_hours TO service_role;

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business hours"
  ON public.business_hours FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admins can insert business hours"
  ON public.business_hours FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update business hours"
  ON public.business_hours FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete business hours"
  ON public.business_hours FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 8. STAFF AVAILABILITY ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week  INT  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.staff_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.staff_availability TO authenticated;
GRANT ALL ON public.staff_availability TO service_role;

ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff availability"
  ON public.staff_availability FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Staff can manage their own availability"
  ON public.staff_availability FOR ALL TO authenticated
  USING (auth.uid() = staff_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = staff_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert availability"
  ON public.staff_availability FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete availability"
  ON public.staff_availability FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = staff_id);

CREATE TRIGGER update_staff_availability_updated_at
  BEFORE UPDATE ON public.staff_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 9. APPOINTMENTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id       UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           public.appointment_status NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view their own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = staff_id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Customers create their own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers/staff/admins update appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = staff_id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Customers/admins delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 10. RATINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ratings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating         INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Customers can rate their own appointments"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own ratings"
  ON public.ratings FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id);

-- ─── 11. STORAGE BUCKET (avatars) ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── 12. SEED: default business hours (Mon–Sat open, Sun closed) ────────────
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, NULL,       NULL,       TRUE),   -- Sunday
  (1, '09:00',    '19:00',    FALSE),  -- Monday
  (2, '09:00',    '19:00',    FALSE),
  (3, '09:00',    '19:00',    FALSE),
  (4, '09:00',    '19:00',    FALSE),
  (5, '09:00',    '20:00',    FALSE),
  (6, '10:00',    '18:00',    FALSE)   -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
--  DONE.  Next steps:
--    1. Auth → Providers → enable Email (optionally Google).
--    2. Auth → URL Configuration → Site URL = http://localhost:8080
--    3. Sign up in the app, then promote yourself to admin:
--         UPDATE public.user_roles SET role = 'admin'
--         WHERE user_id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
-- ════════════════════════════════════════════════════════════════════════════
