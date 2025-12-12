import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { WalletLink } from '../../wallet-links/entities/wallet-link.entity';

export enum TransactionType {
  GENERATE_OTP = 'generate_otp',
  INITIATE_LINK = 'initiate_link',
  WALLET_LINK = 'wallet_link',
  PINLESS_PAYMENT = 'pinless_payment',
  DEACTIVATE_LINK = 'deactivate_link',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('transactions')
@Index(['merchantId', 'createdAt'])
@Index(['merchantOrderId'])
@Index(['easypaisaOrderId'])
@Index(['status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.transactions)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'uuid', nullable: true, name: 'wallet_link_id' })
  walletLinkId: string;

  @ManyToOne(() => WalletLink, (link) => link.transactions, { nullable: true })
  @JoinColumn({ name: 'wallet_link_id' })
  walletLink: WalletLink;

  @Column({ unique: true, name: 'merchant_order_id' })
  merchantOrderId: string;

  @Column({ nullable: true, name: 'easypaisa_order_id' })
  easypaisaOrderId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    name: 'transaction_type',
  })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ name: 'mobile_number' })
  mobileNumber: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true, name: 'easypaisa_response_code' })
  easypaisaResponseCode: string;

  @Column({ type: 'text', nullable: true, name: 'easypaisa_response_message' })
  easypaisaResponseMessage: string;

  @Column({ type: 'jsonb', nullable: true, name: 'request_payload' })
  requestPayload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'response_payload' })
  responsePayload: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'integer', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
