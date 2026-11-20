ALTER TABLE public.bookings ADD COLUMN delivery_date date, ADD COLUMN delivery_time time, ADD COLUMN production_status text NOT NULL DEFAULT 'Booked', ADD COLUMN initial_payment_mode text NOT NULL DEFAULT 'Cash';
UPDATE public.bookings SET production_status = CASE WHEN status IN ('Delivered','Cancelled') THEN status ELSE 'Booked' END;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_production_status_check CHECK (production_status IN ('Booked','In Production','Ready for Pickup','Delivered','Cancelled')), ADD CONSTRAINT bookings_initial_mode_check CHECK (initial_payment_mode IN ('Cash','UPI','Bank')), ADD CONSTRAINT bookings_delivery_time_check CHECK (delivery_time IS NULL OR delivery_date IS NOT NULL);
CREATE TABLE public.booking_payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE, amount numeric NOT NULL CHECK (amount > 0 AND amount = round(amount,2)), payment_date date NOT NULL DEFAULT CURRENT_DATE, payment_mode text CHECK (payment_mode IN ('Cash','UPI','Bank')), is_opening_balance boolean NOT NULL DEFAULT false, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.booking_payments TO authenticated;
GRANT ALL ON public.booking_payments TO service_role;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read payment history" ON public.booking_payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff record payments" ON public.booking_payments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid() AND payment_mode IS NOT NULL AND NOT is_opening_balance);
CREATE INDEX booking_payments_booking_idx ON public.booking_payments(booking_id);
CREATE INDEX bookings_delivery_idx ON public.bookings(delivery_date);
INSERT INTO public.booking_payments (booking_id,amount,payment_date,payment_mode,is_opening_balance,created_by,created_at) SELECT id,advance_amount,booking_date,NULL,true,created_by,created_at FROM public.bookings WHERE advance_amount > 0;
CREATE FUNCTION public.validate_booking_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE booking_total numeric; paid numeric;
BEGIN
 SELECT total_amount INTO booking_total FROM public.bookings WHERE id = NEW.booking_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
 SELECT coalesce(sum(amount),0) INTO paid FROM public.booking_payments WHERE booking_id = NEW.booking_id;
 IF NEW.amount <= 0 OR NEW.amount <> round(NEW.amount,2) THEN RAISE EXCEPTION 'Enter a positive payment with at most two decimal places'; END IF;
 IF paid + NEW.amount > booking_total THEN RAISE EXCEPTION 'Payment cannot exceed the remaining balance'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_booking_payment BEFORE INSERT ON public.booking_payments FOR EACH ROW EXECUTE FUNCTION public.validate_booking_payment();
CREATE FUNCTION public.sync_booking_paid() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.bookings SET advance_amount = (SELECT coalesce(sum(amount),0) FROM public.booking_payments WHERE booking_id = NEW.booking_id), updated_at = now() WHERE id = NEW.booking_id;
 RETURN NEW;
END $$;
CREATE TRIGGER sync_booking_paid AFTER INSERT ON public.booking_payments FOR EACH ROW EXECUTE FUNCTION public.sync_booking_paid();
CREATE FUNCTION public.preserve_booking_payment_total() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 SELECT coalesce(sum(amount),0) INTO NEW.advance_amount FROM public.booking_payments WHERE booking_id = OLD.id;
 IF NEW.total_amount < NEW.advance_amount THEN RAISE EXCEPTION 'Total amount cannot be less than recorded payments'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preserve_booking_payment_total BEFORE UPDATE OF advance_amount,total_amount ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.preserve_booking_payment_total();
CREATE FUNCTION public.record_initial_booking_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.advance_amount > 0 THEN
 INSERT INTO public.booking_payments (booking_id,amount,payment_date,payment_mode,created_by) VALUES (NEW.id,NEW.advance_amount,NEW.booking_date,NEW.initial_payment_mode,NEW.created_by);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER record_initial_booking_payment AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.record_initial_booking_payment();
REVOKE ALL ON FUNCTION public.validate_booking_payment(),public.sync_booking_paid(),public.preserve_booking_payment_total(),public.record_initial_booking_payment() FROM PUBLIC,anon,authenticated;