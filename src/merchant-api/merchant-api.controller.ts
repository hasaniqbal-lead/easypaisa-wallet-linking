import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { Merchant } from '../merchants/entities/merchant.entity';
import { WalletLinksService } from '../wallet-links/wallet-links.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { GenerateOtpDto } from '../wallet-links/dto/generate-otp.dto';
import { InitiateLinkDto } from '../wallet-links/dto/initiate-link.dto';
import { DeactivateLinkDto } from '../wallet-links/dto/deactivate-link.dto';
import { ProcessPaymentDto } from '../transactions/dto/process-payment.dto';
import { TransactionFiltersDto } from '../transactions/dto/transaction-filters.dto';

@ApiTags('Wallet', 'Transactions')
@ApiSecurity('api-key')
@ApiSecurity('bearer')
@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class MerchantApiController {
  constructor(
    private walletLinksService: WalletLinksService,
    private transactionsService: TransactionsService,
    private auditService: AuditService,
  ) {}

  @Post('wallet/generate-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate OTP for wallet linking' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateOtp(
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: GenerateOtpDto,
  ) {
    // Generate orderId internally
    const orderId = `OTP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const walletLink = await this.walletLinksService.generateOtp(
      merchant.id,
      dto.mobileNumber,
      orderId,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.OTP_GENERATED,
      { mobileNumber: dto.mobileNumber, orderId },
    );

    return {
      success: true,
      data: {
        walletLinkId: walletLink.id,
        mobileNumber: walletLink.mobileNumber,
        status: walletLink.status,
        otpExpiresAt: walletLink.otpExpiresAt,
      },
      message: 'OTP sent successfully',
    };
  }

  @Post('wallet/link')
  @HttpCode(HttpStatus.OK)
  async linkWallet(
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: InitiateLinkDto,
  ) {
    // Generate orderId internally
    const orderId = `LINK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const walletLink = await this.walletLinksService.initiateLink(
      dto.walletLinkId,
      orderId,
      dto.otp,
      dto.amount,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.WALLET_LINKED,
      { mobileNumber: walletLink.mobileNumber, amount: dto.amount },
    );

    return {
      success: true,
      data: {
        walletLinkId: walletLink.id,
        mobileNumber: walletLink.mobileNumber,
        token: walletLink.merchantToken,
        status: walletLink.status,
        linkedAt: walletLink.linkedAt,
        expiresAt: walletLink.expiresAt,
      },
      message: 'Wallet linked successfully',
    };
  }

  @Post('wallet/delink')
  @HttpCode(HttpStatus.OK)
  async delinkWallet(
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: DeactivateLinkDto,
  ) {
    const walletLink = await this.walletLinksService.deactivateLink(
      dto.walletLinkId,
      dto.reason,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.WALLET_DEACTIVATED,
      { reason: dto.reason },
    );

    return {
      success: true,
      data: {
        walletLinkId: walletLink.id,
        status: walletLink.status,
        deactivatedAt: walletLink.deactivatedAt,
      },
      message: 'Wallet delinked successfully',
    };
  }

  @Post('transactions/process')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: ProcessPaymentDto,
  ) {
    const transaction = await this.transactionsService.processPinlessPayment(
      merchant.id,
      dto.walletLinkId,
      dto.merchantOrderId,
      dto.amount,
    );

    await this.auditService.logTransactionAction(
      merchant.id,
      transaction.id,
      transaction.status === 'completed' ? AuditAction.PAYMENT_COMPLETED : AuditAction.PAYMENT_FAILED,
      { amount: dto.amount, merchantOrderId: dto.merchantOrderId },
    );

    return {
      success: transaction.status === 'completed',
      data: {
        transactionId: transaction.id,
        merchantOrderId: transaction.merchantOrderId,
        easypaisaOrderId: transaction.easypaisaOrderId,
        amount: transaction.amount,
        status: transaction.status,
        completedAt: transaction.completedAt,
      },
      message: transaction.status === 'completed'
        ? 'Payment processed successfully'
        : `Payment failed: ${transaction.errorMessage}`,
    };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentMerchant() merchant: Merchant,
    @Query() filters: TransactionFiltersDto,
  ) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const result = await this.transactionsService.findByMerchant(
      merchant.id,
      {
        status: filters.status,
        type: filters.type,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      },
      limit,
      offset,
    );

    return {
      success: true,
      data: {
        transactions: result.transactions.map((txn) => ({
          transactionId: txn.id,
          merchantOrderId: txn.merchantOrderId,
          easypaisaOrderId: txn.easypaisaOrderId,
          type: txn.transactionType,
          amount: txn.amount,
          mobileNumber: txn.mobileNumber,
          status: txn.status,
          completedAt: txn.completedAt,
          createdAt: txn.createdAt,
        })),
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      },
    };
  }

  @Get('transactions/:id')
  async getTransaction(
    @CurrentMerchant() merchant: Merchant,
    @Param('id') id: string,
  ) {
    const transaction = await this.transactionsService.findById(id);

    if (transaction.merchantId !== merchant.id) {
      throw new Error('Transaction not found');
    }

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        merchantOrderId: transaction.merchantOrderId,
        easypaisaOrderId: transaction.easypaisaOrderId,
        type: transaction.transactionType,
        amount: transaction.amount,
        mobileNumber: transaction.mobileNumber,
        status: transaction.status,
        easypaisaResponseCode: transaction.easypaisaResponseCode,
        easypaisaResponseMessage: transaction.easypaisaResponseMessage,
        errorMessage: transaction.errorMessage,
        completedAt: transaction.completedAt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    };
  }

  @Get('wallet/status/:mobileNumber')
  async getWalletStatus(
    @CurrentMerchant() merchant: Merchant,
    @Param('mobileNumber') mobileNumber: string,
  ) {
    const activeLink = await this.walletLinksService.findActiveLinkByMobileNumber(
      merchant.id,
      mobileNumber,
    );

    return {
      success: true,
      data: {
        mobileNumber,
        hasActiveLink: !!activeLink,
        walletLink: activeLink ? {
          walletLinkId: activeLink.id,
          status: activeLink.status,
          linkedAt: activeLink.linkedAt,
          expiresAt: activeLink.expiresAt,
        } : null,
      },
    };
  }

  @Get('transactions/stats')
  async getTransactionStats(
    @CurrentMerchant() merchant: Merchant,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.transactionsService.getTransactionStats(
      merchant.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }
}
