import * as crypto from 'crypto';
import * as fs from 'fs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignatureService implements OnModuleInit {
  private readonly logger = new Logger(SignatureService.name);
  private privateKey: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const keyPath = this.configService.get<string>('easypaisa.privateKeyPath')!;
    try {
      this.privateKey = fs.readFileSync(keyPath, 'utf8');
      this.logger.log('Private key loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load private key from ${keyPath}: ${error.message}`);
      throw new Error('Failed to load Easypaisa private key');
    }
  }

  /**
   * Generate RSA SHA256 signature for Easypaisa API
   * CRITICAL: Must sign the entire JSON content within "request": { } including braces
   *
   * @param requestObject The request object to sign (this will be the value inside "request" key)
   * @returns Base64-encoded signature
   */
  generateSignature(requestObject: Record<string, any>): string {
    try {
      // Convert request object to JSON string (compact, no spaces)
      const jsonString = JSON.stringify(requestObject);

      // Log the exact JSON string being signed (CRITICAL for debugging)
      this.logger.log(`[SIGNATURE DEBUG] Exact JSON being signed: ${jsonString}`);
      this.logger.log(`[SIGNATURE DEBUG] JSON byte length: ${Buffer.byteLength(jsonString, 'utf8')}`);

      // Create signature using SHA256 with RSA
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(jsonString);
      sign.end();

      // Sign with private key and return base64-encoded signature
      const signature = sign.sign(this.privateKey, 'base64');

      this.logger.log(`[SIGNATURE DEBUG] Full signature: ${signature}`);
      this.logger.log(`[SIGNATURE DEBUG] Signature length: ${signature.length}`);

      return signature;
    } catch (error) {
      this.logger.error(`Signature generation failed: ${error.message}`, error.stack);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Verify signature (for testing purposes)
   * @param requestObject The request object that was signed
   * @param signature The signature to verify
   * @param publicKey The public key to verify with
   */
  verifySignature(
    requestObject: Record<string, any>,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const jsonString = JSON.stringify(requestObject);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(jsonString);
      verify.end();

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify response signature from Easypaisa
   * @param responseObject The response object from Easypaisa
   * @param signature The signature from Easypaisa
   * @param publicKey Easypaisa's public key
   */
  verifyResponseSignature(
    responseObject: Record<string, any>,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const jsonString = JSON.stringify(responseObject);

      // Hash the response JSON using SHA256
      const hash = crypto.createHash('sha256');
      hash.update(jsonString);
      const messageDigest = hash.digest();

      // Decrypt signature using public key
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(jsonString);
      verify.end();

      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(`Response signature verification failed: ${error.message}`);
      return false;
    }
  }
}
