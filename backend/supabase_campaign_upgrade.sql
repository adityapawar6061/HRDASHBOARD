-- Run this in Supabase SQL Editor

-- Add new fields to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN location_lat DECIMAL(10, 8),
  ADD COLUMN location_lng DECIMAL(11, 8),
  ADD COLUMN location_radius_meters INTEGER DEFAULT 200,
  ADD COLUMN min_hours DECIMAL(4, 2) DEFAULT 5,
  ADD COLUMN salary_per_min_hours DECIMAL(10, 2) DEFAULT 500;

-- Add campaign_id to attendance_logs so each punch is tied to a campaign
ALTER TABLE public.attendance_logs
  ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Campaign salary breakdowns (one row per user per campaign per month)
CREATE TABLE public.salary_campaign_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id UUID NOT NULL REFERENCES public.salaries(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  total_hours DECIMAL(8, 2) DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  salary_earned DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also add total_hours to salaries
ALTER TABLE public.salaries
  ADD COLUMN total_hours DECIMAL(8, 2) DEFAULT 0;

CREATE INDEX idx_attendance_campaign ON attendance_logs(campaign_id);
CREATE INDEX idx_breakdown_salary ON salary_campaign_breakdowns(salary_id);
