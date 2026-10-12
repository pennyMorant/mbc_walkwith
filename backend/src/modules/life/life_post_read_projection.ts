import type { LifePost, PublicLifePost } from "@mbc/api-contracts";

import type { LifePostRepository } from "./life-post.repository.js";

export function toPublicLifePost(post: LifePost): PublicLifePost {
  const { revision: _revision, ...publicPost } = post;
  return publicPost;
}

export async function withLifePostReadStates(
  repository: LifePostRepository,
  posts: PublicLifePost[],
  userId?: string
): Promise<PublicLifePost[]> {
  if (!userId || posts.length === 0) {
    return posts;
  }
  const states = await repository.listReadStates(
    userId,
    posts.map((post) => post.id)
  );
  const statesByPostId = new Map(
    states.map((state) => [state.lifePostId, state])
  );
  return posts.map((post) =>
    applyReadState(post, statesByPostId.get(post.id)?.readAt)
  );
}

export async function withLifePostReadState(
  repository: LifePostRepository,
  post: PublicLifePost,
  userId: string
): Promise<PublicLifePost> {
  const [state] = await repository.listReadStates(userId, [post.id]);
  return applyReadState(post, state?.readAt);
}

function applyReadState(post: PublicLifePost, readAt?: string) {
  return {
    ...post,
    isRead: readAt
      ? new Date(readAt).getTime() >= new Date(post.updatedAt).getTime()
      : false,
    readAt: readAt ?? null
  };
}
