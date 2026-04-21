-- =====================================================
-- CardSocial - Database Schema
-- PostgreSQL (Supabase)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}',
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION MEMBERS (Multi-tenant user roles)
-- =====================================================
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'validator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- =====================================================
-- BENEFICIARIES
-- =====================================================
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  rut TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  address TEXT,
  date_of_birth DATE,
  custom_fields JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, rut)
);

-- =====================================================
-- DIGITAL CARDS
-- =====================================================
CREATE TABLE digital_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_number TEXT UNIQUE NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'revoked')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- BENEFITS
-- =====================================================
CREATE TABLE benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'subsidy' CHECK (type IN ('subsidy', 'bonus', 'aid', 'other')),
  total_quantity INTEGER,
  remaining_quantity INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'exhausted')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BENEFIT ASSIGNMENTS
-- =====================================================
CREATE TABLE benefit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(benefit_id, beneficiary_id)
);

-- =====================================================
-- VALIDATION LOGS (Audit trail / blockchain-ready)
-- =====================================================
CREATE TABLE validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES benefit_assignments(id) ON DELETE SET NULL,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  card_id UUID REFERENCES digital_cards(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  validated_by UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('scan', 'validate', 'mark_used', 'revoke', 'block')),
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'denied')),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  -- Future blockchain integration
  blockchain_tx_hash TEXT,
  blockchain_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_beneficiaries_org ON beneficiaries(org_id);
CREATE INDEX idx_beneficiaries_rut ON beneficiaries(rut);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX idx_digital_cards_qr ON digital_cards(qr_code);
CREATE INDEX idx_digital_cards_beneficiary ON digital_cards(beneficiary_id);
CREATE INDEX idx_benefits_org ON benefits(org_id);
CREATE INDEX idx_benefit_assignments_beneficiary ON benefit_assignments(beneficiary_id);
CREATE INDEX idx_benefit_assignments_benefit ON benefit_assignments(benefit_id);
CREATE INDEX idx_validation_logs_org ON validation_logs(org_id);
CREATE INDEX idx_validation_logs_created ON validation_logs(created_at);
CREATE INDEX idx_org_members_user ON org_members(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = org_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: Check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_org_role(org_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = org_uuid 
      AND user_id = auth.uid()
      AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (is_org_member(id));

CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (has_org_role(id, 'owner'));

-- Org members policies
CREATE POLICY "Members can view org members" ON org_members
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Owners can manage members" ON org_members
  FOR ALL USING (has_org_role(org_id, 'owner'));

-- Beneficiaries policies
CREATE POLICY "Members can view beneficiaries" ON beneficiaries
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Admins can manage beneficiaries" ON beneficiaries
  FOR ALL USING (
    is_org_member(org_id) AND (
      has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')
    )
  );

-- Digital cards policies
CREATE POLICY "Members can view cards" ON digital_cards
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Admins can manage cards" ON digital_cards
  FOR ALL USING (
    is_org_member(org_id) AND (
      has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')
    )
  );

-- Benefits policies
CREATE POLICY "Members can view benefits" ON benefits
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Admins can manage benefits" ON benefits
  FOR ALL USING (
    is_org_member(org_id) AND (
      has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')
    )
  );

-- Benefit assignments policies
CREATE POLICY "Members can view assignments" ON benefit_assignments
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Admins and validators can manage assignments" ON benefit_assignments
  FOR ALL USING (
    is_org_member(org_id) AND (
      has_org_role(org_id, 'owner') OR 
      has_org_role(org_id, 'admin') OR
      has_org_role(org_id, 'validator')
    )
  );

-- Validation logs policies
CREATE POLICY "Members can view logs" ON validation_logs
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Members can create logs" ON validation_logs
  FOR INSERT WITH CHECK (is_org_member(org_id));

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('photos', 'logos') AND auth.role() = 'authenticated');

CREATE POLICY "Public can view photos and logos" ON storage.objects
  FOR SELECT USING (bucket_id IN ('photos', 'logos'));

CREATE POLICY "Authenticated users can delete their uploads" ON storage.objects
  FOR DELETE USING (bucket_id IN ('photos', 'logos') AND auth.role() = 'authenticated');

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_beneficiaries
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_benefits
  BEFORE UPDATE ON benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
