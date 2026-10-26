-- CommissionFlow Database Schema
-- Version: 001
-- Description: Core tables for businesses, profiles, services, and entries

-- ============================================
-- 1. BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for owner lookup
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "businesses_select_own" ON public.businesses 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "businesses_insert_own" ON public.businesses 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "businesses_update_own" ON public.businesses 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "businesses_delete_own" ON public.businesses 
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- 2. PROFILES TABLE (for all users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 3. STAFF PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 50.00,
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat', 'tiered')),
  tiered_rates JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_business ON public.staff_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON public.staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON public.staff_profiles(status);

-- Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Staff can see their own profile
CREATE POLICY "staff_profiles_select_own" ON public.staff_profiles 
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all staff in their business
CREATE POLICY "staff_profiles_select_admin" ON public.staff_profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = staff_profiles.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Admins can insert staff profiles
CREATE POLICY "staff_profiles_insert_admin" ON public.staff_profiles 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = staff_profiles.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Admins can update staff profiles in their business
CREATE POLICY "staff_profiles_update_admin" ON public.staff_profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = staff_profiles.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Admins can delete staff profiles
CREATE POLICY "staff_profiles_delete_admin" ON public.staff_profiles 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = staff_profiles.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- ============================================
-- 4. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_price DECIMAL(10,2) NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Staff in business can view services
CREATE POLICY "services_select_staff" ON public.services 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles 
      WHERE staff_profiles.business_id = services.business_id 
      AND staff_profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Admins can manage services
CREATE POLICY "services_insert_admin" ON public.services 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "services_update_admin" ON public.services 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "services_delete_admin" ON public.services 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- ============================================
-- 5. ENTRIES TABLE (commission entries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  client_name TEXT,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gross_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_business ON public.entries(business_id);
CREATE INDEX IF NOT EXISTS idx_entries_staff ON public.entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_service_date ON public.entries(service_date);
CREATE INDEX IF NOT EXISTS idx_entries_created ON public.entries(created_at DESC);

-- Enable RLS
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Staff can view their own entries
CREATE POLICY "entries_select_own" ON public.entries 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles 
      WHERE staff_profiles.id = entries.staff_id 
      AND staff_profiles.user_id = auth.uid()
    )
  );

-- Admins can view all entries in their business
CREATE POLICY "entries_select_admin" ON public.entries 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = entries.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Staff can insert their own entries
CREATE POLICY "entries_insert_own" ON public.entries 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles 
      WHERE staff_profiles.id = entries.staff_id 
      AND staff_profiles.user_id = auth.uid()
      AND staff_profiles.business_id = entries.business_id
    )
  );

-- Staff can update their own pending entries
CREATE POLICY "entries_update_own" ON public.entries 
  FOR UPDATE USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.staff_profiles 
      WHERE staff_profiles.id = entries.staff_id 
      AND staff_profiles.user_id = auth.uid()
    )
  );

-- Admins can update any entry in their business
CREATE POLICY "entries_update_admin" ON public.entries 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = entries.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Staff can delete their own pending entries
CREATE POLICY "entries_delete_own" ON public.entries 
  FOR DELETE USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.staff_profiles 
      WHERE staff_profiles.id = entries.staff_id 
      AND staff_profiles.user_id = auth.uid()
    )
  );

-- Admins can delete entries in their business
CREATE POLICY "entries_delete_admin" ON public.entries 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = entries.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. ENTRY AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.entry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_audit_entry ON public.entry_audit_log(entry_id);

-- Enable RLS
ALTER TABLE public.entry_audit_log ENABLE ROW LEVEL SECURITY;

-- Staff can view audit logs for their entries
CREATE POLICY "audit_select_own" ON public.entry_audit_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entries e
      JOIN public.staff_profiles sp ON sp.id = e.staff_id
      WHERE e.id = entry_audit_log.entry_id
      AND sp.user_id = auth.uid()
    )
  );

-- Admins can view all audit logs in their business
CREATE POLICY "audit_select_admin" ON public.entry_audit_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entries e
      JOIN public.businesses b ON b.id = e.business_id
      WHERE e.id = entry_audit_log.entry_id
      AND b.owner_id = auth.uid()
    )
  );

-- ============================================
-- 7. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.businesses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.staff_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.services;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.entries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
