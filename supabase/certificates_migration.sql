-- CardSocial - Migration for Certificates System
-- Execute this in your Supabase SQL Editor

-- 1. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  folio INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('socio_activo', 'socio_inactivo', 'residente')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  reason TEXT NOT NULL,
  cost INTEGER NOT NULL,
  resident_data JSONB DEFAULT '{}',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add starting folio to organizations (to customize starting number)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_certificate_folio INTEGER DEFAULT 0;

-- 3. Enable RLS for certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 4. Policies for certificates
CREATE POLICY "Members can view certificates" ON certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = certificates.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage certificates" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_id = certificates.org_id 
        AND user_id = auth.uid() 
        AND (role = 'owner' OR role = 'admin')
    )
  );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_org_type ON certificates(org_id, type);
CREATE INDEX IF NOT EXISTS idx_certificates_org_folio ON certificates(org_id, folio);
CREATE INDEX IF NOT EXISTS idx_certificates_org_status ON certificates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at DESC);

-- 6. Helper function to get next folio (transaction safe)
CREATE OR REPLACE FUNCTION increment_org_folio(target_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_folio INTEGER;
BEGIN
  UPDATE organizations 
  SET last_certificate_folio = last_certificate_folio + 1 
  WHERE id = target_org_id 
  RETURNING last_certificate_folio INTO next_folio;
  
  RETURN next_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
