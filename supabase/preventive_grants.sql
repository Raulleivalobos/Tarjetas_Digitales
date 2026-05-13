-- ==============================================================================
-- SCRIPT PREVENTIVO: SEGURIDAD DE LA DATA API (POSTGREST)
-- ==============================================================================
-- Este script asegura que todas las tablas actuales tengan los permisos 
-- explícitos necesarios antes de los cambios de Supabase del 30 de Octubre.
-- ==============================================================================

-- 1. Permisos para el rol "authenticated" (Administradores y personal con login)
-- Permite que la API de Supabase realice operaciones CRUD en todas las tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Permisos para el rol "anon" (Acceso público para validación de QR)
-- Permite que el validador público vea los datos necesarios sin estar logueado
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT ON public.beneficiaries TO anon;
GRANT SELECT ON public.digital_cards TO anon;
GRANT SELECT ON public.card_designs TO anon;
GRANT SELECT ON public.certificates TO anon;
GRANT INSERT ON public.validation_logs TO anon;

-- 3. Permisos para el rol "service_role" (Funciones de servidor y bypass de RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Nota sobre Tablas Futuras:
-- Después de aplicar este script, cualquier tabla NUEVA que crees manualmente 
-- requerirá sus propios GRANTs si se crea después de la fecha límite.
-- ==============================================================================
