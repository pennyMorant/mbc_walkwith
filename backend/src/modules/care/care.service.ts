import type {
  AdminRole,
  AdminUser,
  CareFollowUpCreateRequest,
  CareRequestAdmin,
  CareRequestCreateRequest,
  CareRequestListQuery,
  CareRequestUpdateRequest,
  MemberCareRequestListQuery
} from "@mbc/api-contracts";

import {
  careAssigneeInvalid,
  carePrivacyDenied,
  careRequestNotFound,
  careRequestStateConflict
} from "./care_errors.js";
import type { CareRepository } from "./care.repository.js";
import { shouldAdvanceCareRequestForFollowUp } from "./care_status_rules.js";

export class CareService {
  constructor(
    private readonly repository: CareRepository,
    private readonly adminDirectory: CareAdminDirectory
  ) {}

  async listAssignees() {
    const users = await this.adminDirectory.listActiveUsersWithPermission(
      "care:manage"
    );
    return users.map(({ id, name }) => ({ id, name }));
  }

  async listForAdmin(query: CareRequestListQuery, actor: CareAdminActor) {
    const requests = canViewAllCareRequests(actor)
      ? await this.repository.list(query)
      : await this.repository.list({
          ...query,
          limit: maxCareRequestListLimit
        });
    return requests
      .filter((request) => canAccessCareRequest(actor, request))
      .slice(0, query.limit);
  }

  listForUser(userId: string, query: MemberCareRequestListQuery) {
    return this.repository.listForUser(userId, query);
  }

  async createForMember(
    user: { id: string; displayName: string; email: string },
    input: CareRequestCreateRequest
  ) {
    return this.repository.create({
      ...input,
      userId: user.id,
      memberDisplayName: user.displayName,
      memberEmail: user.email
    });
  }

  async getForMember(id: string, userId: string) {
    const request = await this.repository.getById(id);
    if (!request) {
      throw careRequestNotFound(id);
    }
    if (request.userId !== userId) {
      throw carePrivacyDenied(id);
    }
    return toSummary(request);
  }

  async updateForAdmin(
    id: string,
    input: CareRequestUpdateRequest,
    actor: CareAdminActor
  ) {
    const existing = await this.requireRequest(id);
    assertAdminCanAccessCareRequest(actor, existing);
    if (
      input.privacyLevel === "admin_restricted" &&
      !canUseAdminRestrictedCare(actor)
    ) {
      throw carePrivacyDenied(id);
    }
    const normalizedInput = await this.normalizeAdminUpdate(input, existing);
    const request = await this.repository.update(
      id,
      normalizedInput,
      existing.version
    );
    if (!request) {
      return this.throwWriteConflict(id, actor);
    }
    assertAdminCanAccessCareRequest(actor, request);
    return { before: existing, after: request };
  }

  async listFollowUpsForAdmin(
    careRequestId: string,
    actor: CareAdminActor
  ) {
    const request = await this.requireRequest(careRequestId);
    assertAdminCanAccessCareRequest(actor, request);
    return this.repository.listFollowUps(careRequestId);
  }

  async createFollowUpForAdmin(
    careRequestId: string,
    actor: CareAdminActor,
    input: CareFollowUpCreateRequest
  ) {
    const request = await this.requireRequest(careRequestId);
    assertAdminCanAccessCareRequest(actor, request);
    const shouldAdvance = shouldAdvanceCareRequestForFollowUp(
      input.status,
      request.status
    );
    const followUp = await this.repository.createFollowUp(
      {
        ...input,
        careRequestId,
        authorAdminUserId: actor.id,
        authorName: actor.name
      },
      request.version,
      shouldAdvance
        ? {
            expectedStatus: request.status,
            nextStatus: "in_progress"
          }
        : undefined
    );
    if (!followUp) {
      return this.throwWriteConflict(careRequestId, actor);
    }
    const current = await this.requireRequest(careRequestId);
    return { followUp, before: request, after: current };
  }

  private async requireRequest(careRequestId: string) {
    const request = await this.repository.getById(careRequestId);
    if (!request) {
      throw careRequestNotFound(careRequestId);
    }
    return request;
  }

  private async throwWriteConflict(
    careRequestId: string,
    actor: CareAdminActor
  ): Promise<never> {
    const current = await this.repository.getById(careRequestId);
    if (!current) {
      throw careRequestNotFound(careRequestId);
    }
    assertAdminCanAccessCareRequest(actor, current);
    throw careRequestStateConflict(current);
  }

  private async normalizeAdminUpdate(
    input: CareRequestUpdateRequest,
    existing: CareRequestAdmin
  ) {
    if (input.assigneeAdminUserId === undefined) {
      return input;
    }
    if (input.assigneeAdminUserId === null) {
      return { ...input, assigneeName: "" };
    }
    if (input.assigneeAdminUserId === existing.assigneeAdminUserId) {
      return { ...input, assigneeName: existing.assigneeName };
    }
    const assignee = await this.adminDirectory.findActiveUserWithPermission(
      input.assigneeAdminUserId,
      "care:manage"
    );
    if (!assignee) {
      throw careAssigneeInvalid(input.assigneeAdminUserId);
    }
    return { ...input, assigneeName: assignee.name };
  }
}

function toSummary(request: Awaited<ReturnType<CareRepository["getById"]>>) {
  if (!request) {
    throw new Error("Care request is required.");
  }
  return {
    id: request.id,
    userId: request.userId,
    memberDisplayName: request.memberDisplayName,
    memberEmail: request.memberEmail,
    title: request.title,
    body: request.body,
    status: request.status,
    privacyLevel: request.privacyLevel,
    assigneeName: request.assigneeName,
    nextFollowUpAt: request.nextFollowUpAt,
    version: request.version,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

type CareAdminActor = Pick<AdminUser, "id" | "name" | "role">;

type CareAdminDirectory = {
  listActiveUsersWithPermission(
    permission: "care:manage"
  ): Promise<AdminUser[]>;
  findActiveUserWithPermission(
    adminUserId: string,
    permission: "care:manage"
  ): Promise<AdminUser | null>;
};

const maxCareRequestListLimit = 500;

const pastoralCareRoles = new Set<AdminRole>(["owner", "admin", "pastor"]);
const adminRestrictedCareRoles = new Set<AdminRole>(["owner", "admin"]);

function assertAdminCanAccessCareRequest(
  actor: CareAdminActor,
  request: CareRequestAdmin
) {
  if (!canAccessCareRequest(actor, request)) {
    throw carePrivacyDenied(request.id);
  }
}

function canAccessCareRequest(
  actor: CareAdminActor,
  request: CareRequestAdmin
) {
  if (request.privacyLevel === "admin_restricted") {
    return canUseAdminRestrictedCare(actor);
  }
  if (request.privacyLevel === "assigned_team") {
    return (
      pastoralCareRoles.has(actor.role) ||
      request.assigneeAdminUserId === actor.id
    );
  }
  return pastoralCareRoles.has(actor.role);
}

function canViewAllCareRequests(actor: CareAdminActor) {
  return canUseAdminRestrictedCare(actor);
}

function canUseAdminRestrictedCare(actor: CareAdminActor) {
  return adminRestrictedCareRoles.has(actor.role);
}
