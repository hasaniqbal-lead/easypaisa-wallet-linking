import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { IWalletProvider, WalletProviderType } from './interfaces/wallet-provider.interface';
import { EasypaisaProviderService } from './easypaisa/easypaisa-provider.service';

/**
 * Provider Factory Service
 *
 * This service is responsible for returning the correct wallet provider
 * based on the provider type specified in the API request path.
 *
 * Usage:
 *   const provider = providerFactory.getProvider('easypaisa');
 *   const result = await provider.generateOtp(mobile, orderId);
 */
@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private readonly providers: Map<string, IWalletProvider>;

  constructor(
    private readonly easypaisaProvider: EasypaisaProviderService,
    // Add more providers here as they're implemented:
    // private readonly jazzcashProvider: JazzcashProviderService,
  ) {
    // Register all available providers
    this.providers = new Map<string, IWalletProvider>();
    this.providers.set(WalletProviderType.EASYPAISA, this.easypaisaProvider);
    // this.providers.set(WalletProviderType.JAZZCASH, this.jazzcashProvider);

    this.logger.log(`Registered ${this.providers.size} wallet provider(s): ${Array.from(this.providers.keys()).join(', ')}`);
  }

  /**
   * Get wallet provider by provider ID
   *
   * @param providerId - The provider identifier (e.g., 'easypaisa', 'jazzcash')
   * @returns The wallet provider instance
   * @throws BadRequestException if provider is not supported
   */
  getProvider(providerId: string): IWalletProvider {
    const normalizedId = providerId.toLowerCase();
    const provider = this.providers.get(normalizedId);

    if (!provider) {
      this.logger.warn(`Unsupported provider requested: ${providerId}`);
      throw new BadRequestException({
        statusCode: 400,
        message: `Unsupported wallet provider: ${providerId}`,
        supportedProviders: this.getSupportedProviders(),
      });
    }

    return provider;
  }

  /**
   * Check if a provider is supported
   */
  isProviderSupported(providerId: string): boolean {
    return this.providers.has(providerId.toLowerCase());
  }

  /**
   * Get list of all supported provider IDs
   */
  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
