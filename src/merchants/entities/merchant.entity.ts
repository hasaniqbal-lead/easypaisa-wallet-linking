import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WalletLink } from '../../wallet-links/entities/wallet-link.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, name: 'api_key' })
  apiKey: string;

  @Column({ type: 'text', name: 'api_key_hash' })
  apiKeyHash: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', default: 100, name: 'rate_limit' })
  rateLimit: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => WalletLink, (link) => link.merchant)
  walletLinks: WalletLink[];

  @OneToMany(() => Transaction, (txn) => txn.merchant)
  transactions: Transaction[];
}
