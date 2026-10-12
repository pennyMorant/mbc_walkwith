ALTER TABLE "giving_transactions" ADD COLUMN "provider_charge_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_giving_transactions_provider_charge" ON "giving_transactions" USING btree ("provider","provider_charge_id") WHERE "giving_transactions"."provider_charge_id" is not null;
