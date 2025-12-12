import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script for Easypaisa signature generation
 * This script validates that the signature service can correctly sign requests
 */

function generateSignature(requestObject: Record<string, any>, privateKeyPath: string): string {
  try {
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const jsonString = JSON.stringify(requestObject);

    console.log('Request JSON:', jsonString);

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(jsonString);
    sign.end();

    const signature = sign.sign(privateKey, 'base64');

    console.log('\nGenerated Signature:');
    console.log(signature);
    console.log('\nSignature Length:', signature.length);

    return signature;
  } catch (error) {
    console.error('Error generating signature:', error.message);
    throw error;
  }
}

// Test with sample data
const testRequest = {
  username: 'MYCO',
  password: '5e2ff2e9d26b18e4a0a08dfefd909294',
  storeId: '1050331',
  orderId: 'TEST-' + Date.now(),
  mobileAccountNo: '03001234567',
  emailAddress: '',
};

console.log('='.repeat(80));
console.log('Testing Easypaisa Signature Generation');
console.log('='.repeat(80));
console.log('\nTest Request Object:');
console.log(JSON.stringify(testRequest, null, 2));
console.log('\n' + '='.repeat(80));

const keyPath = path.join(process.cwd(), 'keys', 'private-key.pem');

if (!fs.existsSync(keyPath)) {
  console.error(`\nERROR: Private key not found at: ${keyPath}`);
  console.error('Please ensure the private key file exists at keys/private-key.pem');
  process.exit(1);
}

try {
  generateSignature(testRequest, keyPath);
  console.log('\n' + '='.repeat(80));
  console.log('SUCCESS: Signature generated successfully!');
  console.log('='.repeat(80));
} catch (error) {
  console.error('\nFAILED: Could not generate signature');
  process.exit(1);
}
