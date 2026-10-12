import {
  adminNotificationDeliveryListQuerySchema,
  adminNotificationRetryDueRequestSchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { listMeta, ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { NotificationDeliveryRepository } from "../../notifications/notification-delivery.repository.js";
import type { NotificationService } from "../../notifications/notification.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminNotificationRoutes(
  app: FastifyInstance,
  deliveryRepository: NotificationDeliveryRepository,
  notificationService: NotificationService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/notifications/deliveries",
    { preHandler: permissionPreHandler("notifications:read") },
    async (request) => {
      const query = adminNotificationDeliveryListQuerySchema.parse(
        request.query
      );
      const result = await deliveryRepository.listTasks({
        limit: query.limit,
        ...(query.status ? { status: query.status } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.cursor ? { cursor: query.cursor } : {})
      });
      return ok(
        { items: result.tasks, nextCursor: result.nextCursor },
        listMeta(query.limit, result.nextCursor)
      );
    }
  );

  app.post(
    "/v1/admin/notifications/deliveries/retry-due",
    { preHandler: permissionPreHandler("notifications:manage") },
    async (request) => {
      const body = adminNotificationRetryDueRequestSchema.parse(
        request.body ?? {}
      );
      const results = await notificationService.retryDueDeliveries(body.limit);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "notification.delivery.retry_due",
        resourceType: "notification_delivery_task",
        resourceId: "due",
        afterJson: {
          requestedLimit: body.limit,
          processed: results.length,
          attempted: results.reduce((sum, result) => sum + result.attempted, 0),
          sent: results.reduce((sum, result) => sum + result.sent, 0),
          failed: results.reduce((sum, result) => sum + result.failed, 0),
          revokedTokens: results.reduce(
            (sum, result) => sum + result.revokedTokens,
            0
          )
        }
      });
      return ok({
        processed: results.length,
        results
      });
    }
  );

  app.post(
    "/v1/admin/notifications/deliveries/:taskId/retry",
    { preHandler: permissionPreHandler("notifications:manage") },
    async (request) => {
      const params = notificationDeliveryParamsSchema.parse(request.params);
      const result = await notificationService.retryDelivery(params.taskId);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "notification.delivery.retry_one",
        resourceType: "notification_delivery_task",
        resourceId: params.taskId,
        afterJson: result
      });
      return ok({ result });
    }
  );

  app.post(
    "/v1/admin/notifications/deliveries/:taskId/cancel",
    { preHandler: permissionPreHandler("notifications:manage") },
    async (request) => {
      const params = notificationDeliveryParamsSchema.parse(request.params);
      const task = await notificationService.cancelDelivery(params.taskId);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "notification.delivery.cancel",
        resourceType: "notification_delivery_task",
        resourceId: params.taskId,
        afterJson: {
          status: task.status,
          type: task.type,
          audience: task.audience,
          preferenceKey: task.preferenceKey,
          attempts: task.attempts
        }
      });
      return ok({ task });
    }
  );
}

const notificationDeliveryParamsSchema = z.object({
  taskId: z.string().trim().min(1)
});
