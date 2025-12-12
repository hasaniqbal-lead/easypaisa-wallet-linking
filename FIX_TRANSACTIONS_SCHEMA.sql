-- Fix Transaction Schema: Add Missing Columns
-- Date: 2025-12-11
-- Issue: Column Transaction.request_payload does not exist

-- Add missing columns to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS request_payload JSONB,
  ADD COLUMN IF NOT EXISTS response_payload JSONB,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Verify columns were added
SELECT 'Migration completed successfully!' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('request_payload', 'response_payload', 'retry_count')
ORDER BY column_name;
