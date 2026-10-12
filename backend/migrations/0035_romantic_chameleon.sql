CREATE TABLE "life_post_reads" (
	"life_post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "life_post_reads_life_post_id_user_id_pk" PRIMARY KEY("life_post_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "life_post_reads" ADD CONSTRAINT "life_post_reads_life_post_id_public_posts_id_fk" FOREIGN KEY ("life_post_id") REFERENCES "public"."public_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_life_post_reads_user" ON "life_post_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_life_post_reads_read_at" ON "life_post_reads" USING btree ("read_at");