export type ApiRouteContractSurface =
  | "public"
  | "member"
  | "admin"
  | "provider"
  | "diagnostic";

export type ApiRouteContractEntry = {
  featureId: string;
  surface: ApiRouteContractSurface;
  owner: string;
  contractFile: string | null;
  sdkDocs: readonly string[];
  backendRouteFiles: readonly string[];
  clientFiles: readonly string[];
  routes: readonly string[];
  notes?: string;
};

export const apiRouteContractRegistry = [
  {
    featureId: "health",
    surface: "diagnostic",
    owner: "backend",
    contractFile: null,
    sdkDocs: ["docs/operations.md"],
    backendRouteFiles: ["backend/src/modules/health/health.routes.ts"],
    clientFiles: [],
    routes: ["GET /v1/health"],
    notes: "Diagnostic endpoint; response is intentionally small and local to the API surface."
  },
  {
    featureId: "settings",
    surface: "public",
    owner: "settings",
    contractFile: "packages/api_contracts/src/settings.ts",
    sdkDocs: ["docs/sdk/admin.md"],
    backendRouteFiles: [
      "backend/src/modules/settings/settings.routes.ts",
      "backend/src/modules/admin/settings/admin-settings.routes.ts"
    ],
    clientFiles: ["apps/admin_web/src/core/api/settings.ts"],
    routes: [
      "GET /v1/settings/public",
      "GET /v1/admin/settings",
      "PATCH /v1/admin/settings/:settingKey"
    ]
  },
  {
    featureId: "public_landing",
    surface: "public",
    owner: "public-web",
    contractFile: "packages/api_contracts/src/public.ts",
    sdkDocs: ["docs/surfaces/public_web.md"],
    backendRouteFiles: ["backend/src/modules/public/public_landing.routes.ts"],
    clientFiles: [
      "apps/public_web/src/core/api/client.ts",
      "apps/public_web/src/composables/use_landing_content.ts"
    ],
    routes: ["GET /v1/public/landing"],
    notes:
      "Public website landing resources and CTA actions. Sermon consumption remains owned by the mobile App."
  },
  {
    featureId: "admin_auth",
    surface: "admin",
    owner: "admin-auth",
    contractFile: "packages/api_contracts/src/auth.ts",
    sdkDocs: ["docs/sdk/auth.md", "docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/admin/auth/admin-auth.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/auth.ts"],
    routes: [
      "POST /v1/admin/auth/login",
      "POST /v1/admin/auth/refresh",
      "POST /v1/admin/auth/logout",
      "GET /v1/admin/auth/me",
      "POST /v1/admin/auth/change-password"
    ]
  },
  {
    featureId: "member_auth",
    surface: "member",
    owner: "member-auth",
    contractFile: "packages/api_contracts/src/auth.ts",
    sdkDocs: ["docs/sdk/auth.md"],
    backendRouteFiles: ["backend/src/modules/members/auth/member-auth.routes.ts"],
    clientFiles: [
      "apps/mobile/lib/features/member_auth/data/member_session_repository.dart"
    ],
    routes: [
      "GET /v1/member/auth/registration-settings",
      "POST /v1/member/auth/firebase",
      "POST /v1/member/auth/login",
      "POST /v1/member/auth/password-reset/request",
      "POST /v1/member/auth/password-reset/confirm",
      "POST /v1/member/auth/register",
      "POST /v1/member/auth/verify-code",
      "GET /v1/member/auth/me",
      "PATCH /v1/member/profile",
      "POST /v1/member/auth/logout"
    ]
  },
  {
    featureId: "newcomer_followup",
    surface: "public",
    owner: "newcomers",
    contractFile: "packages/api_contracts/src/newcomers.ts",
    sdkDocs: ["docs/sdk/growth.md"],
    backendRouteFiles: [
      "backend/src/modules/newcomers/newcomer.routes.ts",
      "backend/src/modules/admin/newcomers/admin-newcomers.routes.ts"
    ],
    clientFiles: [
      "apps/admin_web/src/core/api/newcomers.ts",
      "apps/mobile/lib/features/life/data/newcomer_repository.dart"
    ],
    routes: [
      "POST /v1/newcomers",
      "GET /v1/admin/newcomers",
      "GET /v1/admin/newcomers/:newcomerId",
      "PATCH /v1/admin/newcomers/:newcomerId",
      "GET /v1/admin/newcomers/:newcomerId/follow-ups",
      "POST /v1/admin/newcomers/:newcomerId/follow-ups"
    ],
    notes:
      "Public newcomer submission plus admin follow-up queue. Admin Web helper/page and App Life submission are connected."
  },
  {
    featureId: "discipleship_journey",
    surface: "member",
    owner: "discipleship",
    contractFile: "packages/api_contracts/src/discipleship.ts",
    sdkDocs: ["docs/sdk/growth.md"],
    backendRouteFiles: [
      "backend/src/modules/discipleship/discipleship.routes.ts",
      "backend/src/modules/admin/discipleship/admin-discipleship.routes.ts"
    ],
    clientFiles: [
      "apps/admin_web/src/core/api/discipleship.ts",
      "apps/mobile/lib/features/discipleship/data/discipleship_repository.dart"
    ],
    routes: [
      "GET /v1/me/discipleship",
      "GET /v1/admin/discipleship/journeys",
      "POST /v1/admin/discipleship/journeys",
      "PATCH /v1/admin/discipleship/journeys/:journeyId",
      "GET /v1/admin/discipleship/journeys/:journeyId/stages",
      "POST /v1/admin/discipleship/journeys/:journeyId/stages",
      "GET /v1/admin/discipleship/journeys/:journeyId/tasks",
      "POST /v1/admin/discipleship/journeys/:journeyId/tasks",
      "GET /v1/admin/discipleship/assignments",
      "POST /v1/admin/discipleship/assignments",
      "PATCH /v1/admin/discipleship/assignments/:assignmentId/tasks/:taskId"
    ],
    notes:
      "Growth-path orchestration layer. Task references point to owner features instead of copying their data."
  },
  {
    featureId: "reading_plan",
    surface: "member",
    owner: "reading-plans",
    contractFile: "packages/api_contracts/src/reading-plans.ts",
    sdkDocs: ["docs/sdk/bible.md", "docs/sdk/growth.md"],
    backendRouteFiles: [
      "backend/src/modules/reading-plans/reading-plan.routes.ts",
      "backend/src/modules/admin/reading-plans/admin-reading-plan.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/study/data/reading_plan_repository.dart",
      "apps/mobile/lib/features/mine/presentation/my_reading_plans_page.dart",
      "apps/admin_web/src/core/api/reading_plans.ts"
    ],
    routes: [
      "GET /v1/reading-plans",
      "GET /v1/reading-plans/:planId/days",
      "POST /v1/reading-plans/:planId/assignments",
      "GET /v1/me/reading-plans",
      "GET /v1/me/reading-plans/:assignmentId",
      "PATCH /v1/reading-plans/assignments/:assignmentId/status",
      "PATCH /v1/reading-plans/assignments/:assignmentId/days/:dayId",
      "GET /v1/admin/reading-plans",
      "POST /v1/admin/reading-plans",
      "PATCH /v1/admin/reading-plans/:planId",
      "GET /v1/admin/reading-plans/:planId/days",
      "POST /v1/admin/reading-plans/:planId/days",
      "GET /v1/admin/reading-plans/assignments",
      "POST /v1/admin/reading-plans/assignments"
    ],
    notes:
      "Backend stores plan metadata, assignments, progress, and scripture references only. Bible text remains local to the App."
  },
  {
    featureId: "sermons",
    surface: "public",
    owner: "sermons",
    contractFile: "packages/api_contracts/src/sermons.ts",
    sdkDocs: ["docs/sdk/sermons.md"],
    backendRouteFiles: [
      "backend/src/modules/sermons/sermon.routes.ts",
      "backend/src/modules/admin/sermons/admin-sermons.routes.ts",
      "backend/src/modules/admin/sermons/admin_sermon_audio.routes.ts",
      "backend/src/modules/admin/sermons/admin_sermon_workflow.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/sermons/data/sermons_repository.dart",
      "apps/mobile/lib/features/sermons/data/sermon_progress_repository.dart",
      "apps/admin_web/src/core/api/sermons.ts"
    ],
    routes: [
      "GET /v1/sermons",
      "GET /v1/sermons/facets",
      "GET /v1/sermons/recommendations",
      "GET /v1/sermons/:sermonId",
      "GET /v1/sermons/:sermonId/audio",
      "GET /v1/sermons/:sermonId/progress",
      "POST /v1/sermons/:sermonId/progress",
      "GET /v1/admin/sermons",
      "GET /v1/admin/sermons/:sermonId",
      "POST /v1/admin/sermons/local-drafts",
      "PATCH /v1/admin/sermons/:sermonId",
      "POST /v1/admin/sermons/:sermonId/local-package",
      "POST /v1/admin/sermons/:sermonId/publish",
      "POST /v1/admin/sermons/:sermonId/submit-review",
      "POST /v1/admin/sermons/:sermonId/return-draft",
      "POST /v1/admin/sermons/:sermonId/mark-failed",
      "POST /v1/admin/sermons/:sermonId/archive",
      "DELETE /v1/admin/sermons/:sermonId",
      "POST /v1/admin/sermons/:sermonId/audio",
      "GET /v1/admin/sermons/:sermonId/audio",
      "DELETE /v1/admin/sermons/:sermonId/audio",
      "GET /v1/admin/sermons/audio-cleanups",
      "POST /v1/admin/sermons/audio-cleanups/:cleanupTaskId/retry"
    ]
  },
  {
    featureId: "sermon_discussion_guide",
    surface: "member",
    owner: "sermon-discussion-guides",
    contractFile: "packages/api_contracts/src/sermon-discussion-guides.ts",
    sdkDocs: ["docs/sdk/sermons.md", "docs/sdk/growth.md"],
    backendRouteFiles: [
      "backend/src/modules/sermon-discussion-guides/sermon-discussion-guide.routes.ts",
      "backend/src/modules/admin/sermon-discussion-guides/admin-sermon-discussion-guide.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/sermons/data/sermon_discussion_guide_repository.dart",
      "apps/admin_web/src/core/api/sermon_discussion_guides.ts"
    ],
    routes: [
      "GET /v1/sermons/:sermonId/discussion-guide",
      "POST /v1/sermon-discussion-guides/:guideId/responses",
      "GET /v1/admin/sermon-discussion-guides",
      "POST /v1/admin/sermon-discussion-guides",
      "PATCH /v1/admin/sermon-discussion-guides/:guideId",
      "GET /v1/admin/sermon-discussion-guides/:guideId/responses",
      "PATCH /v1/admin/sermon-discussion-guides/responses/:responseId/hide"
    ],
    notes:
      "Discussion guide stores sermon-linked discussion material and private/default user responses. It does not copy sermon source text or audio."
  },
  {
    featureId: "life_posts_and_events",
    surface: "member",
    owner: "life",
    contractFile: "packages/api_contracts/src/life.ts",
    sdkDocs: ["docs/sdk/life.md"],
    backendRouteFiles: [
      "backend/src/modules/life/life.routes.ts",
      "backend/src/modules/admin/life-posts/admin-life-posts.routes.ts",
      "backend/src/modules/admin/life-posts/admin_life_post_registrations.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/life_repository.dart",
      "apps/admin_web/src/core/api/life_posts.ts"
    ],
    routes: [
      "GET /v1/life/posts",
      "GET /v1/life/posts/:postId",
      "GET /v1/member/life/posts",
      "GET /v1/member/life/posts/:postId",
      "POST /v1/member/life/posts/:postId/read",
      "POST /v1/member/life/posts/:postId/register",
      "POST /v1/member/life/posts/:postId/registration/cancel",
      "PATCH /v1/member/life/posts/:postId/registration",
      "POST /v1/member/life/check-in-code",
      "POST /v1/member/life/posts/:postId/registration/check-in",
      "GET /v1/life/images/:fileName",
      "GET /v1/admin/life-posts",
      "POST /v1/admin/life-posts/images",
      "POST /v1/admin/life-posts",
      "POST /v1/admin/life-posts/:postId/notification-translation",
      "PATCH /v1/admin/life-posts/:postId",
      "POST /v1/admin/life-posts/:postId/publish",
      "POST /v1/admin/life-posts/:postId/submit-review",
      "POST /v1/admin/life-posts/:postId/return-draft",
      "POST /v1/admin/life-posts/:postId/archive",
      "POST /v1/admin/life-posts/:postId/unpublish",
      "DELETE /v1/admin/life-posts/:postId",
      "POST /v1/admin/life-posts/:postId/check-in-code",
      "GET /v1/admin/life-posts/:postId/registrations",
      "POST /v1/admin/life-posts/:postId/registrations",
      "PATCH /v1/admin/life-posts/:postId/registrations/:registrationId",
      "GET /v1/admin/life-posts/:postId/registrations/export"
    ]
  },
  {
    featureId: "prayer",
    surface: "member",
    owner: "prayer",
    contractFile: "packages/api_contracts/src/prayer.ts",
    sdkDocs: ["docs/sdk/prayer.md"],
    backendRouteFiles: [
      "backend/src/modules/prayer/prayer.routes.ts",
      "backend/src/modules/admin/prayer-requests/admin-prayer-requests.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/prayer_repository.dart",
      "apps/admin_web/src/core/api/prayer_requests.ts"
    ],
    routes: [
      "GET /v1/prayer-requests",
      "POST /v1/prayer-requests",
      "GET /v1/member/prayer-requests",
      "GET /v1/member/prayer-requests/shared",
      "GET /v1/admin/prayer-requests",
      "PATCH /v1/admin/prayer-requests/:requestId",
      "POST /v1/admin/prayer-requests/:requestId/approve",
      "POST /v1/admin/prayer-requests/:requestId/hide",
      "POST /v1/admin/prayer-requests/:requestId/archive",
      "DELETE /v1/admin/prayer-requests/:requestId"
    ]
  },
  {
    featureId: "giving",
    surface: "member",
    owner: "giving",
    contractFile: "packages/api_contracts/src/giving.ts",
    sdkDocs: ["docs/sdk/giving.md"],
    backendRouteFiles: [
      "backend/src/modules/giving/member-giving.routes.ts",
      "backend/src/modules/admin/giving/admin-giving.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/giving_repository.dart",
      "apps/admin_web/src/core/api/giving.ts"
    ],
    routes: [
      "GET /v1/member/giving/funds",
      "POST /v1/member/giving/checkout-sessions",
      "GET /v1/member/giving/transactions",
      "GET /v1/member/giving/statements",
      "GET /v1/member/giving/statements/:year",
      "GET /v1/member/giving/statements/:year/download",
      "GET /v1/admin/giving/funds",
      "POST /v1/admin/giving/funds",
      "PATCH /v1/admin/giving/funds/:fundId",
      "GET /v1/admin/giving/provider-events",
      "GET /v1/admin/giving/reconciliation",
      "GET /v1/admin/giving/transactions",
      "GET /v1/admin/giving/transactions/:transactionId",
      "GET /v1/admin/giving/statements",
      "GET /v1/admin/giving/statements/:statementId",
      "GET /v1/admin/giving/statements/:statementId/download",
      "POST /v1/admin/giving/statements/:year/generate",
      "GET /v1/admin/giving/export"
    ]
  },
  {
    featureId: "giving_provider_callbacks",
    surface: "provider",
    owner: "giving",
    contractFile: "packages/api_contracts/src/giving.ts",
    sdkDocs: ["docs/sdk/giving.md"],
    backendRouteFiles: ["backend/src/modules/giving/member-giving.routes.ts"],
    clientFiles: [],
    routes: ["POST /v1/webhooks/giving/stripe"],
    notes: "Provider callback; Stripe webhook signature verification is owned by the backend service."
  },
  {
    featureId: "notifications",
    surface: "member",
    owner: "notifications",
    contractFile: "packages/api_contracts/src/push.ts",
    sdkDocs: ["docs/sdk/notifications.md"],
    backendRouteFiles: [
      "backend/src/modules/notifications/member-notification.routes.ts",
      "backend/src/modules/admin/notifications/admin_notifications.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/push_notification_repository.dart",
      "apps/mobile/lib/features/life/data/push_notification_inbox_repository.dart",
      "apps/admin_web/src/core/api/notifications.ts"
    ],
    routes: [
      "PUT /v1/app/devices/push-token",
      "POST /v1/app/devices/push-token/revoke",
      "GET /v1/member/notifications",
      "PATCH /v1/member/notifications/:notificationId/read",
      "PATCH /v1/member/notifications/read-all",
      "PATCH /v1/member/notifications/archive-all",
      "PATCH /v1/member/notifications/:notificationId/archive",
      "PATCH /v1/member/preferences/notifications",
      "PUT /v1/member/devices/push-token",
      "POST /v1/member/devices/push-token/revoke",
      "GET /v1/admin/notifications/deliveries",
      "POST /v1/admin/notifications/deliveries/retry-due",
      "POST /v1/admin/notifications/deliveries/:taskId/retry",
      "POST /v1/admin/notifications/deliveries/:taskId/cancel"
    ]
  },
  {
    featureId: "ai",
    surface: "member",
    owner: "ai",
    contractFile: "packages/api_contracts/src/ai.ts",
    sdkDocs: ["docs/sdk/ai.md"],
    backendRouteFiles: ["backend/src/modules/ai/ai.routes.ts"],
    clientFiles: [
      "apps/mobile/lib/features/study/data/ai_study_repository.dart",
      "apps/mobile/lib/features/sermons/data/sermon_ai_repository.dart",
      "apps/admin_web/src/core/api/ai.ts"
    ],
    routes: [
      "GET /v1/admin/ai/status",
      "GET /v1/admin/ai/management",
      "PUT /v1/admin/ai/providers/:providerId",
      "POST /v1/admin/ai/providers/:providerId/test",
      "PUT /v1/admin/ai/policies/:capability",
      "PUT /v1/admin/ai/budget",
      "POST /v1/admin/ai/drafts",
      "POST /v1/member/ai/study"
    ]
  },
  {
    featureId: "content_localization",
    surface: "admin",
    owner: "content-localization",
    contractFile: "packages/api_contracts/src/content_localization.ts",
    sdkDocs: ["docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/content-localization/content-localization.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/content_localizations.ts"],
    routes: [
      "GET /v1/admin/content-localizations/:resourceType/:resourceId",
      "PUT /v1/admin/content-localizations/:resourceType/:resourceId/:locale",
      "POST /v1/admin/content-localizations/:resourceType/:resourceId/:locale/auto-translate"
    ]
  },
  {
    featureId: "bible_knowledge",
    surface: "public",
    owner: "bible-knowledge",
    contractFile: "packages/api_contracts/src/bible-knowledge.ts",
    sdkDocs: ["docs/sdk/bible.md"],
    backendRouteFiles: [
      "backend/src/modules/bible-knowledge/bible-knowledge.routes.ts",
      "backend/src/modules/admin/bible-knowledge/admin-bible-knowledge.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/study/data/bible_people_repository.dart",
      "apps/mobile/lib/features/study/data/bible_places_repository.dart",
      "apps/admin_web/src/core/api/bible_knowledge.ts"
    ],
    routes: [
      "GET /v1/bible-knowledge",
      "GET /v1/admin/bible-knowledge",
      "POST /v1/admin/bible-knowledge",
      "PATCH /v1/admin/bible-knowledge/:entityId",
      "DELETE /v1/admin/bible-knowledge/:entityId"
    ]
  },
  {
    featureId: "bible_verse_notes",
    surface: "member",
    owner: "bible-notes",
    contractFile: "packages/api_contracts/src/bible-verse-notes.ts",
    sdkDocs: ["docs/sdk/bible.md"],
    backendRouteFiles: [
      "backend/src/modules/bible-verse-notes/bible-verse-note.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/study/data/bible_notes_repository.dart",
      "apps/admin_web/src/core/api/bible_verse_notes.ts"
    ],
    routes: [
      "GET /v1/bible/verse-notes",
      "POST /v1/bible/verse-notes",
      "PATCH /v1/bible/verse-notes/:noteId",
      "DELETE /v1/bible/verse-notes/:noteId",
      "GET /v1/admin/bible/verse-notes",
      "PATCH /v1/admin/bible/verse-notes/:noteId/hide",
      "PATCH /v1/admin/bible/verse-notes/:noteId/restore"
    ],
    notes:
      "Bible text remains local to the App; backend stores public reflections by verseId."
  },
  {
    featureId: "groups",
    surface: "member",
    owner: "groups",
    contractFile: "packages/api_contracts/src/groups.ts",
    sdkDocs: ["docs/sdk/ministry.md"],
    backendRouteFiles: [
      "backend/src/modules/groups/group.routes.ts",
      "backend/src/modules/admin/groups/admin-groups.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/group_repository.dart",
      "apps/admin_web/src/core/api/groups.ts",
      "apps/admin_web/src/core/api/group_activity.ts"
    ],
    routes: [
      "GET /v1/groups",
      "GET /v1/groups/:groupId",
      "GET /v1/me/groups",
      "POST /v1/groups/:groupId/applications",
      "PATCH /v1/groups/:groupId/applications/:applicationId",
      "GET /v1/admin/groups",
      "POST /v1/admin/groups",
      "PATCH /v1/admin/groups/:groupId",
      "GET /v1/admin/groups/:groupId/applications",
      "PATCH /v1/admin/groups/:groupId/applications/:applicationId",
      "GET /v1/admin/groups/:groupId/memberships",
      "PATCH /v1/admin/groups/:groupId/memberships/:userId",
      "GET /v1/admin/groups/:groupId/materials",
      "POST /v1/admin/groups/:groupId/materials",
      "PATCH /v1/admin/groups/:groupId/materials/:assignmentId",
      "GET /v1/admin/groups/:groupId/attendance",
      "POST /v1/admin/groups/:groupId/attendance"
    ]
  },
  {
    featureId: "courses",
    surface: "member",
    owner: "courses",
    contractFile: "packages/api_contracts/src/courses.ts",
    sdkDocs: ["docs/sdk/ministry.md"],
    backendRouteFiles: [
      "backend/src/modules/courses/course.routes.ts",
      "backend/src/modules/admin/courses/admin-courses.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/course_repository.dart",
      "apps/admin_web/src/core/api/courses.ts"
    ],
    routes: [
      "GET /v1/courses",
      "GET /v1/courses/:courseId",
      "GET /v1/me/courses",
      "POST /v1/courses/:courseId/enrollments",
      "GET /v1/admin/courses",
      "POST /v1/admin/courses",
      "PATCH /v1/admin/courses/:courseId",
      "GET /v1/admin/courses/:courseId/lessons",
      "POST /v1/admin/courses/:courseId/lessons",
      "PATCH /v1/admin/courses/:courseId/lessons/:lessonId",
      "GET /v1/admin/courses/:courseId/enrollments",
      "PATCH /v1/admin/courses/:courseId/enrollments/:enrollmentId"
    ]
  },
  {
    featureId: "serving",
    surface: "member",
    owner: "serving",
    contractFile: "packages/api_contracts/src/serving.ts",
    sdkDocs: ["docs/sdk/ministry.md"],
    backendRouteFiles: [
      "backend/src/modules/serving/serving.routes.ts",
      "backend/src/modules/admin/serving/admin-serving.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/serving_repository.dart",
      "apps/admin_web/src/core/api/serving.ts"
    ],
    routes: [
      "GET /v1/me/serving-assignments",
      "POST /v1/serving-assignments/:assignmentId/confirm",
      "POST /v1/serving-assignments/:assignmentId/leave-request",
      "GET /v1/me/serving-availability",
      "POST /v1/me/serving-availability",
      "GET /v1/me/serving-check-ins",
      "POST /v1/serving-assignments/:assignmentId/check-in",
      "GET /v1/admin/serving/members",
      "GET /v1/admin/serving/teams",
      "POST /v1/admin/serving/teams",
      "PATCH /v1/admin/serving/teams/:teamId",
      "GET /v1/admin/serving/roles",
      "POST /v1/admin/serving/roles",
      "PATCH /v1/admin/serving/roles/:roleId",
      "GET /v1/admin/serving/assignments",
      "POST /v1/admin/serving/assignments",
      "PATCH /v1/admin/serving/assignments/:assignmentId",
      "GET /v1/admin/serving/availability",
      "POST /v1/admin/serving/availability",
      "GET /v1/admin/serving/check-ins",
      "POST /v1/admin/serving/assignments/:assignmentId/check-in"
    ]
  },
  {
    featureId: "care",
    surface: "member",
    owner: "care",
    contractFile: "packages/api_contracts/src/care.ts",
    sdkDocs: ["docs/sdk/people.md"],
    backendRouteFiles: [
      "backend/src/modules/care/care.routes.ts",
      "backend/src/modules/admin/care/admin_care.routes.ts"
    ],
    clientFiles: [
      "apps/mobile/lib/features/life/data/care_repository.dart",
      "apps/admin_web/src/core/api/care.ts"
    ],
    routes: [
      "GET /v1/me/care-requests",
      "GET /v1/me/care-requests/:careRequestId",
      "POST /v1/me/care-requests",
      "GET /v1/admin/care-assignees",
      "GET /v1/admin/care-requests",
      "PATCH /v1/admin/care-requests/:careRequestId",
      "GET /v1/admin/care-requests/:careRequestId/follow-ups",
      "POST /v1/admin/care-requests/:careRequestId/follow-ups"
    ]
  },
  {
    featureId: "members",
    surface: "admin",
    owner: "members",
    contractFile: "packages/api_contracts/src/members.ts",
    sdkDocs: ["docs/sdk/people.md", "docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/admin/members/admin-members.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/members.ts"],
    routes: [
      "GET /v1/admin/members",
      "GET /v1/admin/members/:memberId",
      "POST /v1/admin/members",
      "PATCH /v1/admin/members/:memberId"
    ]
  },
  {
    featureId: "admin_users",
    surface: "admin",
    owner: "admin-users",
    contractFile: "packages/api_contracts/src/auth.ts",
    sdkDocs: ["docs/sdk/admin.md", "docs/sdk/auth.md"],
    backendRouteFiles: ["backend/src/modules/admin/users/admin-users.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/admin_users.ts"],
    routes: [
      "GET /v1/admin/users",
      "POST /v1/admin/users",
      "PATCH /v1/admin/users/:adminUserId",
      "POST /v1/admin/users/:adminUserId/reset-password"
    ]
  },
  {
    featureId: "audit_logs",
    surface: "admin",
    owner: "audit",
    contractFile: "packages/api_contracts/src/audit.ts",
    sdkDocs: ["docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/admin/audit/admin-audit.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/audit_logs.ts"],
    routes: ["GET /v1/admin/audit-logs"]
  },
  {
    featureId: "dashboard",
    surface: "admin",
    owner: "dashboard",
    contractFile: "packages/api_contracts/src/dashboard.ts",
    sdkDocs: ["docs/sdk/analytics.md", "docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/admin/dashboard/admin-dashboard.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/dashboard.ts"],
    routes: ["GET /v1/admin/dashboard"]
  },
  {
    featureId: "jobs",
    surface: "admin",
    owner: "jobs",
    contractFile: "packages/api_contracts/src/jobs.ts",
    sdkDocs: ["docs/sdk/admin.md"],
    backendRouteFiles: ["backend/src/modules/admin/jobs/admin-jobs.routes.ts"],
    clientFiles: ["apps/admin_web/src/core/api/jobs.ts"],
    routes: [
      "GET /v1/admin/jobs",
      "GET /v1/admin/jobs/stats",
      "GET /v1/admin/jobs/sermon-pipeline-status",
      "GET /v1/admin/jobs/:jobId",
      "PATCH /v1/admin/jobs/:jobId/status",
      "POST /v1/admin/jobs/:jobId/cancel"
    ]
  }
] as const satisfies readonly ApiRouteContractEntry[];
