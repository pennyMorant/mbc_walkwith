import { z } from "zod";

import { memberListItemSchema } from "./members.js";

export const servingStatusSchema = z.enum(["active", "paused", "archived"]);

export const servingAssignmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "declined",
  "swap_requested",
  "covered",
  "cancelled"
]);

export const servingAvailabilityStatusSchema = z.enum([
  "available",
  "unavailable",
  "preferred"
]);

export const servingCheckInStatusSchema = z.enum([
  "pending",
  "checked_in",
  "missed"
]);

export const servingTeamSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  status: servingStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const servingRoleSchema = z.object({
  id: z.string().trim().min(1),
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  status: servingStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const servingAssignmentSchema = z
  .object({
    id: z.string().trim().min(1),
    teamId: z.string().trim().min(1),
    teamName: z.string().trim().min(1),
    roleId: z.string().trim().min(1),
    roleName: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    memberDisplayName: z.string().trim().min(1),
    memberEmail: z.string().email(),
    title: z.string().trim().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable(),
    location: z.string(),
    status: servingAssignmentStatusSchema,
    note: z.string(),
    responseNote: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .superRefine((assignment, context) => {
    if (
      assignment.endsAt !== null &&
      new Date(assignment.endsAt).getTime() <=
        new Date(assignment.startsAt).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "endsAt must be later than startsAt."
      });
    }
  });

export const servingAvailabilityRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    status: servingAvailabilityStatusSchema,
    note: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .superRefine((record, context) => {
    if (
      new Date(record.endsAt).getTime() <= new Date(record.startsAt).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "endsAt must be later than startsAt."
      });
    }
  });

export const servingCheckInRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    assignmentId: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    status: servingCheckInStatusSchema,
    checkedInAt: z.string().datetime().nullable(),
    note: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .superRefine((record, context) => {
    if ((record.status === "checked_in") !== (record.checkedInAt !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkedInAt"],
        message: "checkedInAt must only be present for checked_in status."
      });
    }
  });

export const servingMemberOptionSchema = memberListItemSchema.pick({
  id: true,
  displayName: true,
  email: true,
  status: true
});

export const servingTeamUpsertRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(""),
  status: servingStatusSchema.default("active")
});

export const servingTeamUpdateRequestSchema =
  servingTeamUpsertRequestSchema.partial();

export const servingRoleUpsertRequestSchema = z.object({
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(""),
  status: servingStatusSchema.default("active")
});

export const servingRoleUpdateRequestSchema =
  servingRoleUpsertRequestSchema.partial();

export const servingAssignmentUpsertRequestSchema = z.object({
  teamId: z.string().trim().min(1),
  roleId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  memberDisplayName: z.string().trim().min(1).max(160),
  memberEmail: z.string().trim().email(),
  title: z.string().trim().min(1).max(180),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  location: z.string().trim().max(200).default(""),
  status: servingAssignmentStatusSchema.default("scheduled"),
  note: z.string().trim().max(1000).default("")
});

export const servingAssignmentUpdateRequestSchema =
  servingAssignmentUpsertRequestSchema.partial().extend({
    responseNote: z.string().trim().max(1000).optional()
  });

export const servingAdminAssignmentCreateRequestSchema =
  servingAssignmentUpsertRequestSchema.omit({
    memberDisplayName: true,
    memberEmail: true
  });

export const servingAdminAssignmentUpdateRequestSchema =
  servingAdminAssignmentCreateRequestSchema.partial().extend({
    responseNote: z.string().trim().max(1000).optional()
  });

export const servingAssignmentActionRequestSchema = z.object({
  note: z.string().trim().max(500).optional()
});

export const servingAvailabilityUpsertRequestSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: servingAvailabilityStatusSchema,
  note: z.string().trim().max(500).default("")
});

export const servingAdminAvailabilityCreateRequestSchema =
  servingAvailabilityUpsertRequestSchema.extend({
    userId: z.string().trim().min(1)
  });

export const servingCheckInUpsertRequestSchema = z.object({
  status: servingCheckInStatusSchema.default("checked_in"),
  checkedInAt: z.string().datetime().nullable().optional(),
  note: z.string().trim().max(500).default("")
});

export const servingListQuerySchema = z.object({
  status: servingStatusSchema.optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(100)
});

export const servingAssignmentListQuerySchema = z.object({
  status: servingAssignmentStatusSchema.optional(),
  userId: z.string().trim().min(1).optional(),
  query: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const servingAvailabilityListQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  status: servingAvailabilityStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const servingCheckInListQuerySchema = z.object({
  assignmentId: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1).optional(),
  status: servingCheckInStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const servingTeamListResponseSchema = z.object({
  items: z.array(servingTeamSchema)
});

export const servingRoleListResponseSchema = z.object({
  items: z.array(servingRoleSchema)
});

export const servingAssignmentListResponseSchema = z.object({
  items: z.array(servingAssignmentSchema)
});

export const servingAvailabilityListResponseSchema = z.object({
  items: z.array(servingAvailabilityRecordSchema)
});

export const servingCheckInListResponseSchema = z.object({
  items: z.array(servingCheckInRecordSchema)
});

export const servingMemberListResponseSchema = z.object({
  items: z.array(servingMemberOptionSchema)
});

export type ServingStatus = z.infer<typeof servingStatusSchema>;
export type ServingAssignmentStatus = z.infer<
  typeof servingAssignmentStatusSchema
>;
export type ServingAvailabilityStatus = z.infer<
  typeof servingAvailabilityStatusSchema
>;
export type ServingCheckInStatus = z.infer<typeof servingCheckInStatusSchema>;
export type ServingTeam = z.infer<typeof servingTeamSchema>;
export type ServingRole = z.infer<typeof servingRoleSchema>;
export type ServingAssignment = z.infer<typeof servingAssignmentSchema>;
export type ServingAvailabilityRecord = z.infer<
  typeof servingAvailabilityRecordSchema
>;
export type ServingCheckInRecord = z.infer<typeof servingCheckInRecordSchema>;
export type ServingMemberOption = z.infer<typeof servingMemberOptionSchema>;
export type ServingTeamUpsertRequest = z.infer<
  typeof servingTeamUpsertRequestSchema
>;
export type ServingTeamUpdateRequest = z.infer<
  typeof servingTeamUpdateRequestSchema
>;
export type ServingRoleUpsertRequest = z.infer<
  typeof servingRoleUpsertRequestSchema
>;
export type ServingRoleUpdateRequest = z.infer<
  typeof servingRoleUpdateRequestSchema
>;
export type ServingAssignmentUpsertRequest = z.infer<
  typeof servingAssignmentUpsertRequestSchema
>;
export type ServingAssignmentUpdateRequest = z.infer<
  typeof servingAssignmentUpdateRequestSchema
>;
export type ServingAdminAssignmentCreateRequest = z.infer<
  typeof servingAdminAssignmentCreateRequestSchema
>;
export type ServingAdminAssignmentUpdateRequest = z.infer<
  typeof servingAdminAssignmentUpdateRequestSchema
>;
export type ServingAssignmentActionRequest = z.infer<
  typeof servingAssignmentActionRequestSchema
>;
export type ServingAvailabilityUpsertRequest = z.infer<
  typeof servingAvailabilityUpsertRequestSchema
>;
export type ServingAdminAvailabilityCreateRequest = z.infer<
  typeof servingAdminAvailabilityCreateRequestSchema
>;
export type ServingCheckInUpsertRequest = z.infer<
  typeof servingCheckInUpsertRequestSchema
>;
export type ServingListQuery = z.infer<typeof servingListQuerySchema>;
export type ServingAssignmentListQuery = z.infer<
  typeof servingAssignmentListQuerySchema
>;
export type ServingAvailabilityListQuery = z.infer<
  typeof servingAvailabilityListQuerySchema
>;
export type ServingCheckInListQuery = z.infer<
  typeof servingCheckInListQuerySchema
>;
