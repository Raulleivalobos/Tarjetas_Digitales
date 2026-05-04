-- Ejecutar en el Editor SQL de Supabase para permitir el estado "inactive" en las credenciales

ALTER TABLE digital_cards DROP CONSTRAINT IF EXISTS digital_cards_status_check;
ALTER TABLE digital_cards ADD CONSTRAINT digital_cards_status_check CHECK (status IN ('active', 'inactive', 'draft', 'expired', 'blocked', 'revoked'));

-- Por si acaso, actualizar también la de los beneficiarios para que tengan perfecta sincronía
ALTER TABLE beneficiaries DROP CONSTRAINT IF EXISTS beneficiaries_status_check;
ALTER TABLE beneficiaries ADD CONSTRAINT beneficiaries_status_check CHECK (status IN ('active', 'inactive', 'blocked'));
