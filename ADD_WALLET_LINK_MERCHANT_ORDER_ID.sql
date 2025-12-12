-- Add merchantOrderId Support to Wallet Linking
-- Date: 2025-12-11
-- Purpose: Enable transaction tracking, idempotency, and merchant order correlation for wallet linking

-- Add merchant_order_id and transaction_id columns to wallet_links table
ALTER TABLE wallet_links
  ADD COLUMN IF NOT EXISTS merchant_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Add unique constraint for idempotency (prevents duplicate links with same merchantOrderId)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_links_merchant_order
  ON wallet_links(merchant_id, merchant_order_id)
  WHERE merchant_order_id IS NOT NULL;

-- Add foreign key constraint to transactions table
ALTER TABLE wallet_links
  ADD CONSTRAINT IF NOT EXISTS fk_wallet_links_transaction
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
  ON DELETE SET NULL;

-- Verify columns were added successfully
SELECT 'Migration completed successfully!' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'wallet_links'
  AND column_name IN ('merchant_order_id', 'transaction_id')
ORDER BY column_name;
