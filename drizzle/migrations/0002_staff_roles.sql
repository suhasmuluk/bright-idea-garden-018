CREATE TYPE public.app_role AS ENUM ('admin','staff');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- First account to sign up becomes the shop admin; later accounts need a role granted.
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.assign_first_admin() FROM anon, authenticated, public;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

DROP POLICY "staff read" ON public.bookings;
DROP POLICY "staff insert" ON public.bookings;
DROP POLICY "staff update" ON public.bookings;
DROP POLICY "staff delete" ON public.bookings;
CREATE POLICY "staff read" ON public.bookings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update" ON public.bookings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "staff read settings" ON public.shop_settings;
DROP POLICY "staff update settings" ON public.shop_settings;
CREATE POLICY "staff read settings" ON public.shop_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin update settings" ON public.shop_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY "staff read photos" ON storage.objects;
DROP POLICY "staff upload photos" ON storage.objects;
DROP POLICY "staff update photos" ON storage.objects;
DROP POLICY "staff delete photos" ON storage.objects;
CREATE POLICY "staff read photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'idol-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'idol-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "owner update photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'idol-photos' AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))) WITH CHECK (bucket_id = 'idol-photos' AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "owner delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'idol-photos' AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));