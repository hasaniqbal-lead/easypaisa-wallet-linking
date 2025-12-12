const fs = require('fs');
const path = require('path');

// Fix easypaisa.service.ts
const servicePath = path.join(__dirname, 'easypaisa.service.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Replace config service gets with typed versions
serviceContent = serviceContent.replace(
  /this\.configService\.get\('easypaisa\.username'\)/g,
  "this.configService.get<string>('easypaisa.username')!"
);
serviceContent = serviceContent.replace(
  /this\.configService\.get\('easypaisa\.password'\)/g,
  "this.configService.get<string>('easypaisa.password')!"
);
serviceContent = serviceContent.replace(
  /this\.configService\.get\('easypaisa\.storeId'\)/g,
  "this.configService.get<string>('easypaisa.storeId')!"
);
serviceContent = serviceContent.replace(
  /this\.configService\.get\('easypaisa\.timeoutMs'\)/g,
  "this.configService.get<number>('easypaisa.timeoutMs')!"
);

fs.writeFileSync(servicePath, serviceContent);
console.log('Fixed easypaisa.service.ts');

// Fix signature.service.ts
const sigPath = path.join(__dirname, 'signature.service.ts');
let sigContent = fs.readFileSync(sigPath, 'utf8');

sigContent = sigContent.replace(
  "const keyPath = this.configService.get<string>('easypaisa.privateKeyPath');",
  "const keyPath = this.configService.get<string>('easypaisa.privateKeyPath')!;"
);

fs.writeFileSync(sigPath, sigContent);
console.log('Fixed signature.service.ts');
