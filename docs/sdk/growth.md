# Growth SDK

状态：三阶段第一版已接入，newcomer follow-up、discipleship journey、reading plan 和 sermon discussion guide 的 App/Admin SDK 已接入

## Scope

Growth SDK 覆盖门徒成长主线相关 client contract：

- newcomer follow-up。
- discipleship journey。
- reading plan。
- sermon discussion guide。

当前代码阶段已接入 `newcomer_followup`、`discipleship_journey`、`reading_plan` 与 `sermon_discussion_guide` 后端 API contract 和 backend routes。`newcomer_followup` 已有 Admin Web API helper、后台页面、App repository 和 Life 新朋友提交入口；`discipleship_journey` 已有 Admin Web API helper、后台管理入口、App repository 和 Mine 进度摘要；`reading_plan` 已有 Admin Web API helper、后台管理入口、App repository、Study 入口和 Mine 进度摘要；`sermon_discussion_guide` 已有 Admin Web API helper、后台管理入口、App repository 和讲道详情读取/私密回应入口。

## Newcomer Follow-up Routes

Public/App submission：

- `POST /v1/newcomers`

Admin queue：

- `GET /v1/admin/newcomers`
- `GET /v1/admin/newcomers/:newcomerId`
- `PATCH /v1/admin/newcomers/:newcomerId`
- `GET /v1/admin/newcomers/:newcomerId/follow-ups`
- `POST /v1/admin/newcomers/:newcomerId/follow-ups`

Admin Web helper：

- `apps/admin_web/src/core/api/newcomers.ts`

Mobile App repository and surface：

- `apps/mobile/lib/features/life/data/newcomer_repository.dart`
- `apps/mobile/lib/features/life/data/dto/newcomer_submission_dto.dart`
- `apps/mobile/lib/features/life/presentation/widgets/newcomer_welcome_sheet.dart`

## Rules

- Public newcomer submission can include `externalUserId`, but it does not create a member account. App clients send the same `ext_` installation id in `X-External-User-Id`; a conflicting body value is rejected. A public submission must include that installation identity, an email, or a phone number so the record remains follow-up capable.
- Public submission responses use `newcomerSubmissionSchema`, not the Admin `newcomerProfileSchema`; App code must not receive contact details, interest, identity links, assignment fields, or conversion state.
- Admin follow-up notes are admin-only and must not be returned to normal App user profile APIs.
- Non-completed follow-up records require `plannedAt` and reject `completedAt`; completed records may omit `completedAt` so the backend records its canonical completion time.
- Audit payloads must avoid storing contact content or follow-up note body.
- App and Admin clients must call typed helpers/repositories and parse shared schemas from `packages/api_contracts/src/newcomers.ts`.

## Discipleship Journey Routes

Member/App read side：

- `GET /v1/me/discipleship`

Admin orchestration：

- `GET /v1/admin/discipleship/journeys`
- `POST /v1/admin/discipleship/journeys`
- `PATCH /v1/admin/discipleship/journeys/:journeyId`
- `GET /v1/admin/discipleship/journeys/:journeyId/stages`
- `POST /v1/admin/discipleship/journeys/:journeyId/stages`
- `GET /v1/admin/discipleship/journeys/:journeyId/tasks`
- `POST /v1/admin/discipleship/journeys/:journeyId/tasks`
- `GET /v1/admin/discipleship/assignments`
- `POST /v1/admin/discipleship/assignments`
- `PATCH /v1/admin/discipleship/assignments/:assignmentId/tasks/:taskId`

Assignment payloads include backend-owned progress summary fields:

- `taskTotalCount`: task count for the assignment's journey.
- `completedTaskCount`: completed progress count for the assignment.

Mobile and Admin clients must display these summary fields instead of deriving
the total from `progress.length`.

Admin Web reads stage and task lists from the backend after selecting a journey.
It should use the returned stage list for task-stage selection instead of
holding only the last created stage id in page state.

Admin Web updates assignment task progress through
`PATCH /v1/admin/discipleship/assignments/:assignmentId/tasks/:taskId`.
The UI sends the selected task status and note only; assignment summaries and
canonical progress rows are refreshed from the backend after save.

Admin Web helper and surface：

- `apps/admin_web/src/core/api/discipleship.ts`
- `apps/admin_web/src/features/discipleship/pages/DiscipleshipPage.vue`

Mobile App repository and surface：

- `apps/mobile/lib/features/discipleship/data/discipleship_repository.dart`
- `apps/mobile/lib/features/discipleship/presentation/widgets/mine_discipleship_card.dart`

## Discipleship Rules

- Journey tasks store reference type and reference id only.
- Backend reference directories verify referenced resources through their owning
  repositories; `group_application` uses `groupId:applicationId` and
  `event_registration` uses `lifePostId:registrationId`.
- Member assignments omit `sourceId` and require an existing member `userId`;
  newcomer assignments require an existing newcomer `sourceId`.
- Reading plan tasks should reference the plan or assignment id instead of copying day progress.
- Sermon discussion guide tasks should reference the guide id instead of copying questions or responses.
- A journey assignment does not grant membership, group access, course access, or serving permissions.
- Assignment task totals and completed counts are backend-owned summary fields.
- Member reads use `memberDiscipleshipAssignmentSchema`; internal source links,
  admin assignee IDs, and progress notes remain Admin-only.
- `completedAt` is backend-owned and defaults to `null` when a task is moved
  away from `completed`.
- Task progress audit payloads store `hasNote`, not the raw note body.
- App and Admin clients must parse schemas from `packages/api_contracts/src/discipleship.ts`.

## Reading Plan Routes

Public/member read and progress side：

- `GET /v1/reading-plans`
- `GET /v1/reading-plans/:planId/days`
- `POST /v1/reading-plans/:planId/assignments`
- `GET /v1/me/reading-plans`
- `GET /v1/me/reading-plans/:assignmentId`
- `PATCH /v1/reading-plans/assignments/:assignmentId/status`
- `PATCH /v1/reading-plans/assignments/:assignmentId/days/:dayId`

Admin plan management：

- `GET /v1/admin/reading-plans`
- `POST /v1/admin/reading-plans`
- `PATCH /v1/admin/reading-plans/:planId`
- `GET /v1/admin/reading-plans/:planId/days`
- `POST /v1/admin/reading-plans/:planId/days`
- `GET /v1/admin/reading-plans/assignments`
- `POST /v1/admin/reading-plans/assignments`

Admin Web helper：

- `apps/admin_web/src/core/api/reading_plans.ts`

Mobile App repository and surface：

- `apps/mobile/lib/features/study/data/reading_plan_repository.dart`
- `apps/mobile/lib/features/study/presentation/widgets/reading_plan_section.dart`
- `apps/mobile/lib/features/mine/presentation/widgets/mine_reading_plan_card.dart`
- `apps/mobile/lib/features/mine/presentation/my_reading_plans_page.dart`

## Reading Plan Rules

- Plan days store scripture references only, never Bible text.
- Public plans may be read without login; guest progress must use `X-External-User-Id`.
- Member-only plans require member auth.
- Day progress updates must be idempotent per assignment and day.
- App clients must send member auth when available and `X-External-User-Id` for guest reading progress.
- App clients must jump to the local Bible reader for scripture references instead of requesting Bible text from the backend.
- Reading plan progress updates must not send `completedAt`; the backend sets
  and clears completion time from the submitted status.
- `GET /v1/me/reading-plans` accepts `scope=active|history|all`, `limit`, and an opaque `cursor`; clients preserve `nextCursor` for pagination.
- `GET /v1/me/reading-plans/:assignmentId` returns `canRestart`; clients show
  restart only when the backend confirms that the template is published and no
  open attempt already exists.
- Assignment history uses backend snapshots (`planTitle`, `planDurationDays`, `attemptNumber`) and backend-owned `endedAt`.
- Completed/abandoned assignments cannot be reopened. A restart uses the self-assignment endpoint and creates a new attempt.
- Admin clients must parse schemas from `packages/api_contracts/src/reading-plans.ts`.

## Sermon Discussion Guide Routes

Public/App side：

- `GET /v1/sermons/:sermonId/discussion-guide`
- `POST /v1/sermon-discussion-guides/:guideId/responses`

Admin content side：

- `GET /v1/admin/sermon-discussion-guides`
- `POST /v1/admin/sermon-discussion-guides`
- `PATCH /v1/admin/sermon-discussion-guides/:guideId`
- `GET /v1/admin/sermon-discussion-guides/:guideId/responses`
- `PATCH /v1/admin/sermon-discussion-guides/responses/:responseId/hide`

Mobile App repository and surface：

- `apps/mobile/lib/features/sermons/data/sermon_discussion_guide_repository.dart`
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_discussion_guide_section.dart`

Admin Web helper and surface：

- `apps/admin_web/src/core/api/sermon_discussion_guides.ts`
- `apps/admin_web/src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue`

## Sermon Discussion Guide Rules

- Guides link to a sermon by `sermonId`; they do not copy transcript, audio, or sermon source content.
- Published public guides require the sermon itself to be published.
- User responses default to `private`.
- App detail treats missing published guide as an empty optional section, not as a sermon detail failure.
- Response hide audit stores `hasContent`, not the raw response body.
- App and Admin clients must parse schemas from `packages/api_contracts/src/sermon-discussion-guides.ts`.

## Related Docs

- [../features/newcomer_followup.md](../features/newcomer_followup.md)
- [../features/discipleship_journey.md](../features/discipleship_journey.md)
- [../features/reading_plan.md](../features/reading_plan.md)
- [../features/sermon_discussion_guide.md](../features/sermon_discussion_guide.md)
