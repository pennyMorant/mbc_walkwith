import type {
  GroupApplication,
  GroupApplicationListQuery,
  GroupApplicationRequest,
  GroupApplicationStatus,
  GroupAttendanceListQuery,
  GroupAttendanceRecord,
  GroupAttendanceUpsertRequest,
  GroupMaterialAssignment,
  GroupMaterialAssignmentCreateRequest,
  GroupMaterialAssignmentListQuery,
  GroupMaterialAssignmentUpdateRequest,
  GroupMembership,
  GroupMembershipListQuery,
  GroupMembershipStatus,
  GroupMembershipUpdateRequest,
  MinistryGroup,
  MinistryGroupListQuery,
  MinistryGroupUpdateRequest,
  MinistryGroupUpsertRequest
} from "@mbc/api-contracts";

export interface GroupRepository {
  list(query: MinistryGroupListQuery): Promise<MinistryGroup[]>;
  listForPublic(query: MinistryGroupListQuery): Promise<MinistryGroup[]>;
  listForMember(
    query: MinistryGroupListQuery,
    userId: string
  ): Promise<MinistryGroup[]>;
  listMine(userId: string): Promise<MinistryGroup[]>;
  getById(id: string): Promise<MinistryGroup | null>;
  getByIdForPublic(id: string): Promise<MinistryGroup | null>;
  getByIdForMember(id: string, userId: string): Promise<MinistryGroup | null>;
  create(input: MinistryGroupUpsertRequest): Promise<MinistryGroup>;
  update(
    id: string,
    input: MinistryGroupUpdateRequest,
    validate: GroupUpdateValidator
  ): Promise<MinistryGroup | null>;
  listApplications(
    groupId: string,
    query: GroupApplicationListQuery
  ): Promise<GroupApplication[]>;
  getApplicationById(
    groupId: string,
    applicationId: string
  ): Promise<GroupApplication | null>;
  submitApplication(
    input: GroupApplicationCreateInput,
    decide: GroupApplicationSubmissionDecision
  ): Promise<GroupApplicationAttempt | null>;
  transitionApplication(
    input: GroupApplicationTransitionInput,
    decide: GroupApplicationTransitionDecision
  ): Promise<GroupApplicationTransitionAttempt | null>;
  getMembershipStatus(
    groupId: string,
    userId: string
  ): Promise<GroupMembershipStatus | null>;
  countActiveMembers(groupId: string): Promise<number>;
  listMemberships(
    groupId: string,
    query: GroupMembershipListQuery
  ): Promise<GroupMembership[]>;
  transitionMembership(
    groupId: string,
    userId: string,
    input: GroupMembershipUpdateRequest,
    decide: GroupMembershipTransitionDecision
  ): Promise<GroupMembershipTransitionAttempt | null>;
  listMaterialAssignments(
    groupId: string,
    query: GroupMaterialAssignmentListQuery
  ): Promise<GroupMaterialAssignment[]>;
  getMaterialAssignment(
    groupId: string,
    assignmentId: string
  ): Promise<GroupMaterialAssignment | null>;
  createMaterialAssignment(
    groupId: string,
    input: GroupMaterialAssignmentCreateRequest
  ): Promise<GroupMaterialAssignment>;
  updateMaterialAssignment(
    groupId: string,
    assignmentId: string,
    input: GroupMaterialAssignmentUpdateRequest
  ): Promise<GroupMaterialAssignment | null>;
  listAttendanceRecords(
    groupId: string,
    query: GroupAttendanceListQuery
  ): Promise<GroupAttendanceRecord[]>;
  upsertAttendanceRecord(
    groupId: string,
    input: GroupAttendanceUpsertInput
  ): Promise<GroupAttendanceRecord | null>;
}

export type GroupAttendanceUpsertInput = GroupAttendanceUpsertRequest & {
  memberDisplayName: string;
};

export type GroupApplicationCreateInput = GroupApplicationRequest & {
  groupId: string;
  userId: string;
  memberDisplayName: string;
  memberEmail: string;
};

export type GroupUpdateContext = {
  group: MinistryGroup;
  activeMemberCount: number;
};

export type GroupUpdateValidator = (context: GroupUpdateContext) => void;

export type GroupApplicationSubmissionContext = {
  groupStatus: MinistryGroup["status"];
  visibility: MinistryGroup["visibility"];
  capacity: number | null;
  activeMemberCount: number;
  membershipStatus: GroupMembershipStatus | null;
};

export type GroupApplicationSubmissionDecision = (
  context: GroupApplicationSubmissionContext
) => void;

export type GroupApplicationAttempt = {
  application: GroupApplication;
  created: boolean;
};

export type GroupApplicationTransitionInput = {
  groupId: string;
  applicationId: string;
  status: Exclude<GroupApplicationStatus, "submitted">;
  expectedUserId?: string;
};

export type GroupApplicationTransitionContext = {
  groupStatus: MinistryGroup["status"];
  capacity: number | null;
  activeMemberCount: number;
  currentStatus: GroupApplicationStatus;
  nextStatus: Exclude<GroupApplicationStatus, "submitted">;
};

export type GroupApplicationTransitionDecision = (
  context: GroupApplicationTransitionContext
) => void;

export type GroupApplicationTransitionAttempt = {
  application: GroupApplication;
  changed: boolean;
};

export type GroupMembershipTransitionContext = {
  groupStatus: MinistryGroup["status"];
  capacity: number | null;
  activeMemberCount: number;
  currentStatus: GroupMembershipStatus;
  nextStatus: GroupMembershipStatus;
};

export type GroupMembershipTransitionDecision = (
  context: GroupMembershipTransitionContext
) => void;

export type GroupMembershipTransitionAttempt = {
  membership: GroupMembership;
  previousStatus: GroupMembershipStatus;
  changed: boolean;
};
