import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletLink, WalletLinkStatus } from './entities/wallet-link.entity';
import { EasypaisaService } from '../easypaisa/easypaisa.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, TransactionStatus } from '../transactions/entities/transaction.entity';

@Injectable()
export class WalletLinksService {
  private readonly logger = new Logger(WalletLinksService.name);

  constructor(
    @InjectRepository(WalletLink)
    private walletLinkRepository: Repository<WalletLink>,
    private easypaisaService: EasypaisaService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
  ) {}

  async generateOtp(
    merchantId: string,
    mobileNumber: string,
    orderId: string,
  ): Promise<WalletLink> {
    this.logger.log(`Generating OTP for merchant ${merchantId}, mobile ${mobileNumber}`);

    const existingActiveLink = await this.findActiveLinkByMobileNumber(merchantId, mobileNumber);
    if (existingActiveLink) {
      throw new ConflictException(`An active wallet link already exists for this mobile number`);
    }

    const response = await this.easypaisaService.generateOtp(mobileNumber, orderId);

    if (response.responseCode !== '0000') {
      this.logger.error(`OTP generation failed: ${response.responseMessage}`);
      throw new BadRequestException(`OTP generation failed: ${response.responseMessage}`);
    }

    const walletLink = this.walletLinkRepository.create({
      merchantId,
      mobileNumber,
      status: WalletLinkStatus.OTP_GENERATED,
      otpReference: orderId,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      easypaisaResponse: response,
    });

    const saved = await this.walletLinkRepository.save(walletLink);
    this.logger.log(`OTP generated successfully for wallet link ${saved.id}`);
    return saved;
  }

  async initiateLink(
    walletLinkId: string,
    orderId: string,
    otp: string,
    amount: number,
    merchantOrderId?: string,
  ): Promise<WalletLink> {
    this.logger.log(`Initiating wallet link ${walletLinkId} with amount ${amount}`);

    const walletLink = await this.findById(walletLinkId);

    // Generate merchantOrderId if not provided
    const finalMerchantOrderId = merchantOrderId || `LINK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // IDEMPOTENCY CHECK: Check if already linked with this merchantOrderId
    if (merchantOrderId) {
      const existing = await this.walletLinkRepository.findOne({
        where: {
          merchantId: walletLink.merchantId,
          merchantOrderId,
          status: WalletLinkStatus.ACTIVE,
        },
        relations: ['transaction'],
      });

      if (existing) {
        this.logger.log(`Returning existing wallet link for merchantOrderId: ${merchantOrderId}`);
        return existing;
      }
    }

    if (walletLink.status !== WalletLinkStatus.OTP_GENERATED) {
      throw new BadRequestException(`Invalid wallet link status: ${walletLink.status}`);
    }

    if (walletLink.otpExpiresAt && walletLink.otpExpiresAt < new Date()) {
      walletLink.status = WalletLinkStatus.EXPIRED;
      await this.walletLinkRepository.save(walletLink);
      throw new BadRequestException('OTP has expired');
    }

    const response = await this.easypaisaService.initiateLinkTransaction(
      walletLink.mobileNumber,
      orderId,
      otp,
      amount,
    );

    if (response.responseCode !== '0000') {
      walletLink.status = WalletLinkStatus.FAILED;
      walletLink.easypaisaResponse = response;
      await this.walletLinkRepository.save(walletLink);
      throw new BadRequestException(`Wallet linking failed: ${response.responseMessage}`);
    }

    // CREATE TRANSACTION RECORD
    const transaction = await this.transactionsService.createTransaction({
      merchantId: walletLink.merchantId,
      walletLinkId: walletLink.id,
      merchantOrderId: finalMerchantOrderId,
      easypaisaOrderId: response.orderId || orderId,
      transactionType: TransactionType.WALLET_LINK,
      amount,
      mobileNumber: walletLink.mobileNumber,
      status: TransactionStatus.COMPLETED,
      easypaisaResponseCode: response.responseCode,
      easypaisaResponseMessage: response.responseMessage,
      requestPayload: {
        walletLinkId,
        otp: '***',
        amount,
        merchantOrderId: finalMerchantOrderId,
      },
      responsePayload: response,
      completedAt: new Date(),
    });

    walletLink.status = WalletLinkStatus.ACTIVE;
    if (response.tokenNumber) walletLink.token = response.tokenNumber;
    if (response.orderId) walletLink.easypaisaOrderId = response.orderId;
    walletLink.merchantOrderId = finalMerchantOrderId;
    walletLink.transactionId = transaction.id;
    walletLink.linkedAt = new Date();
    walletLink.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    walletLink.easypaisaResponse = response;

    const updated = await this.walletLinkRepository.save(walletLink);
    this.logger.log(`Wallet link ${walletLinkId} activated successfully with transaction ${transaction.id}`);
    return updated;
  }

  async deactivateLink(walletLinkId: string, reason?: string): Promise<WalletLink> {
    this.logger.log(`Deactivating wallet link ${walletLinkId}`);

    const walletLink = await this.findById(walletLinkId);

    if (walletLink.status !== WalletLinkStatus.ACTIVE) {
      throw new BadRequestException(`Cannot deactivate wallet link with status: ${walletLink.status}`);
    }

    if (!walletLink.token) {
      throw new BadRequestException('Wallet link does not have a token');
    }

    const response = await this.easypaisaService.deactivateLink(
      walletLink.token,
      walletLink.mobileNumber,
    );

    if (response.responseCode !== '0000') {
      this.logger.error(`Deactivation failed: ${response.responseMessage}`);
      throw new BadRequestException(`Deactivation failed: ${response.responseMessage}`);
    }

    walletLink.status = WalletLinkStatus.DEACTIVATED;
    walletLink.deactivatedAt = new Date();
    walletLink.deactivationReason = reason || 'User requested deactivation';
    walletLink.easypaisaResponse = response;

    const updated = await this.walletLinkRepository.save(walletLink);
    this.logger.log(`Wallet link ${walletLinkId} deactivated successfully`);
    return updated;
  }

  async findById(id: string): Promise<WalletLink> {
    const walletLink = await this.walletLinkRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!walletLink) {
      throw new NotFoundException(`Wallet link with ID "${id}" not found`);
    }

    return walletLink;
  }

  async findByMerchantAndMobile(merchantId: string, mobileNumber: string): Promise<WalletLink[]> {
    return this.walletLinkRepository.find({
      where: { merchantId, mobileNumber },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveLinkByMobileNumber(merchantId: string, mobileNumber: string): Promise<WalletLink | null> {
    return this.walletLinkRepository.findOne({
      where: {
        merchantId,
        mobileNumber,
        status: WalletLinkStatus.ACTIVE,
      },
    });
  }

  async findByMerchant(merchantId: string, limit = 50, offset = 0): Promise<{ links: WalletLink[]; total: number }> {
    const [links, total] = await this.walletLinkRepository.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { links, total };
  }

  async checkExpiration(walletLinkId: string): Promise<WalletLink> {
    const walletLink = await this.findById(walletLinkId);

    if (walletLink.status === WalletLinkStatus.ACTIVE && walletLink.expiresAt && walletLink.expiresAt < new Date()) {
      walletLink.status = WalletLinkStatus.EXPIRED;
      return this.walletLinkRepository.save(walletLink);
    }

    return walletLink;
  }

  async cleanupExpiredLinks(): Promise<number> {
    const result = await this.walletLinkRepository
      .createQueryBuilder()
      .update(WalletLink)
      .set({ status: WalletLinkStatus.EXPIRED })
      .where('status = :status', { status: WalletLinkStatus.ACTIVE })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} expired wallet links`);
    return result.affected || 0;
  }
}
