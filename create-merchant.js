const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'db',
  port: 5432,
  username: 'easypaisa',
  password: 'EasyP@isa2024Secure!',
  database: 'easypaisa',
  entities: ['dist/src/**/*.entity.js'],
  synchronize: false,
});

async function createMerchant() {
  try {
    await dataSource.initialize();

    // Delete existing merchant
    await dataSource.query('DELETE FROM merchants WHERE name = $1', ['Production Merchant']);

    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    const result = await dataSource.query(
      'INSERT INTO merchants (name, api_key, api_key_hash) VALUES ($1, $2, $3) RETURNING id, name, created_at',
      ['Production Merchant', apiKey, apiKeyHash]
    );

    console.log('\n=== Merchant Created Successfully ===');
    console.log('Merchant ID:', result[0].id);
    console.log('Merchant Name:', result[0].name);
    console.log('API Key:', apiKey);
    console.log('Created At:', result[0].created_at);
    console.log('=====================================\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createMerchant();
