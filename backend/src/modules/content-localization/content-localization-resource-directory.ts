import type { LocalizedResourceType } from "@mbc/api-contracts";

import type { ContentLocalizationResourceDirectory } from "./content-localization.service.js";
import type { LifePostService } from "../life/life-post.service.js";
import type { SermonService } from "../sermons/sermon.service.js";
import type { SermonDiscussionGuideService } from "../sermon-discussion-guides/sermon-discussion-guide.service.js";

const lifeFields = ["title", "body", "meta", "ctaLabel"] as const;
const sermonFields = ["title", "summary", "transcriptText"] as const;

export class ApplicationContentLocalizationResourceDirectory implements ContentLocalizationResourceDirectory {
  private discussionGuides: SermonDiscussionGuideService | null = null;

  constructor(private readonly lifePosts: LifePostService, private readonly sermons: SermonService) {}

  setDiscussionGuides(service: SermonDiscussionGuideService) {
    this.discussionGuides = service;
  }

  async get(resourceType: LocalizedResourceType, resourceId: string) {
    if (resourceType === "life_post") {
      const post = await this.lifePosts.getById(resourceId);
      return post ? { version: post.revision, allowedFields: lifeFields, sourceFields: { title: post.title, body: post.body, meta: post.meta, ...(post.ctaLabel ? { ctaLabel: post.ctaLabel } : {}) } } : null;
    }
    if (resourceType === "sermon") {
      const sermon = await this.sermons.getById(resourceId);
      return sermon
        ? {
            version: sermon.revision,
            allowedFields: sermonFields,
            sourceFields: {
              title: sermon.title,
              ...(sermon.summary ? { summary: sermon.summary } : {}),
              ...(sermon.transcript?.text
                ? { transcriptText: sermon.transcript.text }
                : {})
            }
          }
        : null;
    }
    if (resourceType === "sermon_discussion_guide") {
      const guide = await this.discussionGuides?.getGuideById(resourceId);
      return guide
        ? {
            version: guide.revision,
            allowedFields: ["title", "summary"] as const,
            sourceFields: { title: guide.title, ...(guide.summary ? { summary: guide.summary } : {}) }
          }
        : null;
    }
    return null;
  }
}
