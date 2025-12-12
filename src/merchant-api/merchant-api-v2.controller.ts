import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CurrentMerchant } from '../common/decorators/current-merchant.decorator';
import { Merchant } from '../merchants/entities/merchant.entity';
import { WalletLinksService } from '../wallet-links/wallet-links.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { ProviderFactoryService } from '../providers/provider-factory.service';
import { GenerateOtpDto } from '../wallet-links/dto/generate-otp.dto';
import { InitiateLinkDto } from '../wallet-links/dto/initiate-link.dto';
import { DeactivateLinkDto } from '../wallet-links/dto/deactivate-link.dto';
import { ProcessPaymentDto } from '../transactions/dto/process-payment.dto';
import { TransactionFiltersDto } from '../transactions/dto/transaction-filters.dto';

/**
 * Merchant API Controller V2 - Provider-Based Routing
 *
 * This controller implements path-based provider routing following industry standards.
 * Pattern: /api/v1/:provider/wallet/*
 *
 * Examples:
 * - POST /api/v1/easypaisa/wallet/generate-otp
 * - POST /api/v1/jazzcash/wallet/generate-otp
 *
 * Benefits:
 * - Clear provider identification in URL
 * - Easy to add new providers without changing infrastructure
 * - Follows RESTful best practices
 * - Single unified API documentation
 */
@ApiTags('Wallet (Provider-Based)', 'Transactions')
@ApiSecurity('api-key')
@ApiSecurity('bearer')
@Controller('api/v1/:provider')
@UseGuards(ApiKeyGuard)
export class MerchantApiV2Controller {
  constructor(
    private walletLinksService: WalletLinksService,
    private transactionsService: TransactionsService,
    private auditService: AuditService,
    private providerFactory: ProviderFactoryService,
  ) {}

  /**
   * Validate and get provider from path parameter
   */
  private validateProvider(provider: string): void {
    if (!this.providerFactory.isProviderSupported(provider)) {
      throw new BadRequestException({
        statusCode: 400,
        message: `Unsupported wallet provider: ${provider}`,
        supportedProviders: this.providerFactory.getSupportedProviders(),
      });
    }
  }

  @Post('wallet/generate-otp')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Generate OTP for wallet linking (Provider-specific)' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or unsupported provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateOtp(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: GenerateOtpDto,
  ) {
    this.validateProvider(provider);

    // Generate orderId internally
    const orderId = `OTP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Note: Currently, WalletLinksService uses Easypaisa directly
    // In the future, we'll refactor it to use ProviderFactory
    // For now, this validates the provider and maintains backward compatibility
    const walletLink = await this.walletLinksService.generateOtp(
      merchant.id,
      dto.mobileNumber,
      orderId,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.OTP_GENERATED,
      { provider, mobileNumber: dto.mobileNumber, orderId },
    );

    return {
      success: true,
      data: {
        provider,
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
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Link wallet using OTP (Provider-specific)' })
  @ApiResponse({ status: 200, description: 'Wallet linked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or unsupported provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkWallet(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: InitiateLinkDto,
  ) {
    this.validateProvider(provider);

    // Generate orderId internally
    const orderId = `LINK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const walletLink = await this.walletLinksService.initiateLink(
      dto.walletLinkId,
      orderId,
      dto.otp,
      dto.amount,
      dto.merchantOrderId,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.WALLET_LINKED,
      { provider, mobileNumber: walletLink.mobileNumber, amount: dto.amount, merchantOrderId: walletLink.merchantOrderId },
    );

    return {
      success: true,
      data: {
        provider,
        walletLinkId: walletLink.id,
        transactionId: walletLink.transactionId,
        merchantOrderId: walletLink.merchantOrderId,
        easypaisaOrderId: walletLink.easypaisaOrderId,
        mobileNumber: walletLink.mobileNumber,
        token: walletLink.merchantToken,
        amount: dto.amount,
        status: walletLink.status,
        linkedAt: walletLink.linkedAt,
        expiresAt: walletLink.expiresAt,
      },
      message: 'Wallet linked successfully',
    };
  }

  @Post('wallet/delink')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Delink wallet (Provider-specific)' })
  @ApiResponse({ status: 200, description: 'Wallet delinked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or unsupported provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delinkWallet(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: DeactivateLinkDto,
  ) {
    this.validateProvider(provider);

    const walletLink = await this.walletLinksService.deactivateLink(
      dto.walletLinkId,
      dto.reason,
    );

    await this.auditService.logWalletAction(
      merchant.id,
      walletLink.id,
      AuditAction.WALLET_DEACTIVATED,
      { provider, reason: dto.reason },
    );

    return {
      success: true,
      data: {
        provider,
        walletLinkId: walletLink.id,
        status: walletLink.status,
        deactivatedAt: walletLink.deactivatedAt,
      },
      message: 'Wallet delinked successfully',
    };
  }

  @Post('transactions/process')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Process payment transaction (Provider-specific)' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  @ApiResponse({ status: 400, description: 'Bad request or unsupported provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processPayment(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Body() dto: ProcessPaymentDto,
  ) {
    this.validateProvider(provider);

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
      { provider, amount: dto.amount, merchantOrderId: dto.merchantOrderId },
    );

    return {
      success: transaction.status === 'completed',
      data: {
        provider,
        transactionId: transaction.id,
        walletLinkId: transaction.walletLinkId,
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

  // Generic transaction endpoints (not provider-specific)
  @Get('transactions')
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Get transactions list (Provider-specific)' })
  async getTransactions(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Query() filters: TransactionFiltersDto,
  ) {
    this.validateProvider(provider);

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
        provider,
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
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Get transaction details (Provider-specific)' })
  async getTransaction(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Param('id') id: string,
  ) {
    this.validateProvider(provider);

    const transaction = await this.transactionsService.findById(id);

    if (transaction.merchantId !== merchant.id) {
      throw new BadRequestException('Transaction not found');
    }

    return {
      success: true,
      data: {
        provider,
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
  @ApiParam({ name: 'provider', enum: ['easypaisa', 'jazzcash'], description: 'Wallet provider' })
  @ApiOperation({ summary: 'Get wallet link status (Provider-specific)' })
  async getWalletStatus(
    @Param('provider') provider: string,
    @CurrentMerchant() merchant: Merchant,
    @Param('mobileNumber') mobileNumber: string,
  ) {
    this.validateProvider(provider);

    const activeLink = await this.walletLinksService.findActiveLinkByMobileNumber(
      merchant.id,
      mobileNumber,
    );

    return {
      success: true,
      data: {
        provider,
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
}
