import type {
  AdminRole,
  AdminSearchResponse
} from "@mbc/api-contracts";

import type { LifePostService } from "../../life/life-post.service.js";
import type { MemberService } from "../../members/member.service.js";
import type { SermonService } from "../../sermons/sermon.service.js";
import { roleHasPermission } from "../auth/admin-rbac.js";

type AdminSearchDependencies = {
  sermons: Pick<SermonService, "list">;
  lifePosts: Pick<LifePostService, "list">;
  members: Pick<MemberService, "list">;
};

export class AdminSearchService {
  constructor(private readonly dependencies: AdminSearchDependencies) {}

  async search(role: AdminRole, query: string): Promise<AdminSearchResponse> {
    const [sermons, lifePosts, members] = await Promise.all([
      roleHasPermission(role, "sermons:read")
        ? this.dependencies.sermons.list({ query, limit: 5 })
        : Promise.resolve({ sermons: [], nextCursor: null }),
      roleHasPermission(role, "life_posts:read")
        ? this.dependencies.lifePosts.list({ query, limit: 5, offset: 0 })
        : Promise.resolve([]),
      roleHasPermission(role, "users:read")
        ? this.dependencies.members.list({ query, limit: 5 })
        : Promise.resolve([])
    ]);

    return {
      items: [
        ...sermons.sermons.map((sermon) => ({
          id: sermon.id,
          resourceType: "sermon" as const,
          title: sermon.title,
          subtitle: sermon.speaker,
          path: "/sermons"
        })),
        ...lifePosts.map((post) => ({
          id: post.id,
          resourceType: "life_post" as const,
          title: post.title,
          subtitle: post.type,
          path: "/life-posts"
        })),
        ...members.map((member) => ({
          id: member.id,
          resourceType: "member" as const,
          title: member.displayName,
          subtitle: member.email,
          path: "/members"
        }))
      ].slice(0, 15)
    };
  }
}
