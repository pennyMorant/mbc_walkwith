import { bibleKnowledgeListQuerySchema } from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { BibleKnowledgeService } from "./bible-knowledge.service.js";

export async function registerBibleKnowledgeRoutes(
  app: FastifyInstance,
  service: BibleKnowledgeService
) {
  app.get("/v1/bible-knowledge", async (request) => {
    const query = bibleKnowledgeListQuerySchema.parse(request.query);
    return ok({
      items: await service.list({
        ...query,
        status: "published"
      })
    });
  });
}
