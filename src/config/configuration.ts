export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'Easypaisa Wallet Linking Service',

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'easypaisa_wallet',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    ssl: process.env.DATABASE_SSL === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  easypaisa: {
    baseUrl: process.env.EASYPAISA_BASE_URL || 'https://easypay.easypaisa.com.pk/easypay-service/rest/pinless/v1.0',
    username: process.env.EASYPAISA_USERNAME || 'MYCO',
    password: process.env.EASYPAISA_PASSWORD || '',
    storeId: process.env.EASYPAISA_STORE_ID || '',
    privateKeyPath: process.env.EASYPAISA_PRIVATE_KEY_PATH || './keys/private-key.pem',
    timeoutMs: parseInt(process.env.EASYPAISA_TIMEOUT_MS || '30000', 10),
  },

  security: {
    apiKeySaltRounds: parseInt(process.env.API_KEY_SALT_ROUNDS || '10', 10),
    defaultRateLimit: parseInt(process.env.DEFAULT_RATE_LIMIT || '100', 10),
  },

  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '30000', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
});
