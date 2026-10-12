import type {
  DiscipleshipAssignmentCreateRequest,
  DiscipleshipTaskReferenceType
} from "@mbc/api-contracts";

export interface DiscipleshipReferenceDirectory {
  exists(type: DiscipleshipTaskReferenceType, id: string): Promise<boolean>;
}

export interface DiscipleshipSourceDirectory {
  exists(input: DiscipleshipAssignmentCreateRequest): Promise<boolean>;
}

interface IdLookup {
  getById(id: string): Promise<unknown | null>;
}

interface PlanLookup {
  getPlanById(id: string): Promise<unknown | null>;
}

interface GuideLookup {
  getGuideById(id: string): Promise<unknown | null>;
}

interface AssignmentLookup {
  getAssignmentById(id: string): Promise<unknown | null>;
}

interface RegistrationLookup {
  getRegistrationById(
    lifePostId: string,
    registrationId: string
  ): Promise<unknown | null>;
}

interface GroupApplicationLookup {
  getApplicationById(
    groupId: string,
    applicationId: string
  ): Promise<unknown | null>;
}

export class RepositoryDiscipleshipReferenceDirectory
  implements DiscipleshipReferenceDirectory
{
  constructor(
    private readonly readingPlans: PlanLookup,
    private readonly sermons: IdLookup,
    private readonly sermonGuides: GuideLookup,
    private readonly courses: IdLookup,
    private readonly groups: GroupApplicationLookup,
    private readonly serving: AssignmentLookup,
    private readonly registrations: RegistrationLookup,
    private readonly care: IdLookup
  ) {}

  async exists(type: DiscipleshipTaskReferenceType, id: string) {
    switch (type) {
      case "manual_review":
        return true;
      case "reading_plan":
        return (await this.readingPlans.getPlanById(id)) !== null;
      case "sermon":
        return (await this.sermons.getById(id)) !== null;
      case "sermon_discussion_guide":
        return (await this.sermonGuides.getGuideById(id)) !== null;
      case "course":
        return (await this.courses.getById(id)) !== null;
      case "group_application": {
        const parts = id.split(":");
        return (
          parts.length === 2 &&
          parts.every(Boolean) &&
          (await this.groups.getApplicationById(parts[0]!, parts[1]!)) !== null
        );
      }
      case "serving_assignment":
        return (await this.serving.getAssignmentById(id)) !== null;
      case "event_registration":
        return compositeReferenceExists(id, (lifePostId, registrationId) =>
          this.registrations.getRegistrationById(lifePostId, registrationId)
        );
      case "care_request":
        return (await this.care.getById(id)) !== null;
    }
  }
}

async function compositeReferenceExists(
  id: string,
  lookup: (ownerId: string, resourceId: string) => Promise<unknown | null>
) {
  const parts = id.split(":");
  return (
    parts.length === 2 &&
    parts.every(Boolean) &&
    (await lookup(parts[0]!, parts[1]!)) !== null
  );
}

export class RepositoryDiscipleshipSourceDirectory
  implements DiscipleshipSourceDirectory
{
  constructor(
    private readonly members: IdLookup,
    private readonly newcomers: IdLookup
  ) {}

  async exists(input: DiscipleshipAssignmentCreateRequest) {
    if (input.sourceType === "member") {
      return (
        !input.sourceId && (await this.members.getById(input.userId)) !== null
      );
    }
    return Boolean(
      input.sourceId && (await this.newcomers.getById(input.sourceId)) !== null
    );
  }
}
