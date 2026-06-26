
-- Align schema with application code expectations

-- profiles: add banner image
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- appointments: code references user_id (was customer_id)
ALTER TABLE public.appointments RENAME COLUMN customer_id TO user_id;

-- ratings: code references user_id (was customer_id)
ALTER TABLE public.ratings RENAME COLUMN customer_id TO user_id;

-- business_hours: code uses start_time/end_time/is_open
ALTER TABLE public.business_hours RENAME COLUMN open_time TO start_time;
ALTER TABLE public.business_hours RENAME COLUMN close_time TO end_time;
ALTER TABLE public.business_hours ADD COLUMN is_open boolean NOT NULL DEFAULT true;
UPDATE public.business_hours SET is_open = NOT is_closed;
ALTER TABLE public.business_hours DROP COLUMN is_closed;
