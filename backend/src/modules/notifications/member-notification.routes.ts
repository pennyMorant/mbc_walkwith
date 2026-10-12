import {
  memberNotificationListQuerySchema,
  memberNotificationSettingsUpdateRequestSchema,
  revokeGuestPushDeviceRequestSchema,
  revokeMemberPushDeviceRequestSchema,
  upsertGuestPushDeviceRequestSchema,
  upsertMemberPushDeviceRequestSchema
} from "@mbc/api-contracts";
import type { MemberNotificationItem } from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import { notificationItemNotFound } from "./notification-errors.js";
import type { MemberNotificationItem as StoredMemberNotificationItem } from "./notification-inbox.repository.js";
import type { NotificationInboxService } from "./notification-inbox.service.js";
import type { NotificationService } from "./notification.service.js";

export async function registerMemberNotificationRoutes(
  app: FastifyInstance,
  notificationService: NotificationService,
  notificationInboxService: NotificationInboxService,
  memberAuthService: MemberAuthService
) {
  const memberPreHandler = requireMember(memberAuthService);

  app.put("/v1/app/devices/push-token", async (request) => {
    const body = upsertGuestPushDeviceRequestSchema.parse(request.body);
    const device = await notificationService.upsertGuestDevice(body);
    return ok({
      accepted: true,
      device
    });
  });

  app.post("/v1/app/devices/push-token/revoke", async (request) => {
    const body = revokeGuestPushDeviceRequestSchema.parse(request.body);
    const accepted = await notificationService.revokeGuestDevice(
      body.installationId
    );
    return ok({ accepted });
  });

  app.get(
    "/v1/member/notifications",
    { preHandler: memberPreHandler },
    async (request) => {
      const query = memberNotificationListQuerySchema.parse(request.query);
      const result = await notificationInboxService.listForMember(
        request.member!.id,
        query.limit
      );
      return ok({
        items: result.items.map(memberNotificationItemResponse),
        unreadCount: result.unreadCount
      });
    }
  );

  app.patch(
    "/v1/member/notifications/:notificationId/read",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = notificationParamsSchema.parse(request.params);
      const item = await notificationInboxService.markRead(
        request.member!.id,
        params.notificationId
      );
      if (!item) {
        throw notificationItemNotFound(params.notificationId);
      }
      return ok({ item: memberNotificationItemResponse(item) });
    }
  );

  app.patch(
    "/v1/member/notifications/read-all",
    { preHandler: memberPreHandler },
    async (request) => {
      const updatedCount = await notificationInboxService.markAllRead(
        request.member!.id
      );
      return ok({ updatedCount });
    }
  );

  app.patch(
    "/v1/member/notifications/archive-all",
    { preHandler: memberPreHandler },
    async (request) => {
      const updatedCount = await notificationInboxService.archiveAll(
        request.member!.id
      );
      return ok({ updatedCount });
    }
  );

  app.patch(
    "/v1/member/notifications/:notificationId/archive",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = notificationParamsSchema.parse(request.params);
      const item = await notificationInboxService.archive(
        request.member!.id,
        params.notificationId
      );
      if (!item) {
        throw notificationItemNotFound(params.notificationId);
      }
      return ok({ item: memberNotificationItemResponse(item) });
    }
  );

  app.patch(
    "/v1/member/preferences/notifications",
    { preHandler: memberPreHandler },
    async (request, reply) => {
      const body = memberNotificationSettingsUpdateRequestSchema.parse(
        request.body
      );
      const member = await notificationService.updateMemberNotificationSettings(
        request.member!.id,
        body
      );
      return ok({ member });
    }
  );

  app.put(
    "/v1/member/devices/push-token",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = upsertMemberPushDeviceRequestSchema.parse(request.body);
      const device = await notificationService.upsertMemberDevice(
        request.member!.id,
        body
      );
      return ok({
        accepted: true,
        device
      });
    }
  );

  app.post(
    "/v1/member/devices/push-token/revoke",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = revokeMemberPushDeviceRequestSchema.parse(request.body);
      const accepted = await notificationService.revokeMemberDevice(
        request.member!.id,
        body.installationId
      );
      return ok({ accepted });
    }
  );
}

const notificationParamsSchema = z.object({
  notificationId: z.string().trim().min(1)
});

function memberNotificationItemResponse(
  item: StoredMemberNotificationItem
): MemberNotificationItem {
  return {
    id: item.id,
    messageId: item.messageId,
    type: item.type,
    title: item.title,
    body: item.body,
    route: item.route,
    data: item.data,
    readAt: item.readAt,
    archivedAt: item.archivedAt,
    createdAt: item.createdAt
  };
}
