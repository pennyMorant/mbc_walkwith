import type { SermonDiscussionAudienceType } from "@mbc/api-contracts";

export type ScopedSermonDiscussionAudienceType = Exclude<
  SermonDiscussionAudienceType,
  "public"
>;

export interface SermonDiscussionAudienceDirectory {
  exists(
    audienceType: ScopedSermonDiscussionAudienceType,
    audienceId: string
  ): Promise<boolean>;
}

interface EntityLookup {
  getById(id: string): Promise<unknown | null>;
}

interface JourneyLookup {
  getJourneyById(id: string): Promise<unknown | null>;
}

export class RepositorySermonDiscussionAudienceDirectory
  implements SermonDiscussionAudienceDirectory
{
  constructor(
    private readonly groups: EntityLookup,
    private readonly courses: EntityLookup,
    private readonly discipleship: JourneyLookup
  ) {}

  async exists(
    audienceType: ScopedSermonDiscussionAudienceType,
    audienceId: string
  ): Promise<boolean> {
    switch (audienceType) {
      case "group":
        return (await this.groups.getById(audienceId)) !== null;
      case "course":
        return (await this.courses.getById(audienceId)) !== null;
      case "discipleship":
        return (
          (await this.discipleship.getJourneyById(audienceId)) !== null
        );
    }
  }
}
