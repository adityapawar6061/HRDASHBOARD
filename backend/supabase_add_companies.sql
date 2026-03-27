-- Run this in Supabase SQL Editor

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add company_id to users
ALTER TABLE public.users
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view companies" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');
