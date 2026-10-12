import type {
  EventCheckInCode,
  EventRegistration,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  LifePost
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  EventCheckInCodeCreateInput,
  EventRegistrationAdminUpdateInput,
  EventRegistrationAttendanceInput,
  EventRegistrationCreateInput,
  EventRegistrationRepository,
  EventRegistrationStore
} from "./event_registration.repository.js";
import { normalizeEventCheckInCode } from "./event_check_in_rules.js";

export class InMemoryEventRegistrationRepository implements EventRegistrationRepository {
  private readonly registrations = new Map<string, EventRegistration>();
  private readonly checkInCodes = new Map<string, EventCheckInCode>();
  private readonly locks = new Map<string, Promise<void>>();

  constructor(
    private readonly getLifePostById: (id: string) => Promise<LifePost | null>
  ) {}

  getById(id: string) {
    return this.getLifePostById(id);
  }

  async summarizeParticipation() {
    const active = [...this.registrations.values()].filter(
      isActiveRegistration
    );
    return {
      registrationCount: active.length,
      attendeeCount: active.reduce(
        (total, registration) => total + registration.partySize,
        0
      ),
      checkedInCount: active
        .filter((registration) => registration.status === "checked_in")
        .reduce((total, registration) => total + registration.partySize, 0)
    };
  }

  async listRegistrations(
    lifePostId: string,
    query: EventRegistrationListQuery
  ) {
    const normalizedQuery = query.query?.trim().toLowerCase();
    const registrations = [...this.registrations.values()]
      .filter((registration) => {
        if (registration.lifePostId !== lifePostId) {
          return false;
        }
        if (query.status && registration.status !== query.status) {
          return false;
        }
        if (normalizedQuery) {
          return [
            registration.attendeeName,
            registration.attendeeEmail ?? "",
            registration.note
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      items: registrations.slice(query.offset, query.offset + query.limit),
      total: registrations.length
    };
  }

  async listAllRegistrations(lifePostId: string): Promise<EventRegistration[]> {
    return [...this.registrations.values()]
      .filter((registration) => registration.lifePostId === lifePostId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getRegistrationById(
    lifePostId: string,
    registrationId: string
  ): Promise<EventRegistration | null> {
    const registration = this.registrations.get(registrationId);
    return registration?.lifePostId === lifePostId ? registration : null;
  }

  async getActiveRegistrationForUser(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    return (
      [...this.registrations.values()].find(
        (registration) =>
          registration.lifePostId === lifePostId &&
          registration.userId === userId &&
          isActiveRegistration(registration)
      ) ?? null
    );
  }

  async withEventRegistrationLock<T>(
    lifePostId: string,
    operation: (store: EventRegistrationStore) => Promise<T>
  ): Promise<T> {
    const previous = this.locks.get(lifePostId) ?? Promise.resolve();
    let release: (() => void) | undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    this.locks.set(lifePostId, queued);
    await previous;
    const registrationsBefore = snapshotEventEntries(
      this.registrations,
      lifePostId
    );
    const checkInCodesBefore = snapshotEventEntries(
      this.checkInCodes,
      lifePostId
    );
    try {
      return await operation(this);
    } catch (error) {
      restoreEventEntries(this.registrations, lifePostId, registrationsBefore);
      restoreEventEntries(this.checkInCodes, lifePostId, checkInCodesBefore);
      throw error;
    } finally {
      release!();
      if (this.locks.get(lifePostId) === queued) {
        this.locks.delete(lifePostId);
      }
    }
  }

  async countActiveRegistrationPartySize(lifePostId: string): Promise<number> {
    return [...this.registrations.values()]
      .filter(
        (registration) =>
          registration.lifePostId === lifePostId &&
          isActiveRegistration(registration)
      )
      .reduce((total, registration) => total + registration.partySize, 0);
  }

  async createRegistration(
    input: EventRegistrationCreateInput
  ): Promise<EventRegistration> {
    const now = new Date().toISOString();
    const registration: EventRegistration = {
      id: randomUUID(),
      lifePostId: input.lifePostId,
      userId: input.userId,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      partySize: input.partySize,
      status: "confirmed",
      note: input.note ?? "",
      checkedInAt: null,
      checkInMethod: null,
      checkedInByAdminUserId: null,
      createdAt: now,
      updatedAt: now
    };
    this.registrations.set(registration.id, registration);
    return registration;
  }

  async cancelRegistration(
    lifePostId: string,
    userId: string
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    return this.saveRegistration({
      ...existing,
      status: "cancelled",
      checkedInAt: null,
      checkInMethod: null,
      checkedInByAdminUserId: null
    });
  }

  async updateRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    return this.saveRegistration({
      ...existing,
      partySize: input.partySize,
      note: input.note?.trim() ?? ""
    });
  }

  async checkInRegistrationForUser(
    lifePostId: string,
    userId: string,
    input: EventRegistrationAttendanceInput
  ): Promise<EventRegistration | null> {
    const existing = await this.getActiveRegistrationForUser(
      lifePostId,
      userId
    );
    if (!existing) {
      return null;
    }
    return this.saveRegistration({
      ...existing,
      status: "checked_in",
      checkedInAt: input.checkedInAt,
      checkInMethod: input.checkInMethod,
      checkedInByAdminUserId: input.checkedInByAdminUserId
    });
  }

  async getActiveCheckInCode(
    lifePostId: string
  ): Promise<EventCheckInCode | null> {
    const now = new Date();
    return (
      [...this.checkInCodes.values()]
        .filter(
          (code) =>
            code.lifePostId === lifePostId &&
            code.disabledAt === null &&
            (!code.expiresAt || new Date(code.expiresAt) > now)
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  }

  async createCheckInCode(
    input: EventCheckInCodeCreateInput
  ): Promise<EventCheckInCode> {
    const now = new Date().toISOString();
    const code: EventCheckInCode = {
      id: randomUUID(),
      lifePostId: input.lifePostId,
      qrPayload: input.qrPayload,
      shortCode: normalizeEventCheckInCode(input.shortCode),
      expiresAt: input.expiresAt,
      disabledAt: null,
      createdByAdminUserId: input.createdByAdminUserId,
      createdAt: now,
      updatedAt: now
    };
    this.checkInCodes.set(code.id, code);
    return code;
  }

  async disableActiveCheckInCodes(lifePostId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const code of this.checkInCodes.values()) {
      if (code.lifePostId === lifePostId && code.disabledAt === null) {
        this.checkInCodes.set(code.id, {
          ...code,
          disabledAt: now,
          updatedAt: now
        });
      }
    }
  }

  async getCheckInCodeByValue(value: string): Promise<EventCheckInCode | null> {
    const normalizedValue = normalizeEventCheckInCode(value);
    return (
      [...this.checkInCodes.values()].find(
        (code) =>
          code.qrPayload === value.trim() || code.shortCode === normalizedValue
      ) ?? null
    );
  }

  async updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationAdminUpdateInput
  ): Promise<EventRegistration | null> {
    const registration = this.registrations.get(registrationId);
    if (!registration || registration.lifePostId !== lifePostId) {
      return null;
    }
    return this.saveRegistration({
      ...registration,
      status: input.status ?? registration.status,
      partySize: input.partySize ?? registration.partySize,
      note: input.note === undefined ? registration.note : input.note.trim(),
      checkedInAt:
        input.checkedInAt === undefined
          ? registration.checkedInAt
          : input.checkedInAt,
      checkInMethod:
        input.checkInMethod === undefined
          ? registration.checkInMethod
          : input.checkInMethod,
      checkedInByAdminUserId:
        input.checkedInByAdminUserId === undefined
          ? registration.checkedInByAdminUserId
          : input.checkedInByAdminUserId
    });
  }

  private saveRegistration(registration: EventRegistration) {
    const updated = {
      ...registration,
      updatedAt: new Date().toISOString()
    };
    this.registrations.set(updated.id, updated);
    return updated;
  }
}

function isActiveRegistration(registration: EventRegistration) {
  return (
    registration.status === "confirmed" || registration.status === "checked_in"
  );
}

function snapshotEventEntries<T extends { lifePostId: string }>(
  source: Map<string, T>,
  lifePostId: string
) {
  return new Map(
    [...source].filter(([, value]) => value.lifePostId === lifePostId)
  );
}

function restoreEventEntries<T extends { lifePostId: string }>(
  target: Map<string, T>,
  lifePostId: string,
  snapshot: Map<string, T>
) {
  for (const [key, value] of target) {
    if (value.lifePostId === lifePostId) {
      target.delete(key);
    }
  }
  for (const [key, value] of snapshot) {
    target.set(key, value);
  }
}
