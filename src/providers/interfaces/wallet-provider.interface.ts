/**
 * Wallet Provider Interface
 *
 * This interface defines the contract that all wallet providers (Easypaisa, JazzCash, etc.)
 * must implement. This allows us to support multiple payment providers with a unified API.
 */

export interface WalletProviderResponse<T = any> {
  responseCode: string;
  responseMessage?: string;
  data?: T;
}

export interface GenerateOtpResult extends WalletProviderResponse {
  otpReference?: string;
}

export interface InitiateLinkResult extends WalletProviderResponse {
  token: string;
  orderId?: string;
}

export interface PinlessPaymentResult extends WalletProviderResponse {
  orderId?: string;
  transactionId?: string;
}

export interface DeactivateLinkResult extends WalletProviderResponse {
  success: boolean;
}

export interface IWalletProvider {
  /**
   * Provider identifier (e.g., 'easypaisa', 'jazzcash')
   */
  readonly providerId: string;

  /**
   * Generate OTP for wallet linking
   */
  generateOtp(
    mobileAccountNo: string,
    orderId: string,
  ): Promise<GenerateOtpResult>;

  /**
   * Initiate wallet link transaction (verify OTP and link wallet)
   */
  initiateLinkTransaction(
    mobileAccountNo: string,
    orderId: string,
    otp: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<InitiateLinkResult>;

  /**
   * Initiate pinless transaction (charge wallet without PIN)
   */
  initiatePinlessTransaction(
    tokenNumber: string,
    mobileAccountNo: string,
    orderId: string,
    transactionAmount: number,
    emailAddress?: string,
  ): Promise<PinlessPaymentResult>;

  /**
   * Deactivate wallet link
   */
  deactivateLink(
    tokenNumber: string,
    mobileAccountNo: string,
  ): Promise<DeactivateLinkResult>;
}

/**
 * Supported wallet providers
 */
export enum WalletProviderType {
  EASYPAISA = 'easypaisa',
  JAZZCASH = 'jazzcash',
}
