# Keys Directory

This directory contains the RSA private key used for signing Easypaisa API requests.

## Important Security Notes

- **Never commit private keys to version control**
- The `private-key.pem` file is gitignored by default
- Keep the private key secure and restrict access
- Rotate keys periodically as per security best practices

## File Structure

- `private-key.pem` - RSA private key for Easypaisa API signature generation (2048-bit)

## Usage

The private key path is configured in the `.env` file:
```
EASYPAISA_PRIVATE_KEY_PATH=./keys/private-key.pem
```

The SignatureService will automatically load and use this key for signing API requests.
