import type { LifePost } from "@mbc/api-contracts";

export function lifePostRegistrationSummary(input: {
  registrationEnabled?: boolean | undefined;
  registrationCapacity?: number | null | undefined;
  registrationDeadline?: string | null | undefined;
  registrationAllowCancellation?: boolean | undefined;
  registrationMaxPartySize?: number | undefined;
}): LifePost["registrationSummary"] {
  return {
    enabled: input.registrationEnabled ?? false,
    capacity: input.registrationCapacity ?? null,
    registeredCount: 0,
    remainingCount: input.registrationCapacity ?? null,
    deadline: input.registrationDeadline ?? null,
    allowCancellation: input.registrationAllowCancellation ?? true,
    maxPartySize: input.registrationMaxPartySize ?? 1,
    myRegistrationStatus: null,
    myPartySize: null,
    myNote: null,
    myCheckedInAt: null,
    myCheckInMethod: null
  };
}
