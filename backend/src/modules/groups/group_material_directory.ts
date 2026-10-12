import type { GroupMaterialType } from "@mbc/api-contracts";

export interface GroupMaterialDirectory {
  exists(type: GroupMaterialType, id: string): Promise<boolean>;
}

interface PlanLookup {
  getPlanById(id: string): Promise<unknown | null>;
}

interface GuideLookup {
  getGuideById(id: string): Promise<unknown | null>;
}

interface CourseLookup {
  getById(id: string): Promise<unknown | null>;
}

export class RepositoryGroupMaterialDirectory
  implements GroupMaterialDirectory
{
  constructor(
    private readonly readingPlans: PlanLookup,
    private readonly sermonGuides: GuideLookup,
    private readonly courses: CourseLookup
  ) {}

  async exists(type: GroupMaterialType, id: string) {
    switch (type) {
      case "manual":
        return true;
      case "reading_plan":
        return (await this.readingPlans.getPlanById(id)) !== null;
      case "sermon_discussion_guide":
        return (await this.sermonGuides.getGuideById(id)) !== null;
      case "course":
        return (await this.courses.getById(id)) !== null;
    }
  }
}
