const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

// Production credentials (matching server configuration)
const storeId = '1050331';
const mobileAccountNo = '03097524704';
const tokenNumber = '0201572291';
const username = 'MYCO';
const password = '5e2ff2e9d26b18e4a0a08dfefd909294';

// Read private key for signature
const privateKeyPath = '/app/keys/private-key.pem';
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Build request object with EXACT key order for signature
const request = {
  storeId: storeId,
  mobileAccountNo: mobileAccountNo,
  tokenNumber: tokenNumber
};

// Generate signature using RSA private key
const concatenatedString = Object.values(request).join('&');
const sign = crypto.createSign('SHA256');
sign.update(concatenatedString);
sign.end();
const signature = sign.sign(privateKey, 'hex');

const payload = { request, signature };
const credentials = Buffer.from(`${username}:${password}`).toString('base64');

console.log('Deactivating token:', tokenNumber);
console.log('Mobile number:', mobileAccountNo);
console.log('Store ID:', storeId);
console.log('Base URL: https://easypay.easypaisa.com.pk/easypay-service/rest/pinless/v1.0');
console.log('Payload:', JSON.stringify(payload, null, 2));

axios.post('https://easypay.easypaisa.com.pk/easypay-service/rest/pinless/v1.0/deactivate-link', payload, {
  headers: {
    'Content-Type': 'application/json',
    'Credentials': credentials
  },
  timeout: 30000
})
.then(res => {
  console.log('\n✅ Success!');
  console.log(JSON.stringify(res.data, null, 2));
})
.catch(err => {
  console.error('\n❌ Error:');
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Response:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
