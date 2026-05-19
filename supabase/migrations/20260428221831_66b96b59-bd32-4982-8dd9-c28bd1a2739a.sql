-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  preview_path TEXT NOT NULL,
  original_path TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_photos_category ON public.photos(category_id);
CREATE INDEX idx_photos_tags ON public.photos USING GIN (tags);
CREATE POLICY "photos public read published" ON public.photos FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins read all photos" ON public.photos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage photos" ON public.photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cart items
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, photo_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart owner all" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Purchases
CREATE TYPE public.purchase_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status purchase_status NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases owner read" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all purchases" ON public.purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE RESTRICT,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_items owner read" ON public.purchase_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.user_id = auth.uid()));
CREATE POLICY "admins read all purchase items" ON public.purchase_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper to check if user owns a paid photo
CREATE OR REPLACE FUNCTION public.user_owns_photo(_user_id UUID, _photo_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.purchase_items pi
    JOIN public.purchases p ON p.id = pi.purchase_id
    WHERE pi.photo_id = _photo_id AND p.user_id = _user_id AND p.status = 'paid'
  )
$$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('photos-preview', 'photos-preview', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('photos-original', 'photos-original', false);

-- Preview is public read; only admins can write
CREATE POLICY "preview public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'photos-preview');
CREATE POLICY "preview admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos-preview' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "preview admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos-preview' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "preview admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos-preview' AND public.has_role(auth.uid(), 'admin'));

-- Original: only admins can write; reads will be done via signed URLs from server
CREATE POLICY "original admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos-original' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "original admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos-original' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "original admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos-original' AND public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Natureza', 'natureza'),
  ('Cidade', 'cidade'),
  ('Pessoas', 'pessoas'),
  ('Tecnologia', 'tecnologia'),
  ('Negócios', 'negocios'),
  ('Abstrato', 'abstrato');