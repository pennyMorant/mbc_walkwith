import type { LifePost } from "@mbc/api-contracts";

import { lifePostRegistrationSummary } from "./life_post_registration_summary.js";

export const seedLifePosts: LifePost[] = [
  {
    id: "life-sunday-service",
    revision: 0,
    sourceLocale: "en",
    type: "sunday",
    title: "Sunday Worship",
    body: "Join Sunday worship at 10:00 AM in the main sanctuary.",
    meta: "Sunday 10:00 AM",
    iconName: "church",
    startsAt: "2026-05-10T17:00:00.000Z",
    endsAt: "2026-05-10T18:30:00.000Z",
    visibility: "public",
    imageUrl: null,
    displayWeight: 100,
    ctaLabel: null,
    ctaUrl: null,
    registrationEnabled: false,
    registrationCapacity: null,
    registrationDeadline: null,
    registrationAllowCancellation: true,
    registrationMaxPartySize: 1,
    registrationSummary: lifePostRegistrationSummary({}),
    status: "published",
    updatedAt: "2026-05-10T18:00:00.000Z"
  },
  {
    id: "life-friday-fellowship",
    revision: 0,
    sourceLocale: "en",
    type: "fellowship",
    title: "Friday Fellowship",
    body: "This week we study Romans 8 together.",
    meta: "Friday 7:30 PM",
    iconName: "groups",
    startsAt: "2026-05-16T02:30:00.000Z",
    endsAt: "2026-05-16T04:00:00.000Z",
    visibility: "public",
    imageUrl: null,
    displayWeight: 0,
    ctaLabel: null,
    ctaUrl: null,
    registrationEnabled: true,
    registrationCapacity: 40,
    registrationDeadline: "2026-05-15T02:30:00.000Z",
    registrationAllowCancellation: true,
    registrationMaxPartySize: 6,
    registrationSummary: lifePostRegistrationSummary({
      registrationEnabled: true,
      registrationCapacity: 40,
      registrationDeadline: "2026-05-15T02:30:00.000Z",
      registrationAllowCancellation: true,
      registrationMaxPartySize: 6
    }),
    status: "published",
    updatedAt: "2026-05-09T18:00:00.000Z"
  }
];
