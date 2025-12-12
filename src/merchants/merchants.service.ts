import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    private configService: ConfigService,
  ) {
    this.saltRounds = this.configService.get<number>('security.apiKeySaltRounds')!;
  }

  async create(name: string, metadata?: Record<string, any>): Promise<{ merchant: Merchant; apiKey: string }> {
    this.logger.log(`Creating new merchant: ${name}`);

    const existingMerchant = await this.merchantRepository.findOne({
      where: { name },
    });

    if (existingMerchant) {
      throw new ConflictException(`Merchant with name "${name}" already exists`);
    }

    const apiKey = this.generateApiKey();
    const apiKeyHash = await this.hashApiKey(apiKey);

    const merchant = this.merchantRepository.create({
      name,
      apiKey: apiKey.substring(0, 8),
      apiKeyHash,
      metadata: metadata || {},
      isActive: true,
      rateLimit: this.configService.get<number>('security.defaultRateLimit')!,
    });

    const savedMerchant = await this.merchantRepository.save(merchant);
    this.logger.log(`Merchant created successfully with ID: ${savedMerchant.id}`);

    return {
      merchant: savedMerchant,
      apiKey,
    };
  }

  async findById(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID "${id}" not found`);
    }

    return merchant;
  }

  async findByName(name: string): Promise<Merchant | null> {
    return this.merchantRepository.findOne({
      where: { name },
    });
  }

  async findByApiKey(apiKey: string): Promise<Merchant | null> {
    const merchants = await this.merchantRepository.find();

    for (const merchant of merchants) {
      const isValid = await this.validateApiKey(apiKey, merchant.apiKeyHash);
      if (isValid) {
        return merchant;
      }
    }

    return null;
  }

  async validateApiKey(apiKey: string, apiKeyHash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(apiKey, apiKeyHash);
    } catch (error) {
      this.logger.error(`API key validation error: ${error.message}`, error.stack);
      return false;
    }
  }

  async updateLastUsed(merchantId: string): Promise<void> {
    await this.merchantRepository.update(merchantId, {
      lastUsedAt: new Date(),
    });
  }

  async updateStatus(merchantId: string, isActive: boolean): Promise<Merchant> {
    const merchant = await this.findById(merchantId);
    merchant.isActive = isActive;
    const updated = await this.merchantRepository.save(merchant);
    this.logger.log(`Merchant ${merchantId} status updated to: ${isActive ? 'active' : 'inactive'}`);
    return updated;
  }

  async updateRateLimit(merchantId: string, rateLimit: number): Promise<Merchant> {
    const merchant = await this.findById(merchantId);
    merchant.rateLimit = rateLimit;
    const updated = await this.merchantRepository.save(merchant);
    this.logger.log(`Merchant ${merchantId} rate limit updated to: ${rateLimit}`);
    return updated;
  }

  async updateMetadata(merchantId: string, metadata: Record<string, any>): Promise<Merchant> {
    const merchant = await this.findById(merchantId);
    merchant.metadata = { ...merchant.metadata, ...metadata };
    return this.merchantRepository.save(merchant);
  }

  async listAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(merchantId: string): Promise<void> {
    const merchant = await this.findById(merchantId);
    await this.merchantRepository.remove(merchant);
    this.logger.log(`Merchant ${merchantId} deleted successfully`);
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, this.saltRounds);
  }
}
