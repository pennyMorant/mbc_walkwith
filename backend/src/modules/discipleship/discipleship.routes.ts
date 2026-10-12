import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import type { DiscipleshipService } from "./discipleship.service.js";

export async function registerDiscipleshipRoutes(
  app: FastifyInstance,
  service: DiscipleshipService,
  memberAuthService: MemberAuthService
) {
  const memberPreHandler = requireMember(memberAuthService);

  app.get(
    "/v1/me/discipleship",
    { preHandler: memberPreHandler },
    async (request) => {
      return ok({
        items: await service.listMemberAssignments(request.member!.id)
      });
    }
  );
}
