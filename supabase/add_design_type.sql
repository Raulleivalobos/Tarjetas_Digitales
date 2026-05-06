-- Migración para añadir tipo de diseño y permitir separación de credenciales y certificados
ALTER TABLE card_designs ADD COLUMN IF NOT EXISTS design_type VARCHAR(20) DEFAULT 'card' CHECK (design_type IN ('card', 'certificate'));

-- Intentar categorizar diseños existentes basados en el nombre
UPDATE card_designs 
SET design_type = 'certificate' 
WHERE name ILIKE '%certificado%' OR name ILIKE '%residencia%';

-- Asegurar que la tabla de certificados soporte la relación con diseños (si no existe)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS design_id UUID REFERENCES card_designs(id);
