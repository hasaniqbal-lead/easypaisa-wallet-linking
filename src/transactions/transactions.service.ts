import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { EasypaisaService } from '../easypaisa/easypaisa.service';
import { WalletLinksService } from '../wallet-links/wallet-links.service';
import { WalletLinkStatus } from '../wallet-links/entities/wallet-link.entity';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private easypaisaService: EasypaisaService,
    private walletLinksService: WalletLinksService,
  ) {}

  async processPinlessPayment(
    merchantId: string,
    walletLinkId: string,
    merchantOrderId: string,
    amount: number,
  ): Promise<Transaction> {
    this.logger.log(`Processing pinless payment for merchant ${merchantId}, order ${merchantOrderId}`);

    const existingTransaction = await this.findByMerchantOrderId(merchantOrderId);
    if (existingTransaction) {
      this.logger.log(`Idempotent request detected for order ${merchantOrderId}`);
      return existingTransaction;
    }

    const walletLink = await this.walletLinksService.findById(walletLinkId);

    if (walletLink.merchantId !== merchantId) {
      throw new BadRequestException('Wallet link does not belong to this merchant');
    }

    if (walletLink.status !== WalletLinkStatus.ACTIVE) {
      throw new BadRequestException(`Wallet link is not active: ${walletLink.status}`);
    }

    if (!walletLink.token) {
      throw new BadRequestException('Wallet link does not have a valid token');
    }

    const transaction = this.transactionRepository.create({
      merchantId,
      walletLinkId,
      merchantOrderId,
      transactionType: TransactionType.PINLESS_PAYMENT,
      amount,
      mobileNumber: walletLink.mobileNumber,
      status: TransactionStatus.PROCESSING,
      requestPayload: { merchantOrderId, amount, token: walletLink.token.substring(0, 10) + '***' },
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    try {
      const response = await this.easypaisaService.initiatePinlessTransaction(
        walletLink.token,
        walletLink.mobileNumber,
        merchantOrderId,
        amount,
      );

      if (response.orderId) savedTransaction.easypaisaOrderId = response.orderId;
      savedTransaction.easypaisaResponseCode = response.responseCode;
      savedTransaction.easypaisaResponseMessage = response.responseMessage;
      savedTransaction.responsePayload = response;

      if (response.responseCode === '0000') {
        savedTransaction.status = TransactionStatus.COMPLETED;
        savedTransaction.completedAt = new Date();
        this.logger.log(`Payment successful for transaction ${savedTransaction.id}`);
      } else {
        savedTransaction.status = TransactionStatus.FAILED;
        savedTransaction.errorMessage = response.responseMessage;
        this.logger.error(`Payment failed for transaction ${savedTransaction.id}: ${response.responseMessage}`);
      }

      return await this.transactionRepository.save(savedTransaction);
    } catch (error) {
      savedTransaction.status = TransactionStatus.FAILED;
      savedTransaction.errorMessage = error.message;
      await this.transactionRepository.save(savedTransaction);
      throw error;
    }
  }

  async createTransaction(params: {
    merchantId: string;
    walletLinkId?: string;
    merchantOrderId: string;
    easypaisaOrderId?: string;
    transactionType: TransactionType;
    amount?: number;
    mobileNumber: string;
    status?: TransactionStatus;
    easypaisaResponseCode?: string;
    easypaisaResponseMessage?: string;
    requestPayload?: Record<string, any>;
    responsePayload?: Record<string, any>;
    completedAt?: Date;
    errorMessage?: string;
  }): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...params,
      status: params.status || TransactionStatus.PENDING,
    });
    return this.transactionRepository.save(transaction);
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    easypaisaResponse?: any,
    errorMessage?: string,
  ): Promise<Transaction> {
    const transaction = await this.findById(transactionId);

    transaction.status = status;
    if (easypaisaResponse) {
      transaction.easypaisaOrderId = easypaisaResponse.orderId;
      transaction.easypaisaResponseCode = easypaisaResponse.responseCode;
      transaction.easypaisaResponseMessage = easypaisaResponse.responseDesc;
      transaction.responsePayload = easypaisaResponse;
    }
    if (errorMessage) {
      transaction.errorMessage = errorMessage;
    }
    if (status === TransactionStatus.COMPLETED) {
      transaction.completedAt = new Date();
    }

    return this.transactionRepository.save(transaction);
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['merchant', 'walletLink'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }

    return transaction;
  }

  async findByMerchantOrderId(merchantOrderId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { merchantOrderId },
      relations: ['merchant', 'walletLink'],
    });
  }

  async findByEasypaisaOrderId(easypaisaOrderId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { easypaisaOrderId },
    });
  }

  async findByMerchant(
    merchantId: string,
    filters?: {
      status?: TransactionStatus;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 50,
    offset = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.merchant_id = :merchantId', { merchantId })
      .leftJoinAndSelect('transaction.walletLink', 'walletLink');

    if (filters?.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('transaction.transaction_type = :type', { type: filters.type });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('transaction.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('transaction.created_at <= :endDate', { endDate: filters.endDate });
    }

    const [transactions, total] = await queryBuilder
      .orderBy('transaction.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { transactions, total };
  }

  async incrementRetryCount(transactionId: string): Promise<Transaction> {
    const transaction = await this.findById(transactionId);
    transaction.retryCount += 1;
    return this.transactionRepository.save(transaction);
  }

  async getTransactionStats(merchantId: string, startDate?: Date, endDate?: Date): Promise<{
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalAmount: number;
    successfulAmount: number;
  }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.merchant_id = :merchantId', { merchantId })
      .andWhere('transaction.transaction_type = :type', { type: TransactionType.PINLESS_PAYMENT });

    if (startDate) {
      queryBuilder.andWhere('transaction.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('transaction.created_at <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    const stats = {
      totalTransactions: transactions.length,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalAmount: 0,
      successfulAmount: 0,
    };

    transactions.forEach((txn) => {
      const amount = Number(txn.amount) || 0;
      stats.totalAmount += amount;

      if (txn.status === TransactionStatus.COMPLETED) {
        stats.successfulTransactions += 1;
        stats.successfulAmount += amount;
      } else if (txn.status === TransactionStatus.FAILED) {
        stats.failedTransactions += 1;
      }
    });

    return stats;
  }
}
