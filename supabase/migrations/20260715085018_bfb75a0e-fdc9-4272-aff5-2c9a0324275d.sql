
-- Profiles: 1 per auth user
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  photo_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Family members: many per owner
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  photo_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own family" ON public.family_members FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Medical info: one row per profile OR family member (subject)
CREATE TABLE public.medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('self','family')),
  subject_id UUID NOT NULL,
  blood_group TEXT,
  allergies TEXT,
  conditions TEXT,
  disabilities TEXT,
  current_medications TEXT,
  past_surgeries TEXT,
  vaccinations TEXT,
  organ_donor BOOLEAN NOT NULL DEFAULT false,
  smoking BOOLEAN NOT NULL DEFAULT false,
  alcohol BOOLEAN NOT NULL DEFAULT false,
  pregnancy BOOLEAN NOT NULL DEFAULT false,
  insurance_provider TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_info TO authenticated;
GRANT ALL ON public.medical_info TO service_role;
ALTER TABLE public.medical_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own medical" ON public.medical_info FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('self','family')),
  subject_id UUID NOT NULL,
  name TEXT NOT NULL,
  relation TEXT,
  phone TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.emergency_contacts FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Documents metadata (files live in storage bucket 'medical-documents')
CREATE TABLE public.medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('self','family')),
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_documents TO authenticated;
GRANT ALL ON public.medical_documents TO service_role;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own docs" ON public.medical_documents FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Storage RLS for medical-documents bucket: users only touch files under {uid}/...
CREATE POLICY "user reads own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user uploads own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user updates own files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user deletes own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('self','family')),
  subject_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('medicine','vaccination','insurance','appointment','checkup')),
  title TEXT NOT NULL,
  notes TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.reminders FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Emergency codes: public QR handle
CREATE TABLE public.emergency_codes (
  code TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('self','family')),
  subject_id UUID NOT NULL,
  show_insurance BOOLEAN NOT NULL DEFAULT false,
  show_address BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_codes TO authenticated;
GRANT ALL ON public.emergency_codes TO service_role;
ALTER TABLE public.emergency_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages emergency code" ON public.emergency_codes FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Public function to read emergency profile by code (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_emergency_profile(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ec public.emergency_codes%ROWTYPE;
  subj JSONB;
  med public.medical_info%ROWTYPE;
  contacts JSONB;
BEGIN
  SELECT * INTO ec FROM public.emergency_codes WHERE code = _code AND active = true;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF ec.subject_type = 'self' THEN
    SELECT jsonb_build_object(
      'full_name', p.full_name,
      'date_of_birth', p.date_of_birth,
      'gender', p.gender,
      'photo_url', p.photo_url,
      'address', CASE WHEN ec.show_address THEN p.address ELSE NULL END
    ) INTO subj FROM public.profiles p WHERE p.id = ec.subject_id;
  ELSE
    SELECT jsonb_build_object(
      'full_name', f.full_name,
      'date_of_birth', f.date_of_birth,
      'gender', f.gender,
      'photo_url', f.photo_url,
      'relation', f.relation
    ) INTO subj FROM public.family_members f WHERE f.id = ec.subject_id;
  END IF;

  SELECT * INTO med FROM public.medical_info
    WHERE subject_type = ec.subject_type AND subject_id = ec.subject_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', name, 'relation', relation, 'phone', phone, 'is_primary', is_primary
    ) ORDER BY is_primary DESC), '[]'::jsonb)
    INTO contacts
    FROM public.emergency_contacts
    WHERE subject_type = ec.subject_type AND subject_id = ec.subject_id;

  RETURN jsonb_build_object(
    'code', ec.code,
    'subject', subj,
    'blood_group', med.blood_group,
    'allergies', med.allergies,
    'conditions', med.conditions,
    'current_medications', med.current_medications,
    'organ_donor', med.organ_donor,
    'insurance', CASE WHEN ec.show_insurance THEN jsonb_build_object(
        'provider', med.insurance_provider,
        'policy', med.insurance_policy,
        'expiry', med.insurance_expiry
      ) ELSE NULL END,
    'emergency_contacts', contacts
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_emergency_profile(TEXT) TO anon, authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_family_updated BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_medical_updated BEFORE UPDATE ON public.medical_info
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
