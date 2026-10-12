import type { AdminPermission } from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import type { AppConfig } from "./config/env.js";
import { registerAdminAuditRoutes } from "./modules/admin/audit/admin-audit.routes.js";
import { registerAdminAuthRoutes } from "./modules/admin/auth/admin-auth.routes.js";
import { requirePermission } from "./modules/admin/auth/admin-auth.middleware.js";
import { registerAdminBibleKnowledgeRoutes } from "./modules/admin/bible-knowledge/admin-bible-knowledge.routes.js";
import { registerAdminCareRoutes } from "./modules/admin/care/admin_care.routes.js";
import { registerAdminCourseRoutes } from "./modules/admin/courses/admin-courses.routes.js";
import { registerAdminDashboardRoutes } from "./modules/admin/dashboard/admin-dashboard.routes.js";
import { registerAdminDiscipleshipRoutes } from "./modules/admin/discipleship/admin-discipleship.routes.js";
import { registerAdminGivingRoutes } from "./modules/admin/giving/admin-giving.routes.js";
import { registerAdminGroupRoutes } from "./modules/admin/groups/admin-groups.routes.js";
import { registerAdminJobRoutes } from "./modules/admin/jobs/admin-jobs.routes.js";
import { registerAdminLifePostRoutes } from "./modules/admin/life-posts/admin-life-posts.routes.js";
import { registerAdminMemberRoutes } from "./modules/admin/members/admin-members.routes.js";
import { registerAdminNewcomerRoutes } from "./modules/admin/newcomers/admin-newcomers.routes.js";
import { registerAdminNotificationRoutes } from "./modules/admin/notifications/admin_notifications.routes.js";
import { registerAdminPrayerRequestRoutes } from "./modules/admin/prayer-requests/admin-prayer-requests.routes.js";
import { registerAdminReadingPlanRoutes } from "./modules/admin/reading-plans/admin-reading-plan.routes.js";
import { registerAdminSermonDiscussionGuideRoutes } from "./modules/admin/sermon-discussion-guides/admin-sermon-discussion-guide.routes.js";
import { registerAdminSermonRoutes } from "./modules/admin/sermons/admin-sermons.routes.js";
import { registerAdminServingRoutes } from "./modules/admin/serving/admin-serving.routes.js";
import { registerAdminSettingsRoutes } from "./modules/admin/settings/admin-settings.routes.js";
import { registerAdminUserRoutes } from "./modules/admin/users/admin-users.routes.js";
import { registerAiRoutes } from "./modules/ai/ai.routes.js";
import { registerContentLocalizationRoutes } from "./modules/content-localization/content-localization.routes.js";
import { registerBibleKnowledgeRoutes } from "./modules/bible-knowledge/bible-knowledge.routes.js";
import { registerBibleVerseNoteRoutes } from "./modules/bible-verse-notes/bible-verse-note.routes.js";
import { registerCareRoutes } from "./modules/care/care.routes.js";
import { registerCourseRoutes } from "./modules/courses/course.routes.js";
import { registerDiscipleshipRoutes } from "./modules/discipleship/discipleship.routes.js";
import {
  registerMemberGivingRoutes,
  registerStripeGivingWebhookRoutes
} from "./modules/giving/member-giving.routes.js";
import { registerGroupRoutes } from "./modules/groups/group.routes.js";
import { registerHealthRoutes } from "./modules/health/health.routes.js";
import { registerLifeRoutes } from "./modules/life/life.routes.js";
import { registerMemberAuthRoutes } from "./modules/members/auth/member-auth.routes.js";
import { registerMemberNotificationRoutes } from "./modules/notifications/member-notification.routes.js";
import { registerNewcomerRoutes } from "./modules/newcomers/newcomer.routes.js";
import { registerPrayerRoutes } from "./modules/prayer/prayer.routes.js";
import { registerPublicLandingRoutes } from "./modules/public/public_landing.routes.js";
import { registerReadingPlanRoutes } from "./modules/reading-plans/reading-plan.routes.js";
import { registerSermonDiscussionGuideRoutes } from "./modules/sermon-discussion-guides/sermon-discussion-guide.routes.js";
import { registerSermonRoutes } from "./modules/sermons/sermon.routes.js";
import { registerServingRoutes } from "./modules/serving/serving.routes.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";

type AppRouteDependencies = {
  adminAuthService: Parameters<typeof registerAdminAuthRoutes>[1];
  aiRateLimiter: Parameters<typeof registerAiRoutes>[4];
  aiManagementService: Parameters<typeof registerAiRoutes>[5];
  contentLocalizationService: Parameters<typeof registerContentLocalizationRoutes>[1];
  contentLocalizationResourceDirectory: Parameters<typeof registerContentLocalizationRoutes>[2];
  contentLocalizationAiService: Parameters<typeof registerContentLocalizationRoutes>[3];
  contentLocalizationAiManagementService: Parameters<typeof registerContentLocalizationRoutes>[4];
  contentLocalizationAuditService: Parameters<typeof registerContentLocalizationRoutes>[5];
  contentLocalizationAiRateLimiter: Parameters<typeof registerContentLocalizationRoutes>[6];
  aiService: Parameters<typeof registerAiRoutes>[1];
  auditService: Parameters<typeof registerLifeRoutes>[4];
  bibleKnowledgeService: Parameters<typeof registerBibleKnowledgeRoutes>[1];
  bibleVerseNoteService: Parameters<typeof registerBibleVerseNoteRoutes>[1];
  careService: Parameters<typeof registerCareRoutes>[1];
  courseService: Parameters<typeof registerCourseRoutes>[1];
  discipleshipService: Parameters<typeof registerDiscipleshipRoutes>[1];
  givingService: Parameters<typeof registerMemberGivingRoutes>[1];
  groupService: Parameters<typeof registerGroupRoutes>[1];
  healthDatabaseProbe: Parameters<typeof registerHealthRoutes>[2];
  jobService: Parameters<typeof registerAdminJobRoutes>[1];
  lifePostImageStorageService: Parameters<typeof registerLifeRoutes>[2];
  lifePostService: Parameters<typeof registerLifeRoutes>[1];
  memberAuthService: Parameters<typeof registerMemberAuthRoutes>[1];
  memberService: Parameters<typeof registerMemberAuthRoutes>[2];
  memberAuthRateLimiter: Parameters<typeof registerMemberAuthRoutes>[4];
  ministryAnalyticsService: Parameters<typeof registerAdminDashboardRoutes>[1];
  newcomerService: Parameters<typeof registerNewcomerRoutes>[1];
  notificationDeliveryRepository: Parameters<
    typeof registerAdminNotificationRoutes
  >[1];
  notificationInboxService: Parameters<typeof registerMemberNotificationRoutes>[2];
  notificationService: Parameters<typeof registerMemberNotificationRoutes>[1];
  prayerService: Parameters<typeof registerPrayerRoutes>[1];
  readingPlanService: Parameters<typeof registerReadingPlanRoutes>[1];
  sermonDiscussionGuideService: Parameters<
    typeof registerSermonDiscussionGuideRoutes
  >[1];
  sermonService: Parameters<typeof registerSermonRoutes>[1];
  sermonAudioCleanupService: Parameters<typeof registerAdminSermonRoutes>[2];
  sermonProgressService: Parameters<typeof registerSermonRoutes>[2];
  servingService: Parameters<typeof registerServingRoutes>[1];
  settingsService: Parameters<typeof registerSettingsRoutes>[1];
};

export async function registerAppRoutes(
  app: FastifyInstance,
  config: AppConfig,
  dependencies: AppRouteDependencies
) {
  const adminPermission = (permission: AdminPermission) =>
    requirePermission(dependencies.adminAuthService, permission);

  await registerHealthRoutes(app, config, dependencies.healthDatabaseProbe);
  await registerPublicLandingRoutes(app, dependencies.settingsService);
  await registerSermonRoutes(
    app,
    dependencies.sermonService,
    dependencies.sermonProgressService,
    dependencies.memberAuthService,
    dependencies.contentLocalizationService
  );
  await registerSermonDiscussionGuideRoutes(
    app,
    dependencies.sermonDiscussionGuideService,
    dependencies.memberAuthService,
    dependencies.contentLocalizationService
  );
  await registerLifeRoutes(
    app,
    dependencies.lifePostService,
    dependencies.lifePostImageStorageService,
    dependencies.memberAuthService,
    dependencies.auditService,
    dependencies.contentLocalizationService
  );
  await registerBibleKnowledgeRoutes(app, dependencies.bibleKnowledgeService);
  await registerBibleVerseNoteRoutes(
    app,
    dependencies.bibleVerseNoteService,
    dependencies.memberAuthService,
    dependencies.auditService,
    adminPermission
  );
  await registerSettingsRoutes(app, dependencies.settingsService);
  await registerMemberAuthRoutes(
    app,
    dependencies.memberAuthService,
    dependencies.memberService,
    dependencies.auditService,
    dependencies.memberAuthRateLimiter
  );
  await registerMemberNotificationRoutes(
    app,
    dependencies.notificationService,
    dependencies.notificationInboxService,
    dependencies.memberAuthService
  );
  await registerPrayerRoutes(
    app,
    dependencies.prayerService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerReadingPlanRoutes(
    app,
    dependencies.readingPlanService,
    dependencies.memberAuthService
  );
  await registerGroupRoutes(
    app,
    dependencies.groupService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerCourseRoutes(
    app,
    dependencies.courseService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerServingRoutes(
    app,
    dependencies.servingService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerCareRoutes(
    app,
    dependencies.careService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerNewcomerRoutes(
    app,
    dependencies.newcomerService,
    dependencies.auditService
  );
  await registerDiscipleshipRoutes(
    app,
    dependencies.discipleshipService,
    dependencies.memberAuthService
  );
  await registerMemberGivingRoutes(
    app,
    dependencies.givingService,
    dependencies.memberAuthService,
    dependencies.auditService
  );
  await registerStripeGivingWebhookRoutes(app, dependencies.givingService);
  await registerAdminAuthRoutes(app, dependencies.adminAuthService);
  await registerContentLocalizationRoutes(app, dependencies.contentLocalizationService, dependencies.contentLocalizationResourceDirectory, dependencies.contentLocalizationAiService, dependencies.contentLocalizationAiManagementService, dependencies.contentLocalizationAuditService, dependencies.contentLocalizationAiRateLimiter, adminPermission);
  await registerAiRoutes(
    app,
    dependencies.aiService,
    dependencies.memberAuthService,
    dependencies.auditService,
    dependencies.aiRateLimiter,
    dependencies.aiManagementService,
    adminPermission
  );
  await registerAdminUserRoutes(app, dependencies.adminAuthService, adminPermission);
  await registerAdminAuditRoutes(app, dependencies.auditService, adminPermission);
  await registerAdminDashboardRoutes(
    app,
    dependencies.ministryAnalyticsService,
    adminPermission
  );
  await registerAdminMemberRoutes(
    app,
    dependencies.memberService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminBibleKnowledgeRoutes(
    app,
    dependencies.bibleKnowledgeService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminLifePostRoutes(
    app,
    dependencies.lifePostService,
    dependencies.lifePostImageStorageService,
    dependencies.notificationService,
    dependencies.auditService,
    dependencies.aiService,
    dependencies.aiManagementService,
    dependencies.aiRateLimiter,
    adminPermission
  );
  await registerAdminGroupRoutes(
    app,
    dependencies.groupService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminCourseRoutes(
    app,
    dependencies.courseService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminServingRoutes(
    app,
    dependencies.servingService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminCareRoutes(
    app,
    dependencies.careService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminNewcomerRoutes(
    app,
    dependencies.newcomerService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminDiscipleshipRoutes(
    app,
    dependencies.discipleshipService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminPrayerRequestRoutes(
    app,
    dependencies.prayerService,
    dependencies.notificationService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminReadingPlanRoutes(
    app,
    dependencies.readingPlanService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminSermonDiscussionGuideRoutes(
    app,
    dependencies.sermonDiscussionGuideService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminGivingRoutes(
    app,
    dependencies.givingService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminSettingsRoutes(
    app,
    dependencies.settingsService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminJobRoutes(
    app,
    dependencies.jobService,
    config,
    adminPermission
  );
  await registerAdminNotificationRoutes(
    app,
    dependencies.notificationDeliveryRepository,
    dependencies.notificationService,
    dependencies.auditService,
    adminPermission
  );
  await registerAdminSermonRoutes(
    app,
    dependencies.sermonService,
    dependencies.sermonAudioCleanupService,
    dependencies.notificationService,
    dependencies.auditService,
    adminPermission
  );
}
