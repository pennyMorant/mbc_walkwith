import type { MediaAssetUsage } from "@mbc/api-contracts";

import type { MediaUsageProvider } from "../media/media_usage.service.js";
import type { LifePostRepository } from "./life-post.repository.js";

export class LifePostMediaUsageProvider implements MediaUsageProvider {
  constructor(private readonly repository: LifePostRepository) {}

  async listUsages(mediaId: string): Promise<MediaAssetUsage[]> {
    const posts = await this.repository.listByImageMediaId(mediaId);
    return posts.map((post) => ({
      source: "life_post",
      sourceId: post.id,
      sourceLabel: post.title,
      slot: "life_post_image"
    }));
  }
}
