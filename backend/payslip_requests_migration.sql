-- Run in Supabase SQL Editor

CREATE TABLE public.payslip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, month)
);

CREATE INDEX idx_payslip_requests_user ON payslip_requests(user_id);
CREATE INDEX idx_payslip_requests_status ON payslip_requests(status);
