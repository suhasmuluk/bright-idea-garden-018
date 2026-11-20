CREATE SEQUENCE public.booking_no_seq;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no text UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  booking_date date NOT NULL DEFAULT current_date,
  idol_name text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  photo_url text,
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  advance_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
  balance_amount numeric(12,2) GENERATED ALWAYS AS (total_amount - advance_amount) STORED,
  status text NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked','Advance Paid','Fully Paid','Delivered','Cancelled')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (advance_amount <= total_amount)
);

CREATE OR REPLACE FUNCTION public.set_booking_no() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.booking_no IS NULL THEN
    NEW.booking_no := 'BK-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_no_seq')::text, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_no BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_no();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
GRANT USAGE ON SEQUENCE public.booking_no_seq TO authenticated, service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update" ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff delete" ON public.bookings FOR DELETE TO authenticated USING (true);

CREATE TABLE public.shop_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name text NOT NULL DEFAULT 'Shree Ganesh Murti Kendra',
  shop_address text NOT NULL DEFAULT '',
  shop_phone text NOT NULL DEFAULT '',
  logo_url text,
  rules text[] NOT NULL DEFAULT ARRAY[
    'Booking will be confirmed only after payment of the advance amount.',
    'Advance payment is non-refundable after confirmation.',
    'Any customization or additional requirements must be finalized at the time of booking.',
    'The remaining balance must be paid before idol delivery.',
    'Delivery date and time will be communicated separately.',
    'Changes to the idol design after confirmation may incur additional charges.'
  ]
);
INSERT INTO public.shop_settings (id) VALUES (1);
GRANT SELECT, UPDATE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read settings" ON public.shop_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update settings" ON public.shop_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);