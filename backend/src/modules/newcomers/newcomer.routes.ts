import {
  newcomerCreateRequestSchema,
  type NewcomerProfile
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import { externalUserIdFromRequest } from "../../shared/http/external-user-id.js";
import type { AuditService } from "../audit/audit.service.js";
import { newcomerExternalIdentityConflict } from "./newcomer-errors.js";
import {
  toNewcomerSubmission,
  type NewcomerService
} from "./newcomer.service.js";

export async function registerNewcomerRoutes(
  app: FastifyInstance,
  service: NewcomerService,
  auditService: AuditService
) {
  app.post("/v1/newcomers", async (request) => {
    const input = (request.body ?? {}) as Record<string, unknown>;
    const headerExternalUserId = externalUserIdFromRequest(request);
    const bodyExternalUserId = stringValue(input.externalUserId);
    if (
      headerExternalUserId &&
      bodyExternalUserId &&
      headerExternalUserId !== bodyExternalUserId
    ) {
      throw newcomerExternalIdentityConflict();
    }
    const body = newcomerCreateRequestSchema.parse({
      ...input,
      ...(headerExternalUserId
        ? { externalUserId: headerExternalUserId }
        : {})
    });
    const newcomer = await service.create(body);
    await auditService.record({
      actorUserId: null,
      action: "newcomer.submit",
      resourceType: "newcomer",
      resourceId: newcomer.id,
      afterJson: newcomerAuditSnapshot(newcomer)
    });
    return ok(toNewcomerSubmission(newcomer));
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export function newcomerAuditSnapshot(newcomer: NewcomerProfile) {
  return {
    id: newcomer.id,
    status: newcomer.status,
    source: newcomer.source,
    assigneeAdminUserId: newcomer.assigneeAdminUserId,
    conversionStatus: newcomer.conversionStatus,
    hasExternalUserId: Boolean(newcomer.externalUserId),
    hasLinkedMemberUserId: Boolean(newcomer.linkedMemberUserId),
    hasEmail: Boolean(newcomer.email),
    hasPhone: Boolean(newcomer.phone),
    hasInterest: newcomer.interest.trim().length > 0
  };
}
