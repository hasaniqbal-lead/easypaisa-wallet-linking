import { Injectable, Logger } from '@nestjs/common';
import { EasypaisaService } from '../../easypaisa/easypaisa.service';
import {
  IWalletProvider,
  GenerateOtpResult,
  InitiateLinkResult,
  PinlessPaymentResult,
  DeactivateLinkResult,
  WalletProviderType,
} from '../interfaces/wallet-provider.interface';

/**
 * Easypaisa Wallet Provider
 *
 * Adapter that wraps the existing EasypaisaService to conform to the IWalletProvider interface.
 * This allows us to use Easypaisa through the unified provider system.
 */
@Injectable()
export class EasypaisaProviderService implements IWalletProvider {
  private readonly logger = new Logger(EasypaisaProviderService.name);
  readonly providerId = WalletProviderType.EASYPAISA;

  constructor(private readonly easypaisaService: EasypaisaService) {}

  async generateOtp(
    mobileAccountNo: string,
    orderId: string,
  ): Promise<GenerateOtpResult> {
    this.logger.log(`[${this.providerId}] Generating OTP for mobile: ${mobileAccountNo}`);

    const response = await this.easypaisaService.generateOtp(
      mobileAccountNo,
      orderId,
    );

    return {
      responseCode: response.responseCode,
      responseMessage: response.responseMessage,
      otpReference: response.otpReference,
    };
  }

  async initiateLinkTransaction(
    mobileAccountNo: string,
    orderId: string,
    otp: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<InitiateLinkResult> {
    this.logger.log(`[${this.providerId}] Initiating link transaction for order: ${orderId}`);

    const response = await this.easypaisaService.initiateLinkTransaction(
      mobileAccountNo,
      orderId,
      otp,
      transactionAmount,
      emailAddress,
    );

    return {
      responseCode: response.responseCode,
      responseMessage: response.responseMessage,
      token: response.tokenNumber || '',
      orderId: response.orderId,
    };
  }

  async initiatePinlessTransaction(
    tokenNumber: string,
    mobileAccountNo: string,
    orderId: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<PinlessPaymentResult> {
    this.logger.log(`[${this.providerId}] Initiating pinless transaction for order: ${orderId}`);

    const response = await this.easypaisaService.initiatePinlessTransaction(
      tokenNumber,
      mobileAccountNo,
      orderId,
      transactionAmount,
      emailAddress,
    );

    return {
      responseCode: response.responseCode,
      responseMessage: response.responseMessage,
      orderId: response.orderId,
      transactionId: response.transactionId,
    };
  }

  async deactivateLink(
    tokenNumber: string,
    mobileAccountNo: string,
  ): Promise<DeactivateLinkResult> {
    this.logger.log(`[${this.providerId}] Deactivating link for token: ${tokenNumber}`);

    const response = await this.easypaisaService.deactivateLink(
      tokenNumber,
      mobileAccountNo,
    );

    return {
      responseCode: response.responseCode,
      responseMessage: response.responseMessage,
      success: response.responseCode === '0000',
    };
  }
}
