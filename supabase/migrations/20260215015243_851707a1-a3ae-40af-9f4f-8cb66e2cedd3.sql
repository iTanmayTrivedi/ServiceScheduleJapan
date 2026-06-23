
-- Create staff_availability table
CREATE TABLE public.staff_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (staff_id, day_of_week)
);

ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

-- Everyone can view staff availability (needed for booking)
CREATE POLICY "Anyone can view staff availability" ON public.staff_availability
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert own availability" ON public.staff_availability
  FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update own availability" ON public.staff_availability
  FOR UPDATE USING (auth.uid() = staff_id OR is_admin(auth.uid()));

CREATE POLICY "Staff can delete own availability" ON public.staff_availability
  FOR DELETE USING (auth.uid() = staff_id OR is_admin(auth.uid()));

-- Add staff_id column to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS staff_id UUID;

-- Create is_staff function
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'staff'
  )
$$;

-- Update appointments RLS to include staff
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()) OR (staff_id IS NOT NULL AND auth.uid() = staff_id));

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()) OR (staff_id IS NOT NULL AND auth.uid() = staff_id));

-- Update profiles RLS so staff profiles are visible to everyone (for booking)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()) OR is_staff(user_id));
