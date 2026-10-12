import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { sql } from "drizzle-orm";
import Fastify from "fastify";

import { registerAppRoutes } from "./app_routes.js";
import type { AppConfig } from "./config/env.js";
import { createDb } from "./shared/db/client.js";
import { InMemoryAdminAuthRepository } from "./modules/admin/auth/in-memory-admin-auth.repository.js";
import { PostgresAdminAuthRepository } from "./modules/admin/auth/postgres-admin-auth.repository.js";
import { AdminAuthService } from "./modules/admin/auth/admin-auth.service.js";
import { MinistryAnalyticsService } from "./modules/admin/dashboard/ministry_analytics.service.js";
import { AuditService } from "./modules/audit/audit.service.js";
import { InMemoryAuditRepository } from "./modules/audit/in-memory-audit.repository.js";
import { PostgresAuditRepository } from "./modules/audit/postgres-audit.repository.js";
import { createAiProvider } from "./modules/ai/ai-provider.factory.js";
import { AiRateLimiter } from "./modules/ai/ai-rate-limiter.js";
import { AiManagementService } from "./modules/ai/ai-management.service.js";
import { AiService } from "./modules/ai/ai.service.js";
import { ContentLocalizationService } from "./modules/content-localization/content-localization.service.js";
import { ContentTranslationService } from "./modules/content-localization/content_translation.service.js";
import { ApplicationContentLocalizationResourceDirectory } from "./modules/content-localization/content-localization-resource-directory.js";
import { InMemoryContentTranslationChunkRepository } from "./modules/content-localization/in_memory_content_translation_chunk.repository.js";
import { InMemoryContentLocalizationRepository } from "./modules/content-localization/in-memory-content-localization.repository.js";
import { PostgresContentTranslationChunkRepository } from "./modules/content-localization/postgres_content_translation_chunk.repository.js";
import { PostgresContentLocalizationRepository } from "./modules/content-localization/postgres-content-localization.repository.js";
import { BibleKnowledgeService } from "./modules/bible-knowledge/bible-knowledge.service.js";
import { InMemoryBibleKnowledgeRepository } from "./modules/bible-knowledge/in-memory-bible-knowledge.repository.js";
import { PostgresBibleKnowledgeRepository } from "./modules/bible-knowledge/postgres-bible-knowledge.repository.js";
import { BibleVerseNoteService } from "./modules/bible-verse-notes/bible-verse-note.service.js";
import { InMemoryBibleVerseNoteRepository } from "./modules/bible-verse-notes/in-memory-bible-verse-note.repository.js";
import { PostgresBibleVerseNoteRepository } from "./modules/bible-verse-notes/postgres-bible-verse-note.repository.js";
import { CareService } from "./modules/care/care.service.js";
import { InMemoryCareRepository } from "./modules/care/in_memory_care.repository.js";
import { PostgresCareRepository } from "./modules/care/postgres_care.repository.js";
import { CourseService } from "./modules/courses/course.service.js";
import { InMemoryCourseRepository } from "./modules/courses/in-memory-course.repository.js";
import { PostgresCourseRepository } from "./modules/courses/postgres-course.repository.js";
import { DiscipleshipService } from "./modules/discipleship/discipleship.service.js";
import {
  RepositoryDiscipleshipReferenceDirectory,
  RepositoryDiscipleshipSourceDirectory
} from "./modules/discipleship/discipleship_directories.js";
import { InMemoryDiscipleshipRepository } from "./modules/discipleship/in-memory-discipleship.repository.js";
import { PostgresDiscipleshipRepository } from "./modules/discipleship/postgres-discipleship.repository.js";
import { GivingService } from "./modules/giving/giving.service.js";
import { InMemoryGivingRepository } from "./modules/giving/in-memory-giving.repository.js";
import { PostgresGivingRepository } from "./modules/giving/postgres-giving.repository.js";
import { createStripeGivingProvider } from "./modules/giving/stripe-giving.provider.js";
import { GroupService } from "./modules/groups/group.service.js";
import { RepositoryGroupMaterialDirectory } from "./modules/groups/group_material_directory.js";
import { InMemoryGroupRepository } from "./modules/groups/in-memory-group.repository.js";
import { PostgresGroupRepository } from "./modules/groups/postgres-group.repository.js";
import { InMemoryJobRepository } from "./modules/jobs/in-memory-job.repository.js";
import { JobService } from "./modules/jobs/job.service.js";
import { PostgresJobRepository } from "./modules/jobs/postgres-job.repository.js";
import { InMemoryLifePostRepository } from "./modules/life/in-memory-life-post.repository.js";
import { LifePostImageStorageService } from "./modules/life/life-post-image-storage.service.js";
import { LifePostService } from "./modules/life/life-post.service.js";
import { PostgresLifePostRepository } from "./modules/life/postgres-life-post.repository.js";
import { InMemoryMemberRepository } from "./modules/members/in-memory-member.repository.js";
import { MemberService } from "./modules/members/member.service.js";
import { PostgresMemberRepository } from "./modules/members/postgres-member.repository.js";
import { InMemoryMemberAuthRepository } from "./modules/members/auth/in-memory-member-auth.repository.js";
import { PostgresMemberAuthRepository } from "./modules/members/auth/postgres-member-auth.repository.js";
import { MemberAuthService } from "./modules/members/auth/member-auth.service.js";
import { MemberAuthRateLimiter } from "./modules/members/auth/member_auth_rate_limiter.js";
import { createMemberEmailVerificationProvider } from "./modules/members/auth/member-email-verification.provider.js";
import { createFirebaseIdentityVerifier } from "./modules/members/auth/firebase-identity.verifier.js";
import { InMemoryNewcomerRepository } from "./modules/newcomers/in-memory-newcomer.repository.js";
import { NewcomerService } from "./modules/newcomers/newcomer.service.js";
import { PostgresNewcomerRepository } from "./modules/newcomers/postgres-newcomer.repository.js";
import { InMemoryPushRepository } from "./modules/notifications/in-memory-push.repository.js";
import { InMemoryNotificationDeliveryRepository } from "./modules/notifications/in-memory-notification-delivery.repository.js";
import { InMemoryNotificationInboxRepository } from "./modules/notifications/in-memory-notification-inbox.repository.js";
import { NotificationInboxService } from "./modules/notifications/notification-inbox.service.js";
import { NotificationRetryScheduler } from "./modules/notifications/notification_retry_scheduler.js";
import { NotificationService } from "./modules/notifications/notification.service.js";
import { PostgresNotificationDeliveryRepository } from "./modules/notifications/postgres-notification-delivery.repository.js";
import { PostgresNotificationInboxRepository } from "./modules/notifications/postgres-notification-inbox.repository.js";
import { PostgresPushRepository } from "./modules/notifications/postgres-push.repository.js";
import { createPushProvider } from "./modules/notifications/push-provider.factory.js";
import { InMemoryPrayerRepository } from "./modules/prayer/in-memory-prayer.repository.js";
import { PostgresPrayerRepository } from "./modules/prayer/postgres-prayer.repository.js";
import { PrayerService } from "./modules/prayer/prayer.service.js";
import { InMemoryReadingPlanRepository } from "./modules/reading-plans/in-memory-reading-plan.repository.js";
import { PostgresReadingPlanRepository } from "./modules/reading-plans/postgres-reading-plan.repository.js";
import { ReadingPlanService } from "./modules/reading-plans/reading-plan.service.js";
import { RepositoryReadingPlanUserDirectory } from "./modules/reading-plans/reading_plan_user_directory.js";
import { InMemorySermonRepository } from "./modules/sermons/in-memory-sermon.repository.js";
import { InMemorySermonAudioCleanupRepository } from "./modules/sermons/in_memory_sermon_audio_cleanup.repository.js";
import { InMemorySermonProgressRepository } from "./modules/sermons/in_memory_sermon_progress.repository.js";
import { PostgresSermonRepository } from "./modules/sermons/postgres-sermon.repository.js";
import { PostgresSermonAudioCleanupRepository } from "./modules/sermons/postgres_sermon_audio_cleanup.repository.js";
import { PostgresSermonProgressRepository } from "./modules/sermons/postgres_sermon_progress.repository.js";
import { SermonAudioStorageService } from "./modules/sermons/sermon-audio-storage.service.js";
import { SermonAudioCleanupService } from "./modules/sermons/sermon_audio_cleanup.service.js";
import { SermonProgressService } from "./modules/sermons/sermon_progress.service.js";
import { SermonService } from "./modules/sermons/sermon.service.js";
import { InMemorySermonDiscussionGuideRepository } from "./modules/sermon-discussion-guides/in-memory-sermon-discussion-guide.repository.js";
import { PostgresSermonDiscussionGuideRepository } from "./modules/sermon-discussion-guides/postgres-sermon-discussion-guide.repository.js";
import { SermonDiscussionGuideService } from "./modules/sermon-discussion-guides/sermon-discussion-guide.service.js";
import { RepositorySermonDiscussionAudienceDirectory } from "./modules/sermon-discussion-guides/sermon_discussion_audience_directory.js";
import { ServingService } from "./modules/serving/serving.service.js";
import { InMemoryServingRepository } from "./modules/serving/in-memory-serving.repository.js";
import { PostgresServingRepository } from "./modules/serving/postgres-serving.repository.js";
import { InMemorySettingsRepository } from "./modules/settings/in-memory-settings.repository.js";
import { PostgresSettingsRepository } from "./modules/settings/postgres-settings.repository.js";
import { SettingsService } from "./modules/settings/settings.service.js";
import { registerErrorHandler } from "./shared/http/error-handler.js";

export async function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: config.nodeEnv === "test" ? false : true,
    requestIdHeader: "x-request-id",
    trustProxy: config.trustProxy
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: adminCorsOrigins(config),
    credentials: true
  });
  await app.register(sensible);

  registerErrorHandler(app);

  const db = config.useMockData ? null : createDb(config);
  const sermonAudioCleanupRepository = db
    ? new PostgresSermonAudioCleanupRepository(db)
    : new InMemorySermonAudioCleanupRepository();
  const sermonRepository = db
    ? new PostgresSermonRepository(db)
    : new InMemorySermonRepository(sermonAudioCleanupRepository);
  const sermonAudioStorageService = SermonAudioStorageService.fromConfig(config);
  const sermonAudioCleanupService = new SermonAudioCleanupService(
    sermonAudioCleanupRepository,
    sermonAudioStorageService
  );
  const sermonService = new SermonService(
    sermonRepository,
    sermonAudioStorageService,
    sermonAudioCleanupService
  );
  const sermonProgressRepository = db
    ? new PostgresSermonProgressRepository(db)
    : new InMemorySermonProgressRepository();
  const sermonProgressService = new SermonProgressService(
    sermonProgressRepository,
    sermonService
  );
  const adminAuthRepository = db
    ? new PostgresAdminAuthRepository(db)
    : new InMemoryAdminAuthRepository();
  const adminAuthService = new AdminAuthService(config, adminAuthRepository);
  const auditRepository = db
    ? new PostgresAuditRepository(db)
    : new InMemoryAuditRepository();
  const auditService = new AuditService(auditRepository);
  const aiService = new AiService(createAiProvider(config), {
    auditEnabled: config.aiAuditEnabled,
    maxOutputTokens: config.aiMaxOutputTokens
  });
  const aiRateLimiter = new AiRateLimiter({
    windowMs: config.aiRateLimitWindowMs,
    adminLimit: config.aiAdminRateLimitPerWindow,
    memberLimit: config.aiMemberRateLimitPerWindow
  });
  const bibleKnowledgeRepository = db
    ? new PostgresBibleKnowledgeRepository(db)
    : new InMemoryBibleKnowledgeRepository();
  const bibleKnowledgeService = new BibleKnowledgeService(
    bibleKnowledgeRepository
  );
  const bibleVerseNoteRepository = db
    ? new PostgresBibleVerseNoteRepository(db)
    : new InMemoryBibleVerseNoteRepository();
  const bibleVerseNoteService = new BibleVerseNoteService(
    bibleVerseNoteRepository
  );
  const jobRepository = db
    ? new PostgresJobRepository(db)
    : new InMemoryJobRepository();
  const jobService = new JobService(jobRepository);
  const lifePostRepository = db
    ? new PostgresLifePostRepository(db)
    : new InMemoryLifePostRepository();
  const lifePostService = new LifePostService(lifePostRepository);
  const lifePostImageStorageService =
    LifePostImageStorageService.fromConfig(config);
  const prayerRepository = db
    ? new PostgresPrayerRepository(db)
    : new InMemoryPrayerRepository();
  const prayerService = new PrayerService(prayerRepository);
  const settingsRepository = db
    ? new PostgresSettingsRepository(db)
    : new InMemorySettingsRepository();
  const settingsService = new SettingsService(settingsRepository);
  const aiManagementService = new AiManagementService(
    config,
    settingsService,
    auditService,
    aiService
  );
  await aiManagementService.initialize();
  const contentLocalizationService = new ContentLocalizationService(
    db ? new PostgresContentLocalizationRepository(db) : new InMemoryContentLocalizationRepository()
  );
  const contentTranslationService = new ContentTranslationService(
    contentLocalizationService,
    db
      ? new PostgresContentTranslationChunkRepository(db)
      : new InMemoryContentTranslationChunkRepository(),
    aiService
  );
  const contentLocalizationResourceDirectory = new ApplicationContentLocalizationResourceDirectory(
    lifePostService,
    sermonService
  );
  const readingPlanRepository = db
    ? new PostgresReadingPlanRepository(db)
    : new InMemoryReadingPlanRepository();
  const givingRepository = db
    ? new PostgresGivingRepository(db)
    : new InMemoryGivingRepository();
  const givingService = new GivingService(
    givingRepository,
    createStripeGivingProvider(config),
    {
      checkoutSuccessUrl: config.givingCheckoutSuccessUrl,
      checkoutCancelUrl: config.givingCheckoutCancelUrl
    }
  );
  const ministryAnalyticsService = new MinistryAnalyticsService({
    sermons: sermonService,
    lifePosts: lifePostService,
    prayers: prayerService,
    jobs: jobService,
    giving: givingService,
    settings: settingsService,
    onBuildFailure: (error, context) => {
      app.log.warn(
        { err: error, ...context },
        "Dashboard analytics build failed."
      );
    }
  });
  const memberRepository = db
    ? new PostgresMemberRepository(db)
    : new InMemoryMemberRepository();
  const memberService = new MemberService(memberRepository);
  const readingPlanUserDirectory = new RepositoryReadingPlanUserDirectory(
    memberRepository
  );
  const readingPlanService = new ReadingPlanService(
    readingPlanRepository,
    readingPlanUserDirectory
  );
  const groupRepository = db
    ? new PostgresGroupRepository(db)
    : new InMemoryGroupRepository();
  const courseRepository = db
    ? new PostgresCourseRepository(db)
    : new InMemoryCourseRepository();
  const courseService = new CourseService(courseRepository);
  const servingRepository = db
    ? new PostgresServingRepository(db)
    : new InMemoryServingRepository();
  const servingService = new ServingService(
    servingRepository,
    memberRepository
  );
  const careRepository = db
    ? new PostgresCareRepository(db)
    : new InMemoryCareRepository();
  const careService = new CareService(careRepository, adminAuthService);
  const newcomerRepository = db
    ? new PostgresNewcomerRepository(db)
    : new InMemoryNewcomerRepository();
  const newcomerService = new NewcomerService(newcomerRepository);
  const discipleshipRepository = db
    ? new PostgresDiscipleshipRepository(db)
    : new InMemoryDiscipleshipRepository();
  const sermonDiscussionGuideRepository = db
    ? new PostgresSermonDiscussionGuideRepository(db)
    : new InMemorySermonDiscussionGuideRepository();
  const groupMaterialDirectory = new RepositoryGroupMaterialDirectory(
    readingPlanRepository,
    sermonDiscussionGuideRepository,
    courseRepository
  );
  const groupService = new GroupService(
    groupRepository,
    memberRepository,
    groupMaterialDirectory
  );
  const discipleshipReferenceDirectory =
    new RepositoryDiscipleshipReferenceDirectory(
      readingPlanRepository,
      sermonRepository,
      sermonDiscussionGuideRepository,
      courseRepository,
      groupRepository,
      servingRepository,
      lifePostRepository,
      careRepository
    );
  const discipleshipSourceDirectory = new RepositoryDiscipleshipSourceDirectory(
    memberRepository,
    newcomerRepository
  );
  const discipleshipService = new DiscipleshipService(
    discipleshipRepository,
    discipleshipReferenceDirectory,
    discipleshipSourceDirectory
  );
  const sermonDiscussionAudienceDirectory =
    new RepositorySermonDiscussionAudienceDirectory(
      groupRepository,
      courseRepository,
      discipleshipRepository
    );
  const sermonDiscussionGuideService = new SermonDiscussionGuideService(
    sermonDiscussionGuideRepository,
    sermonService,
    sermonDiscussionAudienceDirectory
  );
  contentLocalizationResourceDirectory.setDiscussionGuides(
    sermonDiscussionGuideService
  );
  const memberAuthRepository = db
    ? new PostgresMemberAuthRepository(db, memberRepository)
    : new InMemoryMemberAuthRepository(memberRepository);
  const memberAuthService = new MemberAuthService(
    config,
    memberAuthRepository,
    settingsService,
    auditService,
    createMemberEmailVerificationProvider(config),
    createFirebaseIdentityVerifier(config)
  );
  const memberAuthRateLimiter = new MemberAuthRateLimiter({
    windowMs: config.memberAuthRateLimitWindowMs,
    limit: config.memberAuthRateLimitPerWindow
  });
  const pushRepository = db
    ? new PostgresPushRepository(db)
    : new InMemoryPushRepository(memberRepository);
  const notificationDeliveryRepository = db
    ? new PostgresNotificationDeliveryRepository(db)
    : new InMemoryNotificationDeliveryRepository();
  const notificationInboxRepository = db
    ? new PostgresNotificationInboxRepository(db)
    : new InMemoryNotificationInboxRepository(memberRepository);
  const notificationInboxService = new NotificationInboxService(
    notificationInboxRepository
  );
  const pushProvider = createPushProvider(config, {
    onInvalidToken: (pushToken) =>
      pushRepository.revokeMemberDeviceByToken(pushToken).then(() => undefined)
  });
  const notificationService = new NotificationService(
    pushRepository,
    notificationDeliveryRepository,
    notificationInboxService,
    pushProvider,
    memberService,
    contentLocalizationService
  );
  if (config.notificationRetrySchedulerEnabled) {
    const notificationRetryScheduler = new NotificationRetryScheduler(
      notificationService,
      app.log,
      {
        intervalMs: config.notificationRetrySchedulerIntervalMs,
        batchSize: config.notificationRetrySchedulerBatchSize
      }
    );
    notificationRetryScheduler.start();
    app.addHook("onClose", async () => {
      notificationRetryScheduler.stop();
    });
  }
  if (config.bootstrapDevAdmin) {
    await adminAuthService.bootstrapDevAdmin();
  }

  await registerAppRoutes(app, config, {
    adminAuthService,
    aiRateLimiter,
    aiManagementService,
    contentLocalizationService,
    contentLocalizationResourceDirectory,
    contentLocalizationAiService: contentTranslationService,
    contentLocalizationAiManagementService: aiManagementService,
    contentLocalizationAuditService: auditService,
    contentLocalizationAiRateLimiter: aiRateLimiter,
    aiService,
    auditService,
    bibleKnowledgeService,
    bibleVerseNoteService,
    careService,
    courseService,
    discipleshipService,
    givingService,
    groupService,
    healthDatabaseProbe: async () => {
      if (db) {
        await db.execute(sql`select 1`);
      }
    },
    jobService,
    lifePostImageStorageService,
    lifePostService,
    memberAuthService,
    memberAuthRateLimiter,
    memberService,
    ministryAnalyticsService,
    newcomerService,
    notificationDeliveryRepository,
    notificationInboxService,
    notificationService,
    prayerService,
    readingPlanService,
    sermonDiscussionGuideService,
    sermonAudioCleanupService,
    sermonProgressService,
    sermonService,
    servingService,
    settingsService
  });

  return app;
}

function adminCorsOrigins(config: AppConfig): string[] {
  const configuredOrigins = config.adminWebOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (config.nodeEnv === "production") {
    return configuredOrigins;
  }

  const devPorts = Array.from({ length: 16 }, (_, index) => 5173 + index);
  const devOrigins = devPorts.flatMap((port) => [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ]);

  return [...new Set([...configuredOrigins, ...devOrigins])];
}
