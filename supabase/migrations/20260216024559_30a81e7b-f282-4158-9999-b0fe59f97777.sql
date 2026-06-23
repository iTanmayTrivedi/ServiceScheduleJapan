
-- Allow all authenticated users to see staff/admin roles (needed for booking flow)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT
USING (true);
