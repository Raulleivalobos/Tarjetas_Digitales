-- Función para buscar organizaciones saltando RLS (Security Definer)
CREATE OR REPLACE FUNCTION search_organizations_unrestricted(search_query TEXT)
RETURNS SETOF organizations
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite buscar incluso si no eres miembro aún
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM organizations
    WHERE 
        name ILIKE '%' || search_query || '%'
        OR REPLACE(REPLACE(rut, '.', ''), '-', '') ILIKE '%' || REPLACE(REPLACE(search_query, '.', ''), '-', '') || '%'
        OR slug ILIKE '%' || search_query || '%';
END;
$$;
