-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_key_hash TEXT NOT NULL,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 100,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wallet_links table
CREATE TABLE IF NOT EXISTS wallet_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    mobile_number VARCHAR(20) NOT NULL,
    token VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    otp_reference VARCHAR(255),
    otp_expires_at TIMESTAMP,
    easypaisa_order_id VARCHAR(255),
    easypaisa_response JSONB,
    merchant_order_id VARCHAR(255),
    transaction_id UUID,
    linked_at TIMESTAMP,
    expires_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    deactivation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_links_merchant_mobile ON wallet_links(merchant_id, mobile_number);
CREATE INDEX IF NOT EXISTS idx_wallet_links_token ON wallet_links(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_links_merchant_order ON wallet_links(merchant_id, merchant_order_id) WHERE merchant_order_id IS NOT NULL;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    wallet_link_id UUID REFERENCES wallet_links(id),
    merchant_order_id VARCHAR(255) NOT NULL,
    easypaisa_order_id VARCHAR(255),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    easypaisa_response_code VARCHAR(50),
    easypaisa_response_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_merchant_order ON transactions(merchant_id, merchant_order_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id),
    wallet_link_id UUID REFERENCES wallet_links(id),
    transaction_id UUID REFERENCES transactions(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a test merchant
INSERT INTO merchants (name, api_key, api_key_hash, is_active, rate_limit, metadata)
VALUES (
    'Test Merchant',
    'test123',
    '$2b$10$XQxv6P.BNz4gM6kYmJGFOuwG8qB2W3rQ5pCl3NZJ5Wh8dGvJxQ6Qi',  -- hash of 'test_api_key_12345'
    true,
    100,
    '{}'::jsonb
)
ON CONFLICT (name) DO NOTHING;
