import type {
  EventCheckInCode,
  EventRegistration,
  EventRegistrationCheckInMethod,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  EventRegistrationRequest,
  EventRegistrationUpdateRequest,
  LifePost
} from "@mbc/api-contracts";

export interface EventRegistrationStore {
  getById(id: string): Promise<LifePost | null>;
  listRegistrations(
    lifePostId: string,
    query: EventRegistrationListQuery
  ): Promise<EventRegistrationPage>;
  listAllRegistrations(lifePostId: string): Promise<EventRegistration[]>;
  getRegistrationById(
    lifePostId: string,
    registrationId: string
  ): Promise<EventRegistration | null>;
  getActiveRegistrationForUser(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null>;
  countActiveRegistrationPartySize(lifePostId: string): Promise<number>;
  createRegistration(
    input: EventRegistrationCreateInput
  ): Promise<EventRegistration>;
  cancelRegistration(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null>;
  updateRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ): Promise<EventRegistration | null>;
  checkInRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationAttendanceInput
  ): Promise<EventRegistration | null>;
  getActiveCheckInCode(lifePostId: string): Promise<EventCheckInCode | null>;
  createCheckInCode(
    input: EventCheckInCodeCreateInput
  ): Promise<EventCheckInCode>;
  disableActiveCheckInCodes(lifePostId: string): Promise<void>;
  getCheckInCodeByValue(value: string): Promise<EventCheckInCode | null>;
  updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationAdminUpdateInput
  ): Promise<EventRegistration | null>;
}

export interface EventRegistrationRepository extends EventRegistrationStore {
  withEventRegistrationLock<T>(
    lifePostId: string,
    operation: (store: EventRegistrationStore) => Promise<T>
  ): Promise<T>;
}

export type EventRegistrationPage = {
  items: EventRegistration[];
  total: number;
};

export type EventRegistrationCreateInput = Omit<
  EventRegistrationRequest,
  "attendeeName" | "attendeeEmail"
> & {
  lifePostId: string;
  userId: string | null;
  attendeeName: string;
  attendeeEmail: string | null;
};

export type EventRegistrationAttendanceInput = {
  checkedInAt: string;
  checkInMethod: EventRegistrationCheckInMethod;
  checkedInByAdminUserId: string | null;
};

export type EventCheckInCodeCreateInput = {
  lifePostId: string;
  qrPayload: string;
  shortCode: string;
  expiresAt: string | null;
  createdByAdminUserId: string | null;
};

export type EventRegistrationAdminUpdateInput =
  EventRegistrationUpdateRequest & {
    checkedInAt?: string | null;
    checkInMethod?: EventRegistrationCheckInMethod | null;
    checkedInByAdminUserId?: string | null;
  };
