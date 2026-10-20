import type {
  AdminRole,
  AdminSearchResponse
} from "@mbc/api-contracts";

import type { LifePostService } from "../../life/life-post.service.js";
import type { MemberService } from "../../members/member.service.js";
import type { SermonService } from "../../sermons/sermon.service.js";
import { roleHasPermission } from "../auth/admin-rbac.js";

type AdminSearchDependencies = {
  sermons: Pick<SermonService, "searchSummaries">;
  lifePosts: Pick<LifePostService, "searchSummaries">;
  members: Pick<MemberService, "list">;
};

export class AdminSearchService {
  constructor(private readonly dependencies: AdminSearchDependencies) {}

  async search(role: AdminRole, query: string): Promise<AdminSearchResponse> {
    const [sermons, lifePosts, members] = await Promise.all([
      roleHasPermission(role, "sermons:read")
        ? this.dependencies.sermons.searchSummaries(query, 5)
        : Promise.resolve([]),
      roleHasPermission(role, "life_posts:read")
        ? this.dependencies.lifePosts.searchSummaries(query, 5)
        : Promise.resolve([]),
      roleHasPermission(role, "users:read")
        ? this.dependencies.members.list({ query, limit: 5 })
        : Promise.resolve([])
    ]);

    return {
      items: [
        ...sermons.map((sermon) => ({
          id: sermon.id,
          resourceType: "sermon" as const,
          title: sermon.title,
          subtitle: sermon.speaker,
          path: resourcePath("/sermons", sermon.id)
        })),
        ...lifePosts.map((post) => ({
          id: post.id,
          resourceType: "life_post" as const,
          title: post.title,
          subtitle: post.type,
          path: resourcePath("/life-posts", post.id)
        })),
        ...members.map((member) => ({
          id: member.id,
          resourceType: "member" as const,
          title: member.displayName,
          subtitle: member.email,
          path: resourcePath("/members", member.id)
        }))
      ].slice(0, 15)
    };
  }
}

function resourcePath(basePath: string, resourceId: string) {
  return `${basePath}?open=${encodeURIComponent(resourceId)}`;
}
