import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { MediaService } from "./media.service.js";

export async function registerMediaRoutes(
  app: FastifyInstance,
  service: MediaService
) {
  app.get("/v1/media/:mediaId/content", async (request, reply) => {
    const { mediaId } = mediaParamsSchema.parse(request.params);
    const result = await service.readPublic(mediaId);
    reply.header("Content-Type", result.asset.mimeType);
    reply.header("Content-Length", String(result.sizeBytes));
    reply.header("Cache-Control", "no-store");
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    return reply.send(result.stream);
  });
}

const mediaParamsSchema = z.object({ mediaId: z.string().uuid() });
