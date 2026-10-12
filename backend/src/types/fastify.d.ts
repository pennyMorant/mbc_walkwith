import type { AdminUser, MemberProfile } from "@mbc/api-contracts";

declare module "fastify" {
  interface FastifyRequest {
    adminUser?: AdminUser;
    adminAccessToken?: {
      tokenId: string;
      expiresAt: Date;
    };
    member?: MemberProfile;
    memberAccessToken?: {
      tokenId: string;
      expiresAt: Date;
    };
  }
}
