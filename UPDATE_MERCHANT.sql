-- Update Test Merchant with correct hash for API key: test_api_key_12345
UPDATE merchants
SET api_key_hash = '$2b$10$yPl/y7yl2s35Svq6Ff.VQugW5ycqfq6slZQ42GCfnOwCMOPv.ZkSW'
WHERE name = 'Test Merchant';

SELECT 'Merchant updated - use API key: test_api_key_12345' as status;
