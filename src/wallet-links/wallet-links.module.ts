import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletLinksService } from './wallet-links.service';
import { WalletLink } from './entities/wallet-link.entity';
import { EasypaisaModule } from '../easypaisa/easypaisa.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletLink]),
    EasypaisaModule,
    forwardRef(() => TransactionsModule),
  ],
  providers: [WalletLinksService],
  exports: [WalletLinksService],
})
export class WalletLinksModule {}
