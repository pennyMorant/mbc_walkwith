import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { lifePostStatuses } from "@mbc/shared-types";

const contentStatuses = [
  "draft",
  "processing",
  "needs_review",
  "published",
  "archived",
  "failed"
] as const;

const visibilityLevels = ["public", "members", "group", "private"] as const;

const adminRoles = [
  "owner",
  "admin",
  "pastor",
  "content_editor",
  "finance",
  "viewer"
] as const;

const adminUserStatuses = ["active", "disabled"] as const;

export const sermons = pgTable(
  "sermons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    speaker: text("speaker").notNull(),
    sermonDate: timestamp("sermon_date", { withTimezone: true }).notNull(),
    series: text("series"),
    primaryReference: text("primary_reference"),
    summary: text("summary"),
    thumbnailUrl: text("thumbnail_url"),
    audioStoragePath: text("audio_storage_path"),
    audioUrl: text("audio_url"),
    audioFileName: text("audio_file_name"),
    audioMimeType: text("audio_mime_type"),
    audioSizeBytes: integer("audio_size_bytes").notNull().default(0),
    audioStatus: text("audio_status", {
      enum: ["missing", "ready", "failed"]
    })
      .notNull()
      .default("missing"),
    audioUploadedAt: timestamp("audio_uploaded_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    revision: integer("revision").notNull().default(0),
    sourceLocale: text("source_locale").notNull().default("zh-Hans"),
    reviewMarkdown: text("review_markdown"),
    processingMetadata: jsonb("processing_metadata"),
    status: text("status", { enum: contentStatuses }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    sermonDateIdx: index("idx_sermons_sermon_date").on(table.sermonDate),
    speakerIdx: index("idx_sermons_speaker").on(table.speaker),
    seriesIdx: index("idx_sermons_series").on(table.series),
    statusIdx: index("idx_sermons_status").on(table.status)
  })
);

function translationColumns() {
  return {
    id: uuid("id").primaryKey().defaultRandom(),
    locale: text("locale").notNull(),
    sourceVersion: integer("source_version").notNull(),
    source: text("source", { enum: ["admin", "ai"] }).notNull(),
    fields: jsonb("fields").notNull().default({}),
    provider: text("provider"),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  };
}

export const lifePostTranslations = pgTable(
  "life_post_translations",
  {
    ...translationColumns(),
    lifePostId: uuid("life_post_id")
      .notNull()
      .references(() => publicPosts.id, { onDelete: "cascade" })
  },
  (table) => ({
    resourceLocaleIdx: uniqueIndex("idx_life_post_translations_resource_locale").on(
      table.lifePostId,
      table.locale
    ),
    resourceIdx: index("idx_life_post_translations_resource").on(table.lifePostId)
  })
);

export const sermonTranslations = pgTable(
  "sermon_translations",
  {
    ...translationColumns(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" })
  },
  (table) => ({
    resourceLocaleIdx: uniqueIndex("idx_sermon_translations_resource_locale").on(
      table.sermonId,
      table.locale
    ),
    resourceIdx: index("idx_sermon_translations_resource").on(table.sermonId)
  })
);

export const sermonDiscussionGuideTranslations = pgTable(
  "sermon_discussion_guide_translations",
  {
    ...translationColumns(),
    sermonDiscussionGuideId: uuid("sermon_discussion_guide_id")
      .notNull()
      .references(() => sermonDiscussionGuides.id, { onDelete: "cascade" })
  },
  (table) => ({
    resourceLocaleIdx: uniqueIndex("idx_sermon_guide_translations_resource_locale").on(
      table.sermonDiscussionGuideId,
      table.locale
    ),
    resourceIdx: index("idx_sermon_guide_translations_resource").on(
      table.sermonDiscussionGuideId
    )
  })
);

export const contentTranslationChunks = pgTable(
  "content_translation_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    locale: text("locale").notNull(),
    sourceVersion: integer("source_version").notNull(),
    field: text("field").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    sourceText: text("source_text").notNull(),
    translatedText: text("translated_text"),
    status: text("status", { enum: ["pending", "succeeded", "failed"] })
      .notNull()
      .default("pending"),
    provider: text("provider"),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    resourceIdx: index("idx_content_translation_chunks_resource").on(
      table.resourceType,
      table.resourceId,
      table.locale,
      table.sourceVersion
    ),
    chunkIdx: uniqueIndex("idx_content_translation_chunks_unique").on(
      table.resourceType,
      table.resourceId,
      table.locale,
      table.sourceVersion,
      table.field,
      table.chunkIndex
    )
  })
);

export const sermonOutlines = pgTable(
  "sermon_outlines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    startSeconds: integer("start_seconds").notNull(),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => ({
    sermonSortIdx: index("idx_sermon_outlines_sermon_sort").on(
      table.sermonId,
      table.sortOrder
    )
  })
);

export const sermonReferences = pgTable(
  "sermon_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    verseId: text("verse_id").notNull(),
    referenceText: text("reference_text").notNull(),
    note: text("note"),
    startSeconds: integer("start_seconds")
  },
  (table) => ({
    verseIdx: index("idx_sermon_references_verse_id").on(table.verseId)
  })
);

export const sermonTopics = pgTable(
  "sermon_topics",
  {
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    topic: text("topic").notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sermonId, table.topic] }),
    topicIdx: index("idx_sermon_topics_topic").on(table.topic)
  })
);

export const sermonTranscripts = pgTable(
  "sermon_transcripts",
  {
    sermonId: uuid("sermon_id")
      .primaryKey()
      .references(() => sermons.id, { onDelete: "cascade" }),
    text: text("text").notNull().default(""),
    source: text("source"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  }
);

export const sermonPlaybackProgress = pgTable(
  "sermon_playback_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    userType: text("user_type", { enum: ["member", "external"] }).notNull(),
    userId: text("user_id").notNull(),
    positionSeconds: integer("position_seconds").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    sermonUserIdx: uniqueIndex(
      "idx_sermon_playback_progress_sermon_user"
    ).on(table.sermonId, table.userType, table.userId),
    userIdx: index("idx_sermon_playback_progress_user").on(
      table.userType,
      table.userId,
      table.updatedAt
    )
  })
);

export const sermonAudioCleanupTasks = pgTable(
  "sermon_audio_cleanup_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sermonId: uuid("sermon_id").notNull(),
    storagePath: text("storage_path").notNull(),
    reason: text("reason", {
      enum: [
        "audio_replaced",
        "audio_removed",
        "sermon_deleted",
        "unbound_upload"
      ]
    }).notNull(),
    status: text("status", { enum: ["pending", "failed", "succeeded"] })
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    storagePathIdx: uniqueIndex(
      "idx_sermon_audio_cleanup_storage_path"
    ).on(table.storagePath),
    statusUpdatedIdx: index("idx_sermon_audio_cleanup_status_updated").on(
      table.status,
      table.updatedAt
    ),
    sermonIdx: index("idx_sermon_audio_cleanup_sermon").on(table.sermonId)
  })
);

export const sermonDiscussionGuides = pgTable(
  "sermon_discussion_guides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull().default(0),
    sourceLocale: text("source_locale").notNull().default("zh-Hans"),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    status: text("status", {
      enum: ["draft", "review", "published", "archived"]
    })
      .notNull()
      .default("draft"),
    audienceType: text("audience_type", {
      enum: ["public", "group", "course", "discipleship"]
    })
      .notNull()
      .default("public"),
    audienceId: text("audience_id"),
    questions: jsonb("questions").notNull().default([]),
    actionSteps: jsonb("action_steps").notNull().default([]),
    prayerPrompts: jsonb("prayer_prompts").notNull().default([]),
    generatedMetadata: jsonb("generated_metadata").notNull().default({}),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    sermonIdx: index("idx_sermon_discussion_guides_sermon").on(table.sermonId),
    publicPublishedIdx: uniqueIndex(
      "uq_sermon_discussion_guides_public_published"
    )
      .on(table.sermonId)
      .where(
        sql`${table.status} = 'published' and ${table.audienceType} = 'public'`
      ),
    statusIdx: index("idx_sermon_discussion_guides_status").on(table.status),
    audienceIdx: index("idx_sermon_discussion_guides_audience").on(
      table.audienceType,
      table.audienceId
    )
  })
);

export const sermonDiscussionResponses = pgTable(
  "sermon_discussion_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guideId: uuid("guide_id")
      .notNull()
      .references(() => sermonDiscussionGuides.id, { onDelete: "cascade" }),
    questionId: text("question_id"),
    userType: text("user_type", { enum: ["member", "external"] }).notNull(),
    userId: text("user_id").notNull(),
    status: text("status", {
      enum: ["private", "shared_with_group", "hidden", "archived"]
    })
      .notNull()
      .default("private"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    guideIdx: index("idx_sermon_discussion_responses_guide").on(table.guideId),
    userIdx: index("idx_sermon_discussion_responses_user").on(
      table.userType,
      table.userId
    ),
    statusIdx: index("idx_sermon_discussion_responses_status").on(table.status)
  })
);

export const bibleKnowledgeEntities = pgTable(
  "bible_knowledge_entities",
  {
    id: text("id").notNull(),
    type: text("type").notNull(),
    locale: text("locale").notNull().default("en"),
    translationId: text("translation_id").notNull().default("web"),
    name: text("name").notNull(),
    category: text("category").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    sections: jsonb("sections").notNull().default([]),
    aliases: jsonb("aliases").notNull(),
    verseAliases: jsonb("verse_aliases").notNull().default({}),
    status: text("status", { enum: contentStatuses }).notNull().default("draft"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.id, table.locale, table.translationId]
    }),
    typeIdx: index("idx_bible_knowledge_type").on(table.type),
    translationIdx: index("idx_bible_knowledge_translation").on(
      table.translationId
    )
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    actorIdx: index("idx_audit_logs_actor").on(table.actorUserId),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt)
  })
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: text("role", { enum: adminRoles }).notNull().default("viewer"),
    status: text("status", { enum: adminUserStatuses })
      .notNull()
      .default("active"),
    passwordHash: text("password_hash").notNull(),
    passwordUpdatedAt: timestamp("password_updated_at", {
      withTimezone: true
    }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    roleIdx: index("idx_admin_users_role").on(table.role)
  })
);

export const adminRefreshTokens = pgTable(
  "admin_refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    familyId: uuid("family_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    replacedByTokenId: uuid("replaced_by_token_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    adminUserIdx: index("idx_admin_refresh_tokens_admin_user").on(
      table.adminUserId
    ),
    familyIdx: index("idx_admin_refresh_tokens_family").on(table.familyId),
    expiresAtIdx: index("idx_admin_refresh_tokens_expires_at").on(
      table.expiresAt
    )
  })
);

export const adminAccessTokenRevocations = pgTable(
  "admin_access_token_revocations",
  {
    tokenId: text("token_id").primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    adminUserIdx: index("idx_admin_access_revocations_admin_user").on(
      table.adminUserId
    ),
    expiresAtIdx: index("idx_admin_access_revocations_expires_at").on(
      table.expiresAt
    )
  })
);

export const publicPosts = pgTable(
  "public_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    revision: integer("revision").notNull().default(0),
    sourceLocale: text("source_locale").notNull().default("zh-Hans"),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    meta: text("meta").notNull().default(""),
    iconName: text("icon_name").notNull().default("church"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    visibility: text("visibility", { enum: visibilityLevels })
      .notNull()
      .default("public"),
    imageUrl: text("image_url"),
    displayWeight: integer("display_weight").notNull().default(0),
    ctaLabel: text("cta_label"),
    ctaUrl: text("cta_url"),
    registrationEnabled: boolean("registration_enabled").notNull().default(false),
    registrationCapacity: integer("registration_capacity"),
    registrationDeadline: timestamp("registration_deadline", {
      withTimezone: true
    }),
    registrationAllowCancellation: boolean("registration_allow_cancellation")
      .notNull()
      .default(true),
    registrationMaxPartySize: integer("registration_max_party_size")
      .notNull()
      .default(1),
    status: text("status", { enum: lifePostStatuses }).notNull().default("draft"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    visibilityIdx: index("idx_public_posts_visibility").on(table.visibility),
    statusIdx: index("idx_public_posts_status").on(table.status),
    displayWeightIdx: index("idx_public_posts_display_weight").on(
      table.displayWeight
    ),
    startsAtIdx: index("idx_public_posts_starts_at").on(table.startsAt),
    registrationIdx: index("idx_public_posts_registration").on(
      table.registrationEnabled
    )
  })
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lifePostId: uuid("life_post_id")
      .notNull()
      .references(() => publicPosts.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    attendeeName: text("attendee_name").notNull().default(""),
    attendeeEmail: text("attendee_email"),
    partySize: integer("party_size").notNull().default(1),
    status: text("status", {
      enum: ["confirmed", "cancelled", "checked_in", "absent"]
    })
      .notNull()
      .default("confirmed"),
    note: text("note").notNull().default(""),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkInMethod: text("check_in_method", {
      enum: ["member_self", "onsite_qr", "admin_manual"]
    }),
    checkedInByAdminUserId: uuid("checked_in_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    eventIdx: index("idx_event_registrations_event").on(table.lifePostId),
    userIdx: index("idx_event_registrations_user").on(table.userId),
    statusIdx: index("idx_event_registrations_status").on(table.status),
    checkedInAtIdx: index("idx_event_registrations_checked_in_at").on(
      table.checkedInAt
    ),
    checkInMethodIdx: index("idx_event_registrations_check_in_method").on(
      table.checkInMethod
    ),
    uniqueActiveUserIdx: uniqueIndex("uq_event_registrations_active_user").on(
      table.lifePostId,
      table.userId
    ).where(sql`${table.status} in ('confirmed', 'checked_in')`)
  })
);

export const eventCheckInCodes = pgTable(
  "event_check_in_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lifePostId: uuid("life_post_id")
      .notNull()
      .references(() => publicPosts.id, { onDelete: "cascade" }),
    qrPayload: text("qr_payload").notNull(),
    shortCode: text("short_code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdByAdminUserId: uuid("created_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    lifePostIdx: index("idx_event_check_in_codes_life_post").on(
      table.lifePostId
    ),
    expiresAtIdx: index("idx_event_check_in_codes_expires_at").on(
      table.expiresAt
    ),
    disabledAtIdx: index("idx_event_check_in_codes_disabled_at").on(
      table.disabledAt
    ),
    qrPayloadIdx: uniqueIndex("uq_event_check_in_codes_qr_payload").on(
      table.qrPayload
    ),
    shortCodeIdx: uniqueIndex("uq_event_check_in_codes_short_code").on(
      table.shortCode
    )
  })
);

export const lifePostReads = pgTable(
  "life_post_reads",
  {
    lifePostId: uuid("life_post_id")
      .notNull()
      .references(() => publicPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    readAt: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.lifePostId, table.userId] }),
    userIdx: index("idx_life_post_reads_user").on(table.userId),
    readAtIdx: index("idx_life_post_reads_read_at").on(table.readAt)
  })
);

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorUserId: text("author_user_id"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    visibility: text("visibility", {
      enum: ["private", "public", "group", "members"]
    })
      .notNull()
      .default("private"),
    groupId: text("group_id"),
    status: text("status", {
      enum: ["pending", "approved", "hidden", "archived"]
    })
      .notNull()
      .default("pending"),
    submitterName: text("submitter_name").notNull().default(""),
    submitterEmail: text("submitter_email"),
    moderationNote: text("moderation_note").notNull().default(""),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    moderatedByAdminUserId: uuid("moderated_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    authorIdx: index("idx_prayer_requests_author").on(table.authorUserId),
    statusIdx: index("idx_prayer_requests_status").on(table.status),
    visibilityIdx: index("idx_prayer_requests_visibility").on(
      table.visibility
    ),
    groupIdx: index("idx_prayer_requests_group").on(table.groupId),
    createdAtIdx: index("idx_prayer_requests_created_at").on(table.createdAt)
  })
);

export const ministryGroups = pgTable(
  "ministry_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    meetingTime: text("meeting_time").notNull().default(""),
    location: text("location").notNull().default(""),
    leaderName: text("leader_name").notNull().default(""),
    visibility: text("visibility", { enum: visibilityLevels })
      .notNull()
      .default("members"),
    status: text("status", {
      enum: ["draft", "active", "paused", "archived"]
    })
      .notNull()
      .default("draft"),
    capacity: integer("capacity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_ministry_groups_status").on(table.status),
    visibilityIdx: index("idx_ministry_groups_visibility").on(table.visibility)
  })
);

export const groupApplications = pgTable(
  "group_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => ministryGroups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    memberDisplayName: text("member_display_name").notNull().default(""),
    memberEmail: text("member_email").notNull().default(""),
    status: text("status", {
      enum: ["submitted", "approved", "declined", "withdrawn"]
    })
      .notNull()
      .default("submitted"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    groupIdx: index("idx_group_applications_group").on(table.groupId),
    userIdx: index("idx_group_applications_user").on(table.userId),
    statusIdx: index("idx_group_applications_status").on(table.status),
    uniqueActiveUserIdx: uniqueIndex("uq_group_applications_active_user").on(
      table.groupId,
      table.userId
    ).where(sql`${table.status} = 'submitted'`)
  })
);

export const groupMemberships = pgTable(
  "group_memberships",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => ministryGroups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    status: text("status", { enum: ["active", "inactive", "leader"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
    userIdx: index("idx_group_memberships_user").on(table.userId),
    statusIdx: index("idx_group_memberships_status").on(table.status)
  })
);

export const groupMaterialAssignments = pgTable(
  "group_material_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => ministryGroups.id, { onDelete: "cascade" }),
    materialType: text("material_type", {
      enum: ["reading_plan", "sermon_discussion_guide", "course", "manual"]
    }).notNull(),
    materialId: text("material_id").notNull(),
    title: text("title").notNull(),
    status: text("status", {
      enum: ["assigned", "in_progress", "completed", "needs_follow_up"]
    })
      .notNull()
      .default("assigned"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    groupIdx: index("idx_group_material_assignments_group").on(table.groupId),
    materialIdx: index("idx_group_material_assignments_material").on(
      table.materialType,
      table.materialId
    ),
    statusIdx: index("idx_group_material_assignments_status").on(table.status)
  })
);

export const groupAttendanceRecords = pgTable(
  "group_attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => ministryGroups.id, { onDelete: "cascade" }),
    meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
    memberUserId: text("member_user_id").notNull(),
    memberDisplayName: text("member_display_name").notNull().default(""),
    status: text("status", { enum: ["present", "absent", "excused"] })
      .notNull()
      .default("present"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    groupMeetingIdx: index("idx_group_attendance_records_group_meeting").on(
      table.groupId,
      table.meetingDate
    ),
    uniqueMemberMeetingIdx: uniqueIndex(
      "uq_group_attendance_records_member_meeting"
    ).on(table.groupId, table.meetingDate, table.memberUserId),
    statusIdx: index("idx_group_attendance_records_status").on(table.status)
  })
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    teacherName: text("teacher_name").notNull().default(""),
    location: text("location").notNull().default(""),
    scheduleText: text("schedule_text").notNull().default(""),
    visibility: text("visibility", { enum: visibilityLevels })
      .notNull()
      .default("members"),
    status: text("status", {
      enum: ["draft", "open", "closed", "in_progress", "completed", "archived"]
    })
      .notNull()
      .default("draft"),
    capacity: integer("capacity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_courses_status").on(table.status),
    visibilityIdx: index("idx_courses_visibility").on(table.visibility)
  })
);

export const courseLessons = pgTable(
  "course_lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    status: text("status", { enum: ["scheduled", "published", "completed"] })
      .notNull()
      .default("scheduled"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    courseSortIdx: index("idx_course_lessons_course_sort").on(
      table.courseId,
      table.sortOrder
    ),
    statusIdx: index("idx_course_lessons_status").on(table.status)
  })
);

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    memberDisplayName: text("member_display_name").notNull().default(""),
    memberEmail: text("member_email").notNull().default(""),
    status: text("status", {
      enum: ["submitted", "enrolled", "waitlisted", "cancelled", "completed"]
    })
      .notNull()
      .default("enrolled"),
    note: text("note").notNull().default(""),
    completedLessonCount: integer("completed_lesson_count")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    courseIdx: index("idx_course_enrollments_course").on(table.courseId),
    userIdx: index("idx_course_enrollments_user").on(table.userId),
    statusIdx: index("idx_course_enrollments_status").on(table.status),
    uniqueActiveUserIdx: uniqueIndex("uq_course_enrollments_active_user").on(
      table.courseId,
      table.userId
    ).where(sql`${table.status} in ('submitted', 'enrolled', 'waitlisted')`)
  })
);

export const servingTeams = pgTable(
  "serving_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["active", "paused", "archived"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_serving_teams_status").on(table.status)
  })
);

export const servingRoles = pgTable(
  "serving_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => servingTeams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["active", "paused", "archived"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    teamIdx: index("idx_serving_roles_team").on(table.teamId),
    statusIdx: index("idx_serving_roles_status").on(table.status)
  })
);

export const servingAssignments = pgTable(
  "serving_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => servingTeams.id, { onDelete: "restrict" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => servingRoles.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull(),
    memberDisplayName: text("member_display_name").notNull().default(""),
    memberEmail: text("member_email").notNull().default(""),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    location: text("location").notNull().default(""),
    status: text("status", {
      enum: [
        "scheduled",
        "confirmed",
        "declined",
        "swap_requested",
        "covered",
        "cancelled"
      ]
    })
      .notNull()
      .default("scheduled"),
    note: text("note").notNull().default(""),
    responseNote: text("response_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_serving_assignments_user").on(
      table.userId,
      table.startsAt
    ),
    statusIdx: index("idx_serving_assignments_status").on(table.status),
    teamIdx: index("idx_serving_assignments_team").on(table.teamId)
  })
);

export const servingAvailabilityRecords = pgTable(
  "serving_availability_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text("status", {
      enum: ["available", "unavailable", "preferred"]
    }).notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userTimeIdx: index("idx_serving_availability_user_time").on(
      table.userId,
      table.startsAt
    ),
    statusIdx: index("idx_serving_availability_status").on(table.status)
  })
);

export const servingCheckIns = pgTable(
  "serving_check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => servingAssignments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    status: text("status", {
      enum: ["pending", "checked_in", "missed"]
    })
      .notNull()
      .default("pending"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    assignmentIdx: uniqueIndex("uq_serving_check_ins_assignment").on(
      table.assignmentId
    ),
    userIdx: index("idx_serving_check_ins_user").on(table.userId),
    statusIdx: index("idx_serving_check_ins_status").on(table.status)
  })
);

export const newcomerProfiles = pgTable(
  "newcomer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalUserId: text("external_user_id"),
    linkedMemberUserId: text("linked_member_user_id"),
    displayName: text("display_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredLanguage: text("preferred_language").notNull().default(""),
    source: text("source").notNull().default("app"),
    interest: text("interest").notNull().default(""),
    status: text("status", {
      enum: [
        "new",
        "assigned",
        "contacted",
        "visited",
        "invited_to_group",
        "invited_to_course",
        "in_discipleship",
        "converted_to_member",
        "paused",
        "closed"
      ]
    })
      .notNull()
      .default("new"),
    assigneeAdminUserId: uuid("assignee_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    assigneeName: text("assignee_name").notNull().default(""),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    conversionStatus: text("conversion_status", {
      enum: [
        "none",
        "linked_existing_member",
        "created_member",
        "declined"
      ]
    })
      .notNull()
      .default("none"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_newcomer_profiles_status").on(table.status),
    assigneeIdx: index("idx_newcomer_profiles_assignee").on(
      table.assigneeAdminUserId
    ),
    externalUserIdx: index("idx_newcomer_profiles_external_user").on(
      table.externalUserId
    ),
    emailIdx: index("idx_newcomer_profiles_email").on(table.email)
  })
);

export const newcomerFollowUps = pgTable(
  "newcomer_follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    newcomerId: uuid("newcomer_id")
      .notNull()
      .references(() => newcomerProfiles.id, { onDelete: "cascade" }),
    authorAdminUserId: uuid("author_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    authorName: text("author_name").notNull().default(""),
    note: text("note").notNull(),
    status: text("status", {
      enum: ["planned", "completed", "missed", "cancelled"]
    })
      .notNull()
      .default("completed"),
    plannedAt: timestamp("planned_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    newcomerIdx: index("idx_newcomer_follow_ups_newcomer").on(
      table.newcomerId
    ),
    statusIdx: index("idx_newcomer_follow_ups_status").on(table.status)
  })
);

export const discipleshipJourneys = pgTable(
  "discipleship_journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", {
      enum: ["draft", "active", "paused", "archived"]
    })
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_discipleship_journeys_status").on(table.status)
  })
);

export const discipleshipStages = pgTable(
  "discipleship_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => discipleshipJourneys.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    journeySortIdx: index("idx_discipleship_stages_journey_sort").on(
      table.journeyId,
      table.sortOrder
    )
  })
);

export const discipleshipTasks = pgTable(
  "discipleship_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => discipleshipJourneys.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id").references(() => discipleshipStages.id, {
      onDelete: "set null"
    }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    referenceType: text("reference_type", {
      enum: [
        "reading_plan",
        "sermon",
        "sermon_discussion_guide",
        "course",
        "group_application",
        "serving_assignment",
        "event_registration",
        "care_request",
        "manual_review"
      ]
    }).notNull(),
    referenceId: text("reference_id").notNull().default(""),
    required: boolean("required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    journeySortIdx: index("idx_discipleship_tasks_journey_sort").on(
      table.journeyId,
      table.sortOrder
    ),
    stageIdx: index("idx_discipleship_tasks_stage").on(table.stageId)
  })
);

export const discipleshipAssignments = pgTable(
  "discipleship_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => discipleshipJourneys.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull(),
    sourceType: text("source_type", { enum: ["member", "newcomer"] })
      .notNull()
      .default("member"),
    sourceId: text("source_id"),
    assigneeAdminUserId: uuid("assignee_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    assigneeName: text("assignee_name").notNull().default(""),
    status: text("status", {
      enum: [
        "not_started",
        "in_progress",
        "blocked",
        "completed",
        "paused",
        "cancelled"
      ]
    })
      .notNull()
      .default("not_started"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_discipleship_assignments_user").on(table.userId),
    journeyIdx: index("idx_discipleship_assignments_journey").on(
      table.journeyId
    ),
    statusIdx: index("idx_discipleship_assignments_status").on(table.status)
  })
);

export const discipleshipTaskProgress = pgTable(
  "discipleship_task_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => discipleshipAssignments.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => discipleshipTasks.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: [
        "locked",
        "available",
        "in_progress",
        "completed",
        "skipped",
        "needs_review"
      ]
    })
      .notNull()
      .default("available"),
    note: text("note").notNull().default(""),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    assignmentIdx: index("idx_discipleship_task_progress_assignment").on(
      table.assignmentId
    ),
    taskIdx: index("idx_discipleship_task_progress_task").on(table.taskId),
    uniqueAssignmentTaskIdx: uniqueIndex(
      "uq_discipleship_task_progress_assignment_task"
    ).on(table.assignmentId, table.taskId)
  })
);

export const careRequests = pgTable(
  "care_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    memberDisplayName: text("member_display_name").notNull().default(""),
    memberEmail: text("member_email").notNull().default(""),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status", {
      enum: ["submitted", "assigned", "in_progress", "resolved", "archived"]
    })
      .notNull()
      .default("submitted"),
    privacyLevel: text("privacy_level", {
      enum: ["pastoral_only", "assigned_team", "admin_restricted"]
    })
      .notNull()
      .default("pastoral_only"),
    assigneeAdminUserId: uuid("assignee_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    assigneeName: text("assignee_name").notNull().default(""),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    internalNote: text("internal_note").notNull().default(""),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_care_requests_user").on(table.userId),
    statusIdx: index("idx_care_requests_status").on(table.status),
    assigneeIdx: index("idx_care_requests_assignee").on(
      table.assigneeAdminUserId
    )
  })
);

export const careFollowUps = pgTable(
  "care_follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    careRequestId: uuid("care_request_id")
      .notNull()
      .references(() => careRequests.id, { onDelete: "cascade" }),
    authorAdminUserId: uuid("author_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    authorName: text("author_name").notNull().default(""),
    note: text("note").notNull(),
    status: text("status", { enum: ["planned", "completed", "cancelled"] })
      .notNull()
      .default("completed"),
    plannedAt: timestamp("planned_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    requestIdx: index("idx_care_follow_ups_request").on(table.careRequestId)
  })
);

export const givingFunds = pgTable(
  "giving_funds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", {
      enum: ["draft", "active", "paused", "archived"]
    })
      .notNull()
      .default("draft"),
    targetAmountCents: integer("target_amount_cents"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_giving_funds_status").on(table.status),
    displayOrderIdx: index("idx_giving_funds_display_order").on(
      table.displayOrder
    )
  })
);

export const givingTransactions = pgTable(
  "giving_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    donorName: text("donor_name").notNull().default(""),
    donorEmail: text("donor_email"),
    provider: text("provider").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    providerCheckoutSessionId: text("provider_checkout_session_id"),
    providerChargeId: text("provider_charge_id"),
    amountCents: integer("amount_cents").notNull(),
    feeCents: integer("fee_cents").notNull().default(0),
    netAmountCents: integer("net_amount_cents").notNull().default(0),
    refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    category: text("category").notNull(),
    fundId: uuid("fund_id").references(() => givingFunds.id, {
      onDelete: "set null"
    }),
    metadata: jsonb("metadata").notNull().default({}),
    status: text("status", {
      enum: ["pending", "succeeded", "failed", "refunded"]
    })
      .notNull()
      .default("pending"),
    reconciliationStatus: text("reconciliation_status", {
      enum: ["unreconciled", "reconciled", "needs_review"]
    })
      .notNull()
      .default("unreconciled"),
    payoutId: text("payout_id"),
    availableOn: timestamp("available_on", { withTimezone: true }),
    disputeId: text("dispute_id"),
    disputeStatus: text("dispute_status", {
      enum: ["none", "warning", "open", "won", "lost", "closed"]
    })
      .notNull()
      .default("none"),
    disputedAmountCents: integer("disputed_amount_cents").notNull().default(0),
    givenAt: timestamp("given_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_giving_transactions_user").on(table.userId),
    statusIdx: index("idx_giving_transactions_status").on(table.status),
    categoryIdx: index("idx_giving_transactions_category").on(table.category),
    fundIdx: index("idx_giving_transactions_fund").on(table.fundId),
    givenAtIdx: index("idx_giving_transactions_given_at").on(table.givenAt),
    providerIdx: index("idx_giving_transactions_provider").on(
      table.provider,
      table.providerTransactionId
    ),
    providerTransactionUniqueIdx: uniqueIndex(
      "uq_giving_transactions_provider_transaction"
    )
      .on(table.provider, table.providerTransactionId)
      .where(sql`${table.providerTransactionId} is not null`),
    checkoutSessionIdx: index("idx_giving_transactions_checkout_session").on(
      table.provider,
      table.providerCheckoutSessionId
    ),
    checkoutSessionUniqueIdx: uniqueIndex(
      "uq_giving_transactions_checkout_session"
    )
      .on(table.provider, table.providerCheckoutSessionId)
      .where(sql`${table.providerCheckoutSessionId} is not null`),
    providerChargeUniqueIdx: uniqueIndex(
      "uq_giving_transactions_provider_charge"
    )
      .on(table.provider, table.providerChargeId)
      .where(sql`${table.providerChargeId} is not null`),
    reconciliationIdx: index("idx_giving_transactions_reconciliation").on(
      table.reconciliationStatus
    ),
    payoutIdx: index("idx_giving_transactions_payout").on(
      table.provider,
      table.payoutId
    ),
    disputeIdx: index("idx_giving_transactions_dispute").on(
      table.provider,
      table.disputeId
    )
  })
);

export const annualStatements = pgTable(
  "annual_statements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    donorName: text("donor_name").notNull().default(""),
    donorEmail: text("donor_email"),
    taxYear: integer("tax_year").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    pdfObjectKey: text("pdf_object_key"),
    status: text("status", {
      enum: ["pending", "ready", "sent", "failed"]
    })
      .notNull()
      .default("pending"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_annual_statements_user").on(table.userId),
    yearIdx: index("idx_annual_statements_tax_year").on(table.taxYear),
    statusIdx: index("idx_annual_statements_status").on(table.status)
  })
);

export const paymentProviderEvents = pgTable(
  "payment_provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    status: text("status", {
      enum: ["received", "processed", "ignored", "failed"]
    })
      .notNull()
      .default("received"),
    payload: jsonb("payload").notNull().default({}),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true })
  },
  (table) => ({
    providerEventIdx: uniqueIndex("uq_payment_provider_events_provider_event").on(
      table.provider,
      table.providerEventId
    ),
    providerStatusIdx: index("idx_payment_provider_events_provider_status").on(
      table.provider,
      table.status
    ),
    receivedAtIdx: index("idx_payment_provider_events_received_at").on(
      table.receivedAt
    )
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    passwordUpdatedAt: timestamp("password_updated_at", {
      withTimezone: true
    }),
    role: text("role").notNull().default("member"),
    status: text("status", {
      enum: ["active", "pending", "inactive", "blocked"]
    })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    statusIdx: index("idx_users_status").on(table.status)
  })
);

export const memberExternalIdentities = pgTable(
  "member_external_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["google", "apple"] }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    providerSubjectIdx: uniqueIndex(
      "uq_member_external_identities_provider_subject"
    ).on(table.provider, table.providerSubject),
    userProviderIdx: uniqueIndex(
      "uq_member_external_identities_user_provider"
    ).on(table.userId, table.provider),
    userIdx: index("idx_member_external_identities_user").on(table.userId)
  })
);

export const memberProfiles = pgTable(
  "member_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address"),
    faithStartYear: integer("faith_start_year"),
    baptizedYear: integer("baptized_year"),
    joinedChurchAt: timestamp("joined_church_at", { withTimezone: true }),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    appLocale: text("app_locale").notNull().default("en"),
    fellowshipGroupId: text("fellowship_group_id"),
    notificationSettings: jsonb("notification_settings").notNull().default({})
  },
  (table) => ({
    userIdx: uniqueIndex("idx_member_profiles_user").on(table.userId),
    groupIdx: index("idx_member_profiles_group").on(table.fellowshipGroupId)
  })
);

export const bibleVerseNotes = pgTable(
  "bible_verse_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verseId: text("verse_id").notNull(),
    bookId: text("book_id").notNull(),
    chapter: integer("chapter").notNull(),
    verse: integer("verse").notNull(),
    content: text("content").notNull(),
    authorType: text("author_type", { enum: ["member", "external"] })
      .notNull()
      .default("external"),
    authorDisplayName: text("author_display_name").notNull().default("访客"),
    memberUserId: uuid("member_user_id").references(() => users.id, {
      onDelete: "cascade"
    }),
    externalUserId: text("external_user_id"),
    externalDisplayName: text("external_display_name"),
    status: text("status", {
      enum: ["published", "hidden", "deleted"]
    })
      .notNull()
      .default("published"),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    hiddenByAdminUserId: uuid("hidden_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    hiddenReason: text("hidden_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    verseStatusIdx: index("idx_bible_verse_notes_verse_status").on(
      table.verseId,
      table.status
    ),
    memberIdx: index("idx_bible_verse_notes_member").on(table.memberUserId),
    externalIdx: index("idx_bible_verse_notes_external").on(
      table.externalUserId
    ),
    createdAtIdx: index("idx_bible_verse_notes_created_at").on(table.createdAt)
  })
);

export const readingPlans = pgTable(
  "reading_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", {
      enum: ["draft", "published", "paused", "archived"]
    })
      .notNull()
      .default("draft"),
    visibility: text("visibility", { enum: ["public", "members"] })
      .notNull()
      .default("public"),
    locale: text("locale").notNull().default("zh-Hans"),
    durationDays: integer("duration_days").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_reading_plans_status").on(table.status),
    visibilityIdx: index("idx_reading_plans_visibility").on(table.visibility),
    localeIdx: index("idx_reading_plans_locale").on(table.locale)
  })
);

export const readingPlanDays = pgTable(
  "reading_plan_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => readingPlans.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    references: jsonb("references").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    planDayIdx: uniqueIndex("idx_reading_plan_days_plan_day").on(
      table.planId,
      table.dayNumber
    )
  })
);

export const readingPlanAssignments = pgTable(
  "reading_plan_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => readingPlans.id, { onDelete: "restrict" }),
    userType: text("user_type", { enum: ["member", "external"] }).notNull(),
    userId: text("user_id").notNull(),
    sourceType: text("source_type", {
      enum: ["self", "admin", "group", "course", "discipleship"]
    })
      .notNull()
      .default("self"),
    sourceId: text("source_id"),
    planTitle: text("plan_title").notNull().default(""),
    planDurationDays: integer("plan_duration_days").notNull().default(1),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: text("status", {
      enum: ["not_started", "active", "completed", "paused", "abandoned"]
    })
      .notNull()
      .default("not_started"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    planUserAttemptIdx: uniqueIndex(
      "idx_reading_plan_assignments_plan_user_attempt"
    ).on(
      table.planId,
      table.userType,
      table.userId,
      table.attemptNumber
    ),
    openPlanUserIdx: uniqueIndex(
      "idx_reading_plan_assignments_open_plan_user"
    )
      .on(table.planId, table.userType, table.userId)
      .where(
        sql`${table.status} in ('not_started', 'active', 'paused')`
      ),
    userEndedAtIdx: index("idx_reading_plan_assignments_user_ended_at").on(
      table.userType,
      table.userId,
      table.endedAt
    ),
    userIdx: index("idx_reading_plan_assignments_user").on(
      table.userType,
      table.userId
    ),
    statusIdx: index("idx_reading_plan_assignments_status").on(table.status)
  })
);

export const readingPlanDayProgress = pgTable(
  "reading_plan_day_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => readingPlanAssignments.id, { onDelete: "cascade" }),
    dayId: uuid("day_id")
      .notNull()
      .references(() => readingPlanDays.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["available", "completed", "missed"] })
      .notNull()
      .default("available"),
    note: text("note").notNull().default(""),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    assignmentDayIdx: uniqueIndex(
      "idx_reading_plan_day_progress_assignment_day"
    ).on(table.assignmentId, table.dayId),
    statusIdx: index("idx_reading_plan_day_progress_status").on(table.status)
  })
);

export const memberDeviceTokens = pgTable(
  "member_device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade"
    }),
    installationId: text("installation_id").notNull(),
    platform: text("platform", { enum: ["ios", "android"] }).notNull(),
    provider: text("provider", { enum: ["fcm"] }).notNull().default("fcm"),
    pushToken: text("push_token").notNull(),
    permissionStatus: text("permission_status", {
      enum: ["authorized", "denied", "provisional", "not_determined"]
    })
      .notNull()
      .default("not_determined"),
    locale: text("locale").notNull().default("en"),
    appVersion: text("app_version"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_member_device_tokens_user").on(table.userId),
    tokenIdx: uniqueIndex("idx_member_device_tokens_push_token").on(
      table.pushToken
    ),
    installationIdx: uniqueIndex("idx_member_device_tokens_installation").on(
      table.userId,
      table.installationId
    ),
    guestInstallationIdx: uniqueIndex(
      "idx_member_device_tokens_guest_installation"
    )
      .on(table.installationId)
      .where(sql`${table.userId} is null`),
    revokedIdx: index("idx_member_device_tokens_revoked_at").on(table.revokedAt)
  })
);

export const notificationMessages = pgTable(
  "notification_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    audience: text("audience", {
      enum: ["public", "members", "member_specific"]
    })
      .notNull()
      .default("members"),
    route: text("route"),
    data: jsonb("data").notNull().default({}),
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    dedupeKey: text("dedupe_key").notNull(),
    createdByAdminUserId: uuid("created_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    dedupeIdx: uniqueIndex("idx_notification_messages_dedupe").on(
      table.dedupeKey
    ),
    typeIdx: index("idx_notification_messages_type").on(table.type),
    sourceIdx: index("idx_notification_messages_source").on(
      table.sourceType,
      table.sourceId
    ),
    createdAtIdx: index("idx_notification_messages_created_at").on(
      table.createdAt
    ),
    audienceIdx: index("idx_notification_messages_audience").on(
      table.audience
    )
  })
);

export const memberNotificationItems = pgTable(
  "member_notification_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => notificationMessages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    route: text("route"),
    data: jsonb("data").notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    messageUserIdx: uniqueIndex("idx_member_notification_items_message_user").on(
      table.messageId,
      table.userId
    ),
    userCreatedIdx: index("idx_member_notification_items_user_created").on(
      table.userId,
      table.createdAt
    ),
    unreadIdx: index("idx_member_notification_items_unread").on(
      table.userId,
      table.readAt
    ),
    archivedIdx: index("idx_member_notification_items_archived").on(
      table.userId,
      table.archivedAt
    )
  })
);

export const notificationDeliveryTasks = pgTable(
  "notification_delivery_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").references(() => notificationMessages.id, {
      onDelete: "set null"
    }),
    type: text("type").notNull(),
    channel: text("channel", { enum: ["push"] }).notNull().default("push"),
    dedupeKey: text("dedupe_key").notNull(),
    audience: text("audience", {
      enum: ["public", "members", "member_specific"]
    })
      .notNull()
      .default("members"),
    preferenceKey: text("preference_key"),
    recipientUserIds: jsonb("recipient_user_ids").notNull().default([]),
    status: text("status", {
      enum: ["queued", "sent", "failed", "retrying", "cancelled"]
    })
      .notNull()
      .default("queued"),
    payload: jsonb("payload").notNull().default({}),
    recipientCount: integer("recipient_count").notNull().default(0),
    pendingDeviceIds: jsonb("pending_device_ids").notNull().default([]),
    attempts: integer("attempts").notNull().default(0),
    providerEvidence: jsonb("provider_evidence").notNull().default({}),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    leaseId: text("lease_id"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    dedupeIdx: uniqueIndex("idx_notification_delivery_tasks_dedupe").on(
      table.dedupeKey
    ),
    statusIdx: index("idx_notification_delivery_tasks_status").on(table.status),
    audienceIdx: index("idx_notification_delivery_tasks_audience").on(
      table.audience
    ),
    retryIdx: index("idx_notification_delivery_tasks_retry").on(
      table.status,
      table.nextAttemptAt
    )
  })
);

export const memberLoginCodes = pgTable(
  "member_login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull().default("registration_email_verification"),
    displayName: text("display_name"),
    passwordHash: text("password_hash"),
    codeHash: text("code_hash").notNull(),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    emailIdx: index("idx_member_login_codes_email").on(table.email),
    expiresAtIdx: index("idx_member_login_codes_expires_at").on(
      table.expiresAt
    )
  })
);

export const memberSessions = pgTable(
  "member_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenId: text("token_id").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    userIdx: index("idx_member_sessions_user").on(table.userId),
    tokenIdx: index("idx_member_sessions_token").on(table.tokenId),
    expiresAtIdx: index("idx_member_sessions_expires_at").on(table.expiresAt)
  })
);

export const appSettings = pgTable(
  "app_settings",
  {
    key: text("key").primaryKey(),
    category: text("category").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    value: jsonb("value").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    categoryIdx: index("idx_app_settings_category").on(table.category)
  })
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    status: text("status").notNull().default("queued"),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    payload: jsonb("payload").notNull().default({}),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    statusIdx: index("idx_jobs_status").on(table.status),
    typeIdx: index("idx_jobs_type").on(table.type),
    resourceIdx: index("idx_jobs_resource").on(
      table.resourceType,
      table.resourceId
    ),
    availableIdx: index("idx_jobs_available_at").on(table.availableAt),
    createdAtIdx: index("idx_jobs_created_at").on(table.createdAt)
  })
);
