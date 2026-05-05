-- Añadir columna de código de acceso a las organizaciones
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Generar códigos iniciales para las organizaciones existentes que no tengan uno
UPDATE organizations 
SET access_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
WHERE access_code IS NULL;

-- Función para unirse por código (Security Definer)
CREATE OR REPLACE FUNCTION join_org_by_code(target_code TEXT, target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_org_id UUID;
    result_json JSONB;
BEGIN
    -- 1. Buscar la organización por el código
    SELECT id INTO target_org_id FROM organizations WHERE access_code = target_code;
    
    IF target_org_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Código de acceso inválido.');
    END IF;

    -- 2. Verificar si ya es miembro
    IF EXISTS (SELECT 1 FROM org_members WHERE org_id = target_org_id AND user_id = target_user_id) THEN
        RETURN jsonb_build_object('success', true, 'org_id', target_org_id, 'message', 'Ya eres miembro de esta organización.');
    END IF;

    -- 3. Crear la membresía como 'admin' (o 'owner' si queremos darle todo el poder)
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (target_org_id, target_user_id, 'admin');

    RETURN jsonb_build_object('success', true, 'org_id', target_org_id);
END;
$$;
