CREATE TABLE "bible_verse_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" text NOT NULL,
	"book_id" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"content" text NOT NULL,
	"author_type" text DEFAULT 'external' NOT NULL,
	"author_display_name" text DEFAULT '访客' NOT NULL,
	"member_user_id" uuid,
	"external_user_id" text,
	"external_display_name" text,
	"status" text DEFAULT 'published' NOT NULL,
	"hidden_at" timestamp with time zone,
	"hidden_by_admin_user_id" uuid,
	"hidden_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bible_verse_notes" ADD CONSTRAINT "bible_verse_notes_member_user_id_users_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_verse_notes" ADD CONSTRAINT "bible_verse_notes_hidden_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("hidden_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bible_verse_notes_verse_status" ON "bible_verse_notes" USING btree ("verse_id","status");--> statement-breakpoint
CREATE INDEX "idx_bible_verse_notes_member" ON "bible_verse_notes" USING btree ("member_user_id");--> statement-breakpoint
CREATE INDEX "idx_bible_verse_notes_external" ON "bible_verse_notes" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "idx_bible_verse_notes_created_at" ON "bible_verse_notes" USING btree ("created_at");