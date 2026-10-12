export interface ReadingPlanUserDirectory {
  memberExists(memberId: string): Promise<boolean>;
}

interface MemberLookup {
  getById(id: string): Promise<unknown | null>;
}

export class RepositoryReadingPlanUserDirectory
  implements ReadingPlanUserDirectory
{
  constructor(private readonly members: MemberLookup) {}

  async memberExists(memberId: string): Promise<boolean> {
    return (await this.members.getById(memberId)) !== null;
  }
}
