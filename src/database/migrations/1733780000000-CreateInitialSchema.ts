import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1733780000000 implements MigrationInterface {
  name = 'CreateInitialSchema1733780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create merchants table
    await queryRunner.query(`
      CREATE TABLE "merchants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "api_key" varchar NOT NULL UNIQUE,
        "api_key_hash" text NOT NULL,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "rate_limit" integer NOT NULL DEFAULT 100,
        "last_used_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create wallet_links table
    await queryRunner.query(`
      CREATE TABLE "wallet_links" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "mobile_number" varchar NOT NULL,
        "token" varchar,
        "status" varchar NOT NULL DEFAULT 'pending',
        "otp_reference" varchar,
        "otp_expires_at" timestamp,
        "easypaisa_order_id" varchar,
        "easypaisa_response" jsonb,
        "linked_at" timestamp,
        "expires_at" timestamp,
        "deactivated_at" timestamp,
        "deactivation_reason" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_wallet_links_merchant" FOREIGN KEY ("merchant_id")
          REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_links_merchant_mobile"
      ON "wallet_links" ("merchant_id", "mobile_number")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_links_token"
      ON "wallet_links" ("token")
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "wallet_link_id" uuid,
        "merchant_order_id" varchar NOT NULL UNIQUE,
        "easypaisa_order_id" varchar,
        "transaction_type" varchar NOT NULL,
        "amount" decimal(10,2),
        "mobile_number" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "easypaisa_response_code" varchar,
        "easypaisa_response_message" text,
        "request_payload" jsonb,
        "response_payload" jsonb,
        "error_message" text,
        "retry_count" integer NOT NULL DEFAULT 0,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_transactions_merchant" FOREIGN KEY ("merchant_id")
          REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_wallet_link" FOREIGN KEY ("wallet_link_id")
          REFERENCES "wallet_links"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_merchant_created"
      ON "transactions" ("merchant_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_merchant_order"
      ON "transactions" ("merchant_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_easypaisa_order"
      ON "transactions" ("easypaisa_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_status"
      ON "transactions" ("status")
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "merchant_id" uuid,
        "action" varchar NOT NULL,
        "resource_type" varchar,
        "resource_id" uuid,
        "metadata" jsonb,
        "ip_address" varchar,
        "user_agent" varchar,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_merchant_created"
      ON "audit_logs" ("merchant_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action"
      ON "audit_logs" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "wallet_links"`);
    await queryRunner.query(`DROP TABLE "merchants"`);
  }
}
