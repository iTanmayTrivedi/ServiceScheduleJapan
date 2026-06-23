
-- Add foreign key from appointments.staff_id to profiles.user_id
-- First we need to handle the fact that staff_id can be null
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES public.profiles(user_id);
