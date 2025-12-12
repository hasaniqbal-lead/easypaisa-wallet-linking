import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { EasypaisaModule } from '../easypaisa/easypaisa.module';
import { WalletLinksModule } from '../wallet-links/wallet-links.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    EasypaisaModule,
    WalletLinksModule,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
