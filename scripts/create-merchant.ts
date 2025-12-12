import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

async function createMerchant() {
  // Connect to database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'easypaisa_wallet',
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const merchantName = process.argv[2] || 'Test Merchant';
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    await dataSource.query(
      `INSERT INTO merchants (name, api_key, api_key_hash, is_active, rate_limit, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [merchantName, apiKey.substring(0, 8), apiKeyHash, true, 100, {}]
    );

    console.log('\n✅ Merchant created successfully!\n');
    console.log('Merchant Name:', merchantName);
    console.log('API Key:', apiKey);
    console.log('\n⚠️  IMPORTANT: Save this API key! It will not be shown again.\n');
    console.log('Use this API key in your requests:');
    console.log('  Authorization: Bearer', apiKey);
    console.log('  or');
    console.log('  X-API-Key:', apiKey);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error creating merchant:', error.message);
    process.exit(1);
  }
}

createMerchant();
