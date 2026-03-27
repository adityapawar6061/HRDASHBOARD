-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Safe to run - uses IF NOT EXISTS everywhere
-- ============================================================

-- 1. Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add company_id to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 3. Add new columns to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS location_radius_meters INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS min_hours DECIMAL(4, 2) DEFAULT 5,
  ADD COLUMN IF NOT EXISTS salary_per_min_hours DECIMAL(10, 2) DEFAULT 500;

-- 4. Add campaign_id to attendance_logs
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 5. Add total_hours to salaries
ALTER TABLE public.salaries
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(8, 2) DEFAULT 0;

-- 6. Salary campaign breakdowns table
CREATE TABLE IF NOT EXISTS public.salary_campaign_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id UUID NOT NULL REFERENCES public.salaries(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  total_hours DECIMAL(8, 2) DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  salary_earned DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS for new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_campaign_breakdowns ENABLE ROW LEVEL SECURITY;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_campaign ON attendance_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_salary ON salary_campaign_breakdowns(salary_id);
