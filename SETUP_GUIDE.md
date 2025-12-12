# Easypaisa Wallet Linking Service - Setup Guide

## Quick Start (Local Development)

### Option 1: Using Docker (Recommended)

1. **Start Docker Desktop** (if not running)

2. **Start PostgreSQL Database**:
   ```bash
   docker-compose up -d postgres
   ```

3. **Wait for database to be ready** (about 10-15 seconds):
   ```bash
   docker-compose logs -f postgres
   # Wait for "database system is ready to accept connections"
   # Press Ctrl+C to exit logs
   ```

4. **Run Database Migrations**:
   ```bash
   npm run migration:run
   ```

5. **Create Your First Merchant**:
   ```bash
   npm run create:merchant "My Store"
   ```

   **Important**: Save the API key that's displayed. You'll need it for API calls.

6. **Start the Application**:
   ```bash
   npm run start:dev
   ```

7. **Access the Application**:
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/health

### Option 2: Using Local PostgreSQL

If you have PostgreSQL installed locally:

1. **Create Database**:
   ```bash
   psql -U postgres
   CREATE DATABASE easypaisa_wallet;
   \q
   ```

2. **Update .env file** (if needed):
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=easypaisa_wallet
   ```

3. **Run Migrations and Start** (same as Option 1, steps 4-7)

## Testing the API

### 1. Generate OTP

```bash
curl -X POST http://localhost:3000/api/v1/wallet/generate-otp \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "03001234567",
    "orderId": "ORDER-001",
    "emailAddress": "user@example.com"
  }'
```

### 2. Link Wallet (after receiving OTP)

```bash
curl -X POST http://localhost:3000/api/v1/wallet/link \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "walletLinkId": "wallet-link-id-from-step-1",
    "orderId": "ORDER-002",
    "otp": "123456"
  }'
```

### 3. Process Payment

```bash
curl -X POST http://localhost:3000/api/v1/transactions/process \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "walletLinkId": "wallet-link-id-from-step-2",
    "merchantOrderId": "ORDER-003",
    "amount": 100.50
  }'
```

### 4. Check Transaction History

```bash
curl -X GET "http://localhost:3000/api/v1/transactions?limit=10&offset=0" \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=easypaisa_wallet
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Easypaisa API (Already configured)
EASYPAISA_USERNAME=MYCO
EASYPAISA_PASSWORD=5e2ff2e9d26b18e4a0a08dfefd909294
EASYPAISA_STORE_ID=1050331
EASYPAISA_PRIVATE_KEY_PATH=./keys/private-key.pem
EASYPAISA_TIMEOUT_MS=30000

# Security
API_KEY_SALT_ROUNDS=10
DEFAULT_RATE_LIMIT=100

# CORS (optional)
CORS_ORIGIN=*
```

## Common Commands

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run build             # Build the project
npm run start:prod        # Start production build

# Database
npm run migration:run     # Run pending migrations
npm run migration:revert  # Revert last migration

# Merchants
npm run create:merchant "Merchant Name"  # Create new merchant

# Testing
npm test                  # Run unit tests
npm run test:e2e          # Run end-to-end tests

# Docker
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
```

## Troubleshooting

### Database Connection Error

If you see "Connection refused" or similar:
- Ensure PostgreSQL is running
- Check DATABASE_HOST, DATABASE_PORT in .env
- For Docker: `docker-compose ps` to verify postgres is running

### Migration Errors

If migrations fail:
```bash
# Check database connection
docker-compose exec postgres psql -U postgres -d easypaisa_wallet -c "SELECT 1"

# Or drop and recreate database
docker-compose down -v
docker-compose up -d postgres
npm run migration:run
```

### API Key Not Working

- Ensure you're using the full API key (64 characters)
- Check the header: `X-API-Key: YOUR_KEY` or `Authorization: Bearer YOUR_KEY`
- Verify merchant is active in database

## Production Deployment

### Using Docker

1. **Build the image**:
   ```bash
   docker-compose build
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**:
   ```bash
   docker-compose exec app npm run migration:run
   ```

4. **Create merchant**:
   ```bash
   docker-compose exec app npm run create:merchant "Production Merchant"
   ```

### Manual Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Run migrations: `npm run migration:run`
4. Start: `npm run start:prod`

## API Documentation

Once the application is running, visit:

**Swagger UI**: http://localhost:3000/api/docs

This provides:
- Interactive API testing
- Complete endpoint documentation
- Request/response schemas
- Authentication setup

## Next Steps

1. Review the [Implementation Plan](C:\Users\hasan\.claude\plans\soft-exploring-penguin.md)
2. Check [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for details
3. Explore the Swagger documentation
4. Test the API endpoints
5. (Optional) Implement webhooks for event notifications
6. (Optional) Add unit and integration tests

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f app`
- Review error messages in the console
- Verify environment variables are set correctly
