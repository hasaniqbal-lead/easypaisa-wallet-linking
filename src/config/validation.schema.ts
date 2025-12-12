import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('Easypaisa Wallet Linking Service'),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),

  // Easypaisa API
  EASYPAISA_BASE_URL: Joi.string().uri().required(),
  EASYPAISA_USERNAME: Joi.string().required(),
  EASYPAISA_PASSWORD: Joi.string().required(),
  EASYPAISA_STORE_ID: Joi.string().required(),
  EASYPAISA_PRIVATE_KEY_PATH: Joi.string().required(),
  EASYPAISA_TIMEOUT_MS: Joi.number().default(30000),

  // Security
  API_KEY_SALT_ROUNDS: Joi.number().default(10),
  DEFAULT_RATE_LIMIT: Joi.number().default(100),

  // Webhook
  WEBHOOK_MAX_RETRIES: Joi.number().default(3),
  WEBHOOK_TIMEOUT_MS: Joi.number().default(30000),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});
