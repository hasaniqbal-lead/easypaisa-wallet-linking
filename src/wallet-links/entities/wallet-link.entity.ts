import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  AfterLoad,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum WalletLinkStatus {
  PENDING = 'pending',
  OTP_GENERATED = 'otp_generated',
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Entity('wallet_links')
@Index(['merchantId', 'mobileNumber'])
@Index(['token'])
export class WalletLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.walletLinks)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'mobile_number' })
  mobileNumber: string;

  @Column({ nullable: true })
  token: string;

  // Virtual property for merchant-facing token
  merchantToken?: string;

  @Column({
    type: 'enum',
    enum: WalletLinkStatus,
    default: WalletLinkStatus.PENDING,
  })
  status: WalletLinkStatus;

  @Column({ nullable: true, name: 'otp_reference' })
  otpReference: string;

  @Column({ type: 'timestamp', nullable: true, name: 'otp_expires_at' })
  otpExpiresAt: Date;

  @Column({ nullable: true, name: 'easypaisa_order_id' })
  easypaisaOrderId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'easypaisa_response' })
  easypaisaResponse: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'linked_at' })
  linkedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deactivated_at' })
  deactivatedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'deactivation_reason' })
  deactivationReason: string;

  @Column({ nullable: true, name: 'merchant_order_id' })
  merchantOrderId: string;

  @Column({ type: 'uuid', nullable: true, name: 'transaction_id' })
  transactionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (txn) => txn.walletLink)
  transactions: Transaction[];

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @AfterLoad()
  generateMerchantToken() {
    if (this.token) {
      // Extract last 6 digits from Easypaisa token and format as merchant token
      const suffix = this.token.slice(-6);
      this.merchantToken = `mypay-ep-${suffix}`;
    }
  }
}
