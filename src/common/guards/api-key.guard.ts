import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { MerchantsService } from '../../merchants/merchants.service';
import { AuditService, AuditAction } from '../../audit/audit.service';

export interface RequestWithMerchant extends Request {
  merchant?: any;
  ipAddress?: string;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private merchantsService: MerchantsService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithMerchant>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn('API key missing from request');
      throw new UnauthorizedException('API key is required');
    }

    const merchant = await this.merchantsService.findByApiKey(apiKey);

    if (!merchant) {
      this.logger.warn(`Invalid API key attempted: ${apiKey.substring(0, 8)}***`);

      await this.auditService.log(
        AuditAction.API_KEY_INVALID,
        undefined,
        undefined,
        undefined,
        { apiKeyPrefix: apiKey.substring(0, 8) },
        this.getIpAddress(request),
        request.headers['user-agent'],
      );

      throw new UnauthorizedException('Invalid API key');
    }

    if (!merchant.isActive) {
      this.logger.warn(`Inactive merchant attempted access: ${merchant.id}`);
      throw new UnauthorizedException('Merchant account is inactive');
    }

    request.merchant = merchant;
    request.ipAddress = this.getIpAddress(request);

    await this.merchantsService.updateLastUsed(merchant.id);

    await this.auditService.log(
      AuditAction.API_KEY_VALIDATED,
      merchant.id,
      undefined,
      undefined,
      { endpoint: request.path, method: request.method },
      request.ipAddress,
      request.headers['user-agent'],
    );

    this.logger.debug(`API key validated for merchant: ${merchant.id}`);
    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    return undefined;
  }

  private getIpAddress(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
      return realIp;
    }

    return request.ip || 'unknown';
  }
}
