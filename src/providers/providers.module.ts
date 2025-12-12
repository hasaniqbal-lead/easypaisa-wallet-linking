import { Module } from '@nestjs/common';
import { EasypaisaModule } from '../easypaisa/easypaisa.module';
import { EasypaisaProviderService } from './easypaisa/easypaisa-provider.service';
import { ProviderFactoryService } from './provider-factory.service';

/**
 * Providers Module
 *
 * This module provides a unified interface for multiple wallet providers.
 * Currently supports:
 * - Easypaisa
 *
 * Future providers (uncomment when implemented):
 * - JazzCash
 * - Others...
 */
@Module({
  imports: [
    EasypaisaModule,
    // Import future provider modules here:
    // JazzcashModule,
  ],
  providers: [
    EasypaisaProviderService,
    ProviderFactoryService,
    // Add future provider services here:
    // JazzcashProviderService,
  ],
  exports: [
    ProviderFactoryService,
    // Export individual providers if needed:
    EasypaisaProviderService,
  ],
})
export class ProvidersModule {}
