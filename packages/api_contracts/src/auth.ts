import { adminRoles, adminUserStatuses } from "@mbc/shared-types";
import { z } from "zod";
import { memberProfileSchema } from "./members.js";

export const adminRoleSchema = z.enum(adminRoles);
export const adminUserStatusSchema = z.enum(adminUserStatuses);

export const adminPermissionSchema = z.enum([
  "dashboard:read",
  "sermons:read",
  "sermons:create",
  "sermons:update",
  "sermons:publish",
  "sermon_guides:read",
  "sermon_guides:manage",
  "bible_knowledge:read",
  "bible_knowledge:update",
  "bible_notes:read",
  "bible_notes:moderate",
  "reading_plans:read",
  "reading_plans:manage",
  "life_posts:read",
  "life_posts:update",
  "life_posts:publish",
  "groups:read",
  "groups:manage",
  "courses:read",
  "courses:manage",
  "serving:read",
  "serving:manage",
  "newcomers:read",
  "newcomers:manage",
  "discipleship:read",
  "discipleship:manage",
  "care:read",
  "care:manage",
  "prayer:read",
  "prayer:moderate",
  "giving:read",
  "giving:manage",
  "giving:export",
  "users:read",
  "users:manage",
  "audit:read",
  "ai:use",
  "ai:read",
  "ai:manage",
  "ai:usage_export",
  "notifications:read",
  "notifications:manage",
  "jobs:read",
  "jobs:manage",
  "settings:read",
  "settings:update"
]);

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: adminRoleSchema,
  status: adminUserStatusSchema.default("active")
});

export const adminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const adminLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
  user: adminUserSchema,
  permissions: z.array(adminPermissionSchema).default([])
});

export const adminRefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1)
});

export const adminRefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
  user: adminUserSchema,
  permissions: z.array(adminPermissionSchema).default([])
});

export const adminLogoutRequestSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

export const adminCreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: adminRoleSchema,
  password: z.string().min(8)
});

export const adminUpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  role: adminRoleSchema.optional(),
  status: adminUserStatusSchema.optional()
});

export const adminResetPasswordRequestSchema = z.object({
  password: z.string().min(8)
});

export const adminChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const adminSessionSchema = z.object({
  user: adminUserSchema,
  permissions: z.array(adminPermissionSchema).default([])
});

export const memberRegistrationModeSchema = z.enum([
  "open",
  "closed",
  "admin_only"
]);

export const memberRegistrationSettingsSchema = z.object({
  mode: memberRegistrationModeSchema.default("open"),
  requireEmailVerification: z.boolean().default(true),
  requireAdminApproval: z.boolean().default(false),
  helpText: z.string().default("")
});

export const memberAuthRegisterRequestSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8)
});

export const memberAuthLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const memberFederatedAuthProviderSchema = z.enum(["google", "apple"]);

export const memberFirebaseAuthRequestSchema = z.object({
  idToken: z.string().trim().min(1)
});

export const memberPasswordResetRequestSchema = z.object({
  email: z.string().trim().email()
});

export const memberPasswordResetRequestResponseSchema = z.object({
  accepted: z.literal(true),
  challengeId: z.string(),
  delivery: z.literal("email"),
  maskedEmail: z.string(),
  expiresInSeconds: z.number().int().positive(),
  resendAfterSeconds: z.number().int().nonnegative(),
  devCode: z.string().nullable().optional()
});

export const memberPasswordResetConfirmRequestSchema = z.object({
  challengeId: z.string().trim().uuid(),
  code: z.string().trim().min(4).max(12),
  password: z.string().min(8)
});

export const memberPasswordResetConfirmResponseSchema = z.object({
  accepted: z.literal(true)
});

export const memberAuthRequestCodeResponseSchema = z.object({
  accepted: z.boolean(),
  challengeId: z.string(),
  delivery: z.literal("email"),
  maskedEmail: z.string(),
  expiresInSeconds: z.number().int().positive(),
  resendAfterSeconds: z.number().int().nonnegative(),
  devCode: z.string().nullable().optional()
});

export const memberAuthVerifyCodeRequestSchema = z.object({
  challengeId: z.string().trim().uuid(),
  code: z.string().trim().min(4).max(12),
  displayName: z.string().trim().min(1).max(120).optional()
});

export const memberAuthSessionSchema = z.object({
  accessToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
  member: memberProfileSchema
});

export const memberAuthLoginResponseSchema = memberAuthSessionSchema;

export const memberAuthPendingApprovalResponseSchema = z.object({
  status: z.literal("pending_approval"),
  member: memberProfileSchema,
  registrationSettings: memberRegistrationSettingsSchema
});

export const memberAuthVerifyCodeResponseSchema = z.union([
  memberAuthSessionSchema,
  memberAuthPendingApprovalResponseSchema
]);

export const memberAuthRegisterResponseSchema = z.discriminatedUnion(
  "status",
  [
    z.object({
      status: z.literal("signed_in"),
      session: memberAuthSessionSchema,
      registrationSettings: memberRegistrationSettingsSchema
    }),
    z.object({
      status: z.literal("pending_email_verification"),
      codeRequest: memberAuthRequestCodeResponseSchema,
      registrationSettings: memberRegistrationSettingsSchema
    }),
    memberAuthPendingApprovalResponseSchema
  ]
);

export const memberFirebaseAuthResponseSchema = z.discriminatedUnion(
  "status",
  [
    z.object({
      status: z.literal("signed_in"),
      session: memberAuthSessionSchema,
      provider: memberFederatedAuthProviderSchema,
      registrationSettings: memberRegistrationSettingsSchema
    }),
    memberAuthPendingApprovalResponseSchema.extend({
      provider: memberFederatedAuthProviderSchema
    })
  ]
);

export const memberAuthMeResponseSchema = z.object({
  member: memberProfileSchema
});

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;
export type AdminPermission = z.infer<typeof adminPermissionSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;
export type AdminRefreshTokenRequest = z.infer<
  typeof adminRefreshTokenRequestSchema
>;
export type AdminRefreshTokenResponse = z.infer<
  typeof adminRefreshTokenResponseSchema
>;
export type AdminLogoutRequest = z.infer<typeof adminLogoutRequestSchema>;
export type AdminCreateUserRequest = z.infer<
  typeof adminCreateUserRequestSchema
>;
export type AdminUpdateUserRequest = z.infer<
  typeof adminUpdateUserRequestSchema
>;
export type AdminResetPasswordRequest = z.infer<
  typeof adminResetPasswordRequestSchema
>;
export type AdminChangePasswordRequest = z.infer<
  typeof adminChangePasswordRequestSchema
>;
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type MemberAuthRequestCodeResponse = z.infer<
  typeof memberAuthRequestCodeResponseSchema
>;
export type MemberRegistrationMode = z.infer<
  typeof memberRegistrationModeSchema
>;
export type MemberRegistrationSettings = z.infer<
  typeof memberRegistrationSettingsSchema
>;
export type MemberAuthRegisterRequest = z.infer<
  typeof memberAuthRegisterRequestSchema
>;
export type MemberAuthLoginRequest = z.infer<
  typeof memberAuthLoginRequestSchema
>;
export type MemberFederatedAuthProvider = z.infer<
  typeof memberFederatedAuthProviderSchema
>;
export type MemberFirebaseAuthRequest = z.infer<
  typeof memberFirebaseAuthRequestSchema
>;
export type MemberFirebaseAuthResponse = z.infer<
  typeof memberFirebaseAuthResponseSchema
>;
export type MemberPasswordResetRequest = z.infer<
  typeof memberPasswordResetRequestSchema
>;
export type MemberPasswordResetRequestResponse = z.infer<
  typeof memberPasswordResetRequestResponseSchema
>;
export type MemberPasswordResetConfirmRequest = z.infer<
  typeof memberPasswordResetConfirmRequestSchema
>;
export type MemberPasswordResetConfirmResponse = z.infer<
  typeof memberPasswordResetConfirmResponseSchema
>;
export type MemberAuthLoginResponse = z.infer<
  typeof memberAuthLoginResponseSchema
>;
export type MemberAuthRegisterResponse = z.infer<
  typeof memberAuthRegisterResponseSchema
>;
export type MemberAuthVerifyCodeRequest = z.infer<
  typeof memberAuthVerifyCodeRequestSchema
>;
export type MemberAuthPendingApprovalResponse = z.infer<
  typeof memberAuthPendingApprovalResponseSchema
>;
export type MemberAuthVerifyCodeResponse = z.infer<
  typeof memberAuthVerifyCodeResponseSchema
>;
export type MemberAuthSession = z.infer<typeof memberAuthSessionSchema>;
export type MemberAuthMeResponse = z.infer<typeof memberAuthMeResponseSchema>;
