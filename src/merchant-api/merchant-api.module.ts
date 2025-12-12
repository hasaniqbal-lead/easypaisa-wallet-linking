import { Module } from '@nestjs/common';
import { MerchantApiController } from './merchant-api.controller';
import { MerchantApiV2Controller } from './merchant-api-v2.controller';
import { WalletLinksModule } from '../wallet-links/wallet-links.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { AuditModule } from '../audit/audit.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    WalletLinksModule,
    TransactionsModule,
    MerchantsModule,
    AuditModule,
    ProvidersModule,
  ],
  controllers: [
    MerchantApiController, // V1 - Backward compatibility (no provider in path)
    MerchantApiV2Controller, // V2 - Provider-based routing (/api/v1/:provider/...)
  ],
})
export class MerchantApiModule {}
