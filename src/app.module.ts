import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EasypaisaModule } from './easypaisa/easypaisa.module';
import { MerchantsModule } from './merchants/merchants.module';
import { WalletLinksModule } from './wallet-links/wallet-links.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuditModule } from './audit/audit.module';
import { ProvidersModule } from './providers/providers.module';
import { MerchantApiModule } from './merchant-api/merchant-api.module';
import { HealthModule } from './health/health.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    EasypaisaModule,
    ProvidersModule,
    MerchantsModule,
    WalletLinksModule,
    TransactionsModule,
    AuditModule,
    MerchantApiModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
