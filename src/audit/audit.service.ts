import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  MERCHANT_CREATED = 'merchant.created',
  MERCHANT_UPDATED = 'merchant.updated',
  MERCHANT_DELETED = 'merchant.deleted',

  OTP_GENERATED = 'wallet.otp_generated',
  WALLET_LINKED = 'wallet.linked',
  WALLET_DEACTIVATED = 'wallet.deactivated',

  PAYMENT_PROCESSED = 'payment.processed',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',

  API_KEY_VALIDATED = 'auth.api_key_validated',
  API_KEY_INVALID = 'auth.api_key_invalid',

  WEBHOOK_CONFIGURED = 'webhook.configured',
  WEBHOOK_DELIVERED = 'webhook.delivered',
  WEBHOOK_FAILED = 'webhook.failed',
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction | string,
    merchantId?: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        merchantId,
        action,
        resourceType,
        resourceId,
        metadata: metadata || {},
        ipAddress,
        userAgent,
      });

      const saved = await this.auditLogRepository.save(auditLog);
      this.logger.debug(`Audit log created: ${action} for merchant ${merchantId || 'N/A'}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async logMerchantAction(
    merchantId: string,
    action: AuditAction | string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log(action, merchantId, 'merchant', merchantId, metadata, ipAddress, userAgent);
  }

  async logWalletAction(
    merchantId: string,
    walletLinkId: string,
    action: AuditAction | string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log(action, merchantId, 'wallet_link', walletLinkId, metadata, ipAddress, userAgent);
  }

  async logTransactionAction(
    merchantId: string,
    transactionId: string,
    action: AuditAction | string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log(action, merchantId, 'transaction', transactionId, metadata, ipAddress, userAgent);
  }

  async findByMerchant(
    merchantId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  async findByAction(
    action: AuditAction | string,
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  async findByResource(
    resourceType: string,
    resourceId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    merchantId?: string,
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.created_at >= :startDate', { startDate })
      .andWhere('audit_log.created_at <= :endDate', { endDate });

    if (merchantId) {
      queryBuilder.andWhere('audit_log.merchant_id = :merchantId', { merchantId });
    }

    const [logs, total] = await queryBuilder
      .orderBy('audit_log.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { logs, total };
  }

  async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} audit logs older than ${olderThanDays} days`);
    return result.affected || 0;
  }
}
