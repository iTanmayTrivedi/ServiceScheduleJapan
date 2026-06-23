
-- Fix appointments policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT
USING ((auth.uid() = user_id) OR is_admin(auth.uid()) OR ((staff_id IS NOT NULL) AND (auth.uid() = staff_id)));

CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE
USING ((auth.uid() = user_id) OR is_admin(auth.uid()) OR ((staff_id IS NOT NULL) AND (auth.uid() = staff_id)));

CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- Fix business_hours policies
DROP POLICY IF EXISTS "Anyone can view business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admins can insert business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admins can update business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Admins can delete business hours" ON public.business_hours;

CREATE POLICY "Anyone can view business hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Admins can insert business hours" ON public.business_hours FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update business hours" ON public.business_hours FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete business hours" ON public.business_hours FOR DELETE USING (is_admin(auth.uid()));

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT
USING ((auth.uid() = user_id) OR is_admin(auth.uid()) OR is_staff(user_id));

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix services policies
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins can insert services" ON public.services FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE USING (is_admin(auth.uid()));

-- Fix staff_availability policies
DROP POLICY IF EXISTS "Anyone can view staff availability" ON public.staff_availability;
DROP POLICY IF EXISTS "Staff can insert own availability" ON public.staff_availability;
DROP POLICY IF EXISTS "Staff can update own availability" ON public.staff_availability;
DROP POLICY IF EXISTS "Staff can delete own availability" ON public.staff_availability;

CREATE POLICY "Anyone can view staff availability" ON public.staff_availability FOR SELECT USING (true);
CREATE POLICY "Staff can insert own availability" ON public.staff_availability FOR INSERT WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Staff can update own availability" ON public.staff_availability FOR UPDATE USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));
CREATE POLICY "Staff can delete own availability" ON public.staff_availability FOR DELETE USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "System inserts roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

CREATE POLICY "System inserts roles" ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);
