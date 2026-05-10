-- Add new columns for first_name, last_name, and comuna
ALTER TABLE beneficiaries 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS comuna TEXT;

-- For existing records, try to split full_name into first_name and last_name if they are null
UPDATE beneficiaries 
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = substring(full_name from length(split_part(full_name, ' ', 1)) + 2)
WHERE first_name IS NULL OR first_name = '';

-- Note: We still keep full_name for backward compatibility.
-- In the UI, when creating/updating, we will set full_name = first_name + ' ' + last_name
