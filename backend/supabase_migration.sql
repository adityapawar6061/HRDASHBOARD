-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance logs
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  punch_in_time TIMESTAMPTZ NOT NULL,
  punch_out_time TIMESTAMPTZ,
  punch_in_lat DECIMAL(10, 8),
  punch_in_lng DECIMAL(11, 8),
  punch_out_lat DECIMAL(10, 8),
  punch_out_lng DECIMAL(11, 8),
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign assignments
CREATE TABLE public.campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Salaries
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- format: YYYY-MM
  total_days INTEGER NOT NULL DEFAULT 0,
  per_day_pay DECIMAL(10, 2) NOT NULL,
  deductions DECIMAL(10, 2) DEFAULT 0,
  total_salary DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Indexes
CREATE INDEX idx_attendance_user_id ON attendance_logs(user_id);
CREATE INDEX idx_attendance_punch_in ON attendance_logs(punch_in_time);
CREATE INDEX idx_campaign_assignments_user ON campaign_assignments(user_id);
CREATE INDEX idx_salaries_user_month ON salaries(user_id, month);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (backend uses service role key, bypasses RLS)
-- These are for direct client access if needed
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Employees can view own logs" ON public.attendance_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employees can insert own logs" ON public.attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
