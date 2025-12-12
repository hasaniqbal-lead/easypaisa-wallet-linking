import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SignatureService } from './signature.service';
import {
  GenerateOtpRequest,
  GenerateOtpResponse,
} from './dto/generate-otp.dto';
import {
  InitiateLinkRequest,
  InitiateLinkResponse,
} from './dto/initiate-link.dto';
import {
  PinlessPaymentRequest,
  PinlessPaymentResponse,
} from './dto/pinless-payment.dto';
import {
  DeactivateLinkRequest,
  DeactivateLinkResponse,
} from './dto/deactivate-link.dto';
import {
  EASYPAISA_ERROR_CODES,
  getErrorMessage,
  getErrorHttpStatus,
  isRetryableError,
} from '../common/constants/error-codes';

@Injectable()
export class EasypaisaService {
  private readonly logger = new Logger(EasypaisaService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('easypaisa.baseUrl')!;
  }

  /**
   * Generate OTP for wallet linking
   */
  async generateOtp(
    mobileAccountNo: string,
    orderId: string,
  ): Promise<GenerateOtpResponse> {
    // IMPORTANT: Only send storeId and mobileAccountNo in the request
    // Do NOT include username, password, orderId, or emailAddress
    // CRITICAL: Key order MUST match Easypaisa's expectation for signature generation
    const request: Record<string, any> = {};
    request.storeId = this.configService.get<string>('easypaisa.storeId')!;
    request.mobileAccountNo = mobileAccountNo;

    const signature = this.signatureService.generateSignature(request);

    const payload = {
      request,
      signature,
    };

    try {
      this.logger.log(`Generating OTP for order: ${orderId}, mobile: ${mobileAccountNo}`);

      // Log the exact payload being sent to Easypaisa
      this.logger.log(`[REQUEST DEBUG] Full URL: ${this.baseUrl}/generate-otp`);
      this.logger.log(`[REQUEST DEBUG] Payload: ${JSON.stringify(payload)}`);
      this.logger.log(`[REQUEST DEBUG] Payload byte length: ${Buffer.byteLength(JSON.stringify(payload), 'utf8')}`);

      // Generate Basic Auth credentials header
      const username = this.configService.get<string>('easypaisa.username')!;
      const password = this.configService.get<string>('easypaisa.password')!;
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');

      const headers = {
        'Content-Type': 'application/json',
        'Credentials': credentials,
      };
      this.logger.log(`[REQUEST DEBUG] Headers being sent: ${JSON.stringify(headers)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/generate-otp`, payload, {
          headers,
          timeout: this.configService.get<number>('easypaisa.timeoutMs')!,
        }),
      );

      this.logger.log(`[RESPONSE DEBUG] Status: ${response.status}`);
      this.logger.log(`[RESPONSE DEBUG] Full response: ${JSON.stringify(response.data)}`);
      this.logger.log(`OTP generated successfully for order ${orderId}`);
      return this.handleResponse(response.data);
    } catch (error) {
      this.logger.error(`OTP generation failed for order ${orderId}: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Initiate wallet link transaction (verify OTP and link wallet)
   */
  async initiateLinkTransaction(
    mobileAccountNo: string,
    orderId: string,
    otp: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<InitiateLinkResponse> {
    // Include all fields for link transaction
    // CRITICAL: Key order MUST match Easypaisa's expectation for signature generation
    // NOTE: username/password are NOT in signed payload, only in Credentials header (like generate-otp)
    // IMPORTANT: emailAddress is REQUIRED by Easypaisa - "request.emailAddress may not be null"
    //            Use default email if not provided
    const request: Record<string, any> = {};
    request.orderId = orderId;
    request.storeId = this.configService.get<string>('easypaisa.storeId')!;
    request.transactionAmount = transactionAmount.toFixed(2);
    request.transactionType = 'MA';
    request.mobileAccountNo = mobileAccountNo;
    request.emailAddress = emailAddress && emailAddress.trim() !== ''
      ? emailAddress
      : 'transactions@mycodigital.io';
    request.otp = otp;

    const signature = this.signatureService.generateSignature(request);

    const payload = {
      request,
      signature,
    };

    try {
      this.logger.log(`Initiating link transaction for order: ${orderId}`);

      // Log the exact payload being sent to Easypaisa
      this.logger.log(`[REQUEST DEBUG] Full URL: ${this.baseUrl}/initiate-link-transaction`);
      this.logger.log(`[REQUEST DEBUG] Payload: ${JSON.stringify(payload)}`);
      this.logger.log(`[REQUEST DEBUG] Payload byte length: ${Buffer.byteLength(JSON.stringify(payload), 'utf8')}`);

      // Generate Basic Auth credentials header
      const username = this.configService.get<string>('easypaisa.username')!;
      const password = this.configService.get<string>('easypaisa.password')!;
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');

      const headers = {
        'Content-Type': 'application/json',
        'Credentials': credentials,
      };
      this.logger.log(`[REQUEST DEBUG] Headers being sent: ${JSON.stringify(headers)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/initiate-link-transaction`, payload, {
          headers,
          timeout: this.configService.get<number>('easypaisa.timeoutMs')!,
        }),
      );

      this.logger.log(`[RESPONSE DEBUG] Status: ${response.status}`);
      this.logger.log(`[RESPONSE DEBUG] Full response: ${JSON.stringify(response.data)}`);
      this.logger.log(`Wallet linked successfully for order ${orderId}`);
      return this.handleResponse(response.data);
    } catch (error) {
      this.logger.error(`Link transaction failed for order ${orderId}: ${error.message}`);

      // Log Easypaisa's error response details
      if (error.response) {
        this.logger.error(`[EASYPAISA ERROR] Status: ${error.response.status}`);
        this.logger.error(`[EASYPAISA ERROR] Response body: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`[EASYPAISA ERROR] Headers: ${JSON.stringify(error.response.headers)}`);
      }

      throw this.handleError(error);
    }
  }

  /**
   * Initiate pinless transaction (charge wallet without PIN)
   */
  async initiatePinlessTransaction(
    tokenNumber: string,
    mobileAccountNo: string,
    orderId: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<PinlessPaymentResponse> {
    // Include all fields for pinless transaction
    // CRITICAL: Key order MUST match Easypaisa's expectation for signature generation
    // NOTE: username/password are NOT in signed payload, only in Credentials header (like generate-otp)
    // IMPORTANT: emailAddress is REQUIRED by Easypaisa - cannot be null or empty
    const request: Record<string, any> = {};
    request.orderId = orderId;
    request.storeId = this.configService.get<string>('easypaisa.storeId')!;
    request.transactionAmount = transactionAmount.toFixed(2);
    request.transactionType = 'MA';
    request.mobileAccountNo = mobileAccountNo;
    request.emailAddress = emailAddress && emailAddress.trim() !== ''
      ? emailAddress
      : 'transactions@mycodigital.io';
    request.tokenNumber = tokenNumber;

    const signature = this.signatureService.generateSignature(request);

    const payload = {
      request,
      signature,
    };

    try {
      this.logger.log(`Initiating pinless transaction for order: ${orderId}, amount: ${transactionAmount}`);

      // Generate Basic Auth credentials header
      const username = this.configService.get<string>('easypaisa.username')!;
      const password = this.configService.get<string>('easypaisa.password')!;
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/initiate-pinless-transaction`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Credentials': credentials,
          },
          timeout: this.configService.get<number>('easypaisa.timeoutMs')! + 15000, // Longer timeout for payment
        }),
      );

      this.logger.log(`Pinless transaction completed successfully for order ${orderId}`);
      return this.handleResponse(response.data);
    } catch (error) {
      this.logger.error(`Pinless transaction failed for order ${orderId}: ${error.message}`);

      // Log Easypaisa's error response details
      if (error.response) {
        this.logger.error(`[EASYPAISA ERROR] Status: ${error.response.status}`);
        this.logger.error(`[EASYPAISA ERROR] Response body: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`[EASYPAISA ERROR] Headers: ${JSON.stringify(error.response.headers)}`);
      }

      throw this.handleError(error);
    }
  }

  /**
   * Deactivate wallet link
   */
  async deactivateLink(
    tokenNumber: string,
    mobileAccountNo: string,
  ): Promise<DeactivateLinkResponse> {
    // Deactivate link transaction
    // CRITICAL: Key order MUST match Easypaisa's expectation for signature generation
    // NOTE: username/password are NOT in signed payload, only in Credentials header (like generate-otp)
    const request: Record<string, any> = {};
    request.storeId = this.configService.get<string>('easypaisa.storeId')!;
    request.mobileAccountNo = mobileAccountNo;
    request.tokenNumber = tokenNumber;

    const signature = this.signatureService.generateSignature(request);

    const payload = {
      request,
      signature,
    };

    try {
      this.logger.log(`Deactivating link for token: ${tokenNumber}`);

      // Generate Basic Auth credentials header
      const username = this.configService.get<string>('easypaisa.username')!;
      const password = this.configService.get<string>('easypaisa.password')!;
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/deactivate-link`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Credentials': credentials,
          },
          timeout: this.configService.get<number>('easypaisa.timeoutMs')!,
        }),
      );

      this.logger.log(`Link deactivated successfully for token ${tokenNumber}`);
      return this.handleResponse(response.data);
    } catch (error) {
      this.logger.error(`Link deactivation failed for token ${tokenNumber}: ${error.message}`);

      // Log Easypaisa's error response details
      if (error.response) {
        this.logger.error(`[EASYPAISA ERROR] Status: ${error.response.status}`);
        this.logger.error(`[EASYPAISA ERROR] Response body: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`[EASYPAISA ERROR] Headers: ${JSON.stringify(error.response.headers)}`);
      }

      throw this.handleError(error);
    }
  }

  /**
   * Handle Easypaisa API response
   */
  private handleResponse(data: any): any {
    const response = data.response || data;
    const responseCode = response.responseCode;

    if (responseCode !== '0000') {
      const errorInfo = EASYPAISA_ERROR_CODES[responseCode];
      const httpStatus = errorInfo?.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = errorInfo?.message || 'Unknown error from Easypaisa';

      this.logger.warn(`Easypaisa returned error code ${responseCode}: ${message}`);

      throw new HttpException(
        {
          statusCode: httpStatus,
          message,
          easypaisaCode: responseCode,
          easypaisaMessage: response.responseMessage,
          retryable: isRetryableError(responseCode),
        },
        httpStatus,
      );
    }

    return response;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Easypaisa service unavailable',
          error: error.message,
          retryable: true,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new HttpException(
        {
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Request to Easypaisa timed out',
          error: error.message,
          retryable: true,
        },
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    // Generic error
    return new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: error.message,
        retryable: false,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
