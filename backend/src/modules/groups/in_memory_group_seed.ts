import type {
  GroupMembershipStatus,
  MinistryGroup
} from "@mbc/api-contracts";

export type InMemoryGroupMembership = {
  groupId: string;
  userId: string;
  status: GroupMembershipStatus;
  createdAt: string;
  updatedAt: string;
};

export const inMemoryGroupSeed: MinistryGroup[] = [
  {
    id: "friday-fellowship",
    name: "Friday Fellowship",
    description: "Weekly Bible sharing and dinner fellowship.",
    meetingTime: "Friday 7:30 PM",
    location: "Fellowship Hall",
    leaderName: "Daniel Chan",
    visibility: "members",
    status: "active",
    capacity: null,
    memberCount: 2,
    myApplicationId: null,
    myApplicationStatus: null,
    myMembershipStatus: null,
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];

export const inMemoryGroupMembershipSeed: InMemoryGroupMembership[] = [
  {
    groupId: "friday-fellowship",
    userId: "member-lee",
    status: "active",
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    groupId: "friday-fellowship",
    userId: "member-chan",
    status: "leader",
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];
