-- =====================================================
-- CardSocial - Finance Module Schema
-- PostgreSQL (Supabase)
-- =====================================================

-- 1. Create finance_settings table
CREATE TABLE IF NOT EXISTS finance_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  initial_bank_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  initial_cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(org_id, period_year)
);

-- 2. Create finance_categories table
CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'Tag',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name, type)
);

-- 3. Create finance_transactions table
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES finance_categories(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank', 'cash')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Miembros pueden ver configuración financiera" ON finance_settings;
DROP POLICY IF EXISTS "Miembros pueden ver categorías financieras" ON finance_categories;
DROP POLICY IF EXISTS "Miembros pueden ver transacciones financieras" ON finance_transactions;
DROP POLICY IF EXISTS "Admins pueden gestionar configuración financiera" ON finance_settings;
DROP POLICY IF EXISTS "Admins pueden gestionar categorías financieras" ON finance_categories;
DROP POLICY IF EXISTS "Admins pueden gestionar transacciones financieras" ON finance_transactions;

-- 6. Create Access Policies
-- Select: All organization members
CREATE POLICY "Miembros pueden ver configuración financiera" ON finance_settings
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Miembros pueden ver categorías financieras" ON finance_categories
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "Miembros pueden ver transacciones financieras" ON finance_transactions
  FOR SELECT USING (is_org_member(org_id));

-- Write / Management: Owners and Admins only
CREATE POLICY "Admins pueden gestionar configuración financiera" ON finance_settings
  FOR ALL USING (is_org_member(org_id) AND (has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')));

CREATE POLICY "Admins pueden gestionar categorías financieras" ON finance_categories
  FOR ALL USING (is_org_member(org_id) AND (has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')));

CREATE POLICY "Admins pueden gestionar transacciones financieras" ON finance_transactions
  FOR ALL USING (is_org_member(org_id) AND (has_org_role(org_id, 'owner') OR has_org_role(org_id, 'admin')));

-- 7. Add updated_at trigger for finance_settings
DROP TRIGGER IF EXISTS set_updated_at_finance_settings ON finance_settings;
CREATE TRIGGER set_updated_at_finance_settings
  BEFORE UPDATE ON finance_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Create function to initialize default categories
CREATE OR REPLACE FUNCTION initialize_default_categories(org_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Gastos
  INSERT INTO finance_categories (org_id, name, type, icon, is_default) VALUES
    (org_uuid, 'Alimentación', 'expense', 'Utensils', true),
    (org_uuid, 'Movilización y despacho', 'expense', 'Truck', true),
    (org_uuid, 'Publicidad y difusión', 'expense', 'Megaphone', true),
    (org_uuid, 'Merchandising', 'expense', 'Gift', true),
    (org_uuid, 'Materiales de infraestructura', 'expense', 'Home', true),
    (org_uuid, 'Materiales de oficina y papelería', 'expense', 'PenTool', true),
    (org_uuid, 'Gastos bancarios', 'expense', 'Landmark', true),
    (org_uuid, 'Materiales de aseo', 'expense', 'Trash2', true),
    (org_uuid, 'Implementos deportivos', 'expense', 'Trophy', true),
    (org_uuid, 'Otros gastos operacionales', 'expense', 'Settings', true),
    (org_uuid, 'Gastos electrónicos', 'expense', 'Cpu', true),
    (org_uuid, 'Herramientas', 'expense', 'Wrench', true),
    (org_uuid, 'Equipamiento de cocina', 'expense', 'Coffee', true),
    (org_uuid, 'Otros gastos de inversión', 'expense', 'TrendingUp', true)
  ON CONFLICT (org_id, name, type) DO NOTHING;

  -- Ingresos
  INSERT INTO finance_categories (org_id, name, type, icon, is_default) VALUES
    (org_uuid, 'Cuotas socios', 'income', 'Users', true),
    (org_uuid, 'Arriendos', 'income', 'Key', true),
    (org_uuid, 'Subsidios', 'income', 'Award', true),
    (org_uuid, 'Donaciones', 'income', 'Heart', true),
    (org_uuid, 'Certificados de residencia', 'income', 'FileText', true)
  ON CONFLICT (org_id, name, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to automatically initialize default categories upon setting finance settings
CREATE OR REPLACE FUNCTION trigger_initialize_finance_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_default_categories(NEW.org_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_finance_settings_created ON finance_settings;
CREATE TRIGGER on_finance_settings_created
  AFTER INSERT ON finance_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_finance_categories();

-- 10. Configure Storage Bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('finance_receipts', 'finance_receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for finance_receipts
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can delete receipts" ON storage.objects;

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'finance_receipts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'finance_receipts');

CREATE POLICY "Owners and admins can delete receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'finance_receipts' 
    AND auth.role() = 'authenticated'
    AND (
      has_org_role((storage.foldername(name))[1]::uuid, 'owner') OR
      has_org_role((storage.foldername(name))[1]::uuid, 'admin')
    )
  );

-- Indexes for performance Optimization
CREATE INDEX IF NOT EXISTS idx_finance_settings_org ON finance_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_org ON finance_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org ON finance_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date DESC);
