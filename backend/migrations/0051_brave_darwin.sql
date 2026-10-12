CREATE TABLE "sermon_topics" (
	"sermon_id" uuid NOT NULL,
	"topic" text NOT NULL,
	CONSTRAINT "sermon_topics_sermon_id_topic_pk" PRIMARY KEY("sermon_id","topic")
);
--> statement-breakpoint
ALTER TABLE "sermon_topics" ADD CONSTRAINT "sermon_topics_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sermon_topics_topic" ON "sermon_topics" USING btree ("topic");