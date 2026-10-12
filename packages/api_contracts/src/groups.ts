import { visibilityLevels } from "@mbc/shared-types";
import { z } from "zod";

export const ministryGroupStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "archived"
]);

export const groupApplicationStatusSchema = z.enum([
  "submitted",
  "approved",
  "declined",
  "withdrawn"
]);

export const groupMembershipStatusSchema = z.enum([
  "active",
  "inactive",
  "leader"
]);

export const groupMembershipSchema = z.object({
  groupId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  memberDisplayName: z.string().trim().min(1),
  memberEmail: z.string().email().nullable(),
  status: groupMembershipStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const groupMembershipListQuerySchema = z.object({
  status: groupMembershipStatusSchema.optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const groupMembershipUpdateRequestSchema = z.object({
  status: groupMembershipStatusSchema
});

export const groupMaterialTypeSchema = z.enum([
  "reading_plan",
  "sermon_discussion_guide",
  "course",
  "manual"
]);

export const groupTaskStatusSchema = z.enum([
  "assigned",
  "in_progress",
  "completed",
  "needs_follow_up"
]);

export const groupAttendanceStatusSchema = z.enum([
  "present",
  "absent",
  "excused"
]);

export const ministryGroupSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string(),
    meetingTime: z.string(),
    location: z.string(),
    leaderName: z.string(),
    visibility: z.enum(visibilityLevels),
    status: ministryGroupStatusSchema,
    capacity: z.number().int().positive().nullable(),
    memberCount: z.number().int().nonnegative(),
    myApplicationId: z.string().trim().min(1).nullable(),
    myApplicationStatus: groupApplicationStatusSchema.nullable(),
    myMembershipStatus: groupMembershipStatusSchema.nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .superRefine((group, context) => {
    if (group.capacity !== null && group.memberCount > group.capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberCount"],
        message: "memberCount must not exceed capacity."
      });
    }
    if (
      (group.myApplicationId === null) !==
      (group.myApplicationStatus === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["myApplicationId"],
        message:
          "myApplicationId and myApplicationStatus must be present together."
      });
    }
  });

export const ministryGroupUpsertRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  meetingTime: z.string().trim().max(200).default(""),
  location: z.string().trim().max(200).default(""),
  leaderName: z.string().trim().max(160).default(""),
  visibility: z.enum(visibilityLevels).default("members"),
  status: ministryGroupStatusSchema.default("draft"),
  capacity: z.number().int().positive().nullable().optional()
});

export const ministryGroupUpdateRequestSchema =
  ministryGroupUpsertRequestSchema.partial();

export const ministryGroupListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: ministryGroupStatusSchema.optional(),
  visibility: z.enum(visibilityLevels).optional(),
  query: z.string().trim().min(1).max(120).optional()
});

export const groupApplicationSchema = z.object({
  id: z.string().trim().min(1),
  groupId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  memberDisplayName: z.string().trim().min(1),
  memberEmail: z.string().email(),
  status: groupApplicationStatusSchema,
  note: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const groupApplicationRequestSchema = z.object({
  note: z.string().trim().max(500).optional()
});

export const groupApplicationReviewRequestSchema = z.object({
  status: z.enum(["approved", "declined"])
});

export const groupApplicationWithdrawalRequestSchema = z.object({
  status: z.literal("withdrawn")
});

export const groupMaterialAssignmentSchema = z.object({
  id: z.string().trim().min(1),
  groupId: z.string().trim().min(1),
  materialType: groupMaterialTypeSchema,
  materialId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  status: groupTaskStatusSchema,
  dueAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const groupMaterialAssignmentCreateRequestSchema = z.object({
  materialType: groupMaterialTypeSchema,
  materialId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(160),
  status: groupTaskStatusSchema.default("assigned"),
  dueAt: z.string().datetime().nullable().optional()
});

export const groupMaterialAssignmentUpdateRequestSchema =
  groupMaterialAssignmentCreateRequestSchema.partial().superRefine(
    (input, context) => {
      if (
        (input.materialType === undefined) !==
        (input.materialId === undefined)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            input.materialType === undefined ? "materialType" : "materialId"
          ],
          message: "materialType and materialId must be updated together."
        });
      }
    }
  );

export const groupMaterialAssignmentListQuerySchema = z.object({
  status: groupTaskStatusSchema.optional(),
  materialType: groupMaterialTypeSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const groupAttendanceRecordSchema = z.object({
  id: z.string().trim().min(1),
  groupId: z.string().trim().min(1),
  meetingDate: z.string().datetime(),
  memberUserId: z.string().trim().min(1),
  memberDisplayName: z.string().trim().min(1),
  status: groupAttendanceStatusSchema,
  note: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const groupAttendanceUpsertRequestSchema = z.object({
  meetingDate: z.string().datetime(),
  memberUserId: z.string().trim().min(1).max(160),
  status: groupAttendanceStatusSchema,
  note: z.string().trim().max(500).default("")
});

export const groupAttendanceListQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: groupAttendanceStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const groupApplicationListQuerySchema = z.object({
  status: groupApplicationStatusSchema.optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const ministryGroupListResponseSchema = z.object({
  items: z.array(ministryGroupSchema)
});

export const groupApplicationListResponseSchema = z.object({
  items: z.array(groupApplicationSchema)
});

export const groupMembershipListResponseSchema = z.object({
  items: z.array(groupMembershipSchema)
});

export const groupMaterialAssignmentListResponseSchema = z.object({
  items: z.array(groupMaterialAssignmentSchema)
});

export const groupAttendanceListResponseSchema = z.object({
  items: z.array(groupAttendanceRecordSchema)
});

export type MinistryGroupStatus = z.infer<typeof ministryGroupStatusSchema>;
export type GroupApplicationStatus = z.infer<
  typeof groupApplicationStatusSchema
>;
export type GroupMembershipStatus = z.infer<typeof groupMembershipStatusSchema>;
export type GroupMembership = z.infer<typeof groupMembershipSchema>;
export type GroupMembershipListQuery = z.infer<
  typeof groupMembershipListQuerySchema
>;
export type GroupMembershipUpdateRequest = z.infer<
  typeof groupMembershipUpdateRequestSchema
>;
export type GroupMaterialType = z.infer<typeof groupMaterialTypeSchema>;
export type GroupTaskStatus = z.infer<typeof groupTaskStatusSchema>;
export type GroupAttendanceStatus = z.infer<typeof groupAttendanceStatusSchema>;
export type MinistryGroup = z.infer<typeof ministryGroupSchema>;
export type MinistryGroupUpsertRequest = z.infer<
  typeof ministryGroupUpsertRequestSchema
>;
export type MinistryGroupUpdateRequest = z.infer<
  typeof ministryGroupUpdateRequestSchema
>;
export type MinistryGroupListQuery = z.infer<
  typeof ministryGroupListQuerySchema
>;
export type GroupApplication = z.infer<typeof groupApplicationSchema>;
export type GroupApplicationRequest = z.infer<
  typeof groupApplicationRequestSchema
>;
export type GroupApplicationReviewRequest = z.infer<
  typeof groupApplicationReviewRequestSchema
>;
export type GroupApplicationWithdrawalRequest = z.infer<
  typeof groupApplicationWithdrawalRequestSchema
>;
export type GroupMaterialAssignment = z.infer<
  typeof groupMaterialAssignmentSchema
>;
export type GroupMaterialAssignmentCreateRequest = z.infer<
  typeof groupMaterialAssignmentCreateRequestSchema
>;
export type GroupMaterialAssignmentUpdateRequest = z.infer<
  typeof groupMaterialAssignmentUpdateRequestSchema
>;
export type GroupMaterialAssignmentListQuery = z.infer<
  typeof groupMaterialAssignmentListQuerySchema
>;
export type GroupAttendanceRecord = z.infer<typeof groupAttendanceRecordSchema>;
export type GroupAttendanceUpsertRequest = z.infer<
  typeof groupAttendanceUpsertRequestSchema
>;
export type GroupAttendanceListQuery = z.infer<
  typeof groupAttendanceListQuerySchema
>;
export type GroupApplicationListQuery = z.infer<
  typeof groupApplicationListQuerySchema
>;
export type MinistryGroupListResponse = z.infer<
  typeof ministryGroupListResponseSchema
>;
export type GroupApplicationListResponse = z.infer<
  typeof groupApplicationListResponseSchema
>;
export type GroupMembershipListResponse = z.infer<
  typeof groupMembershipListResponseSchema
>;
export type GroupMaterialAssignmentListResponse = z.infer<
  typeof groupMaterialAssignmentListResponseSchema
>;
export type GroupAttendanceListResponse = z.infer<
  typeof groupAttendanceListResponseSchema
>;
