import type {
  EventRegistrationAdminCreateRequest,
  EventRegistrationListQuery,
  EventRegistrationMemberUpdateRequest,
  EventRegistrationRequest,
  EventRegistrationStatus,
  EventRegistrationUpdateRequest
} from "@mbc/api-contracts";

import {
  checkInNotAllowed,
  eventCapacityFull,
  eventNotFound,
  eventNotOpen,
  eventPartySizeInvalid,
  registrationNotFound
} from "./event_registration_errors.js";
import { eventRegistrationsToCsv } from "./event_registration_csv.js";
import { eventRegistrationAttendancePatch } from "./event_registration_summary.js";
import type { EventRegistrationRepository } from "./event_registration.repository.js";

export class LifeEventRegistrationService {
  constructor(private readonly repository: EventRegistrationRepository) {}

  async listRegistrations(
    lifePostId: string,
    query: EventRegistrationListQuery
  ) {
    const page = await this.repository.listRegistrations(lifePostId, query);
    return {
      ...page,
      limit: query.limit,
      offset: query.offset
    };
  }

  async registerForEvent(
    lifePostId: string,
    user: {
      id: string;
      displayName: string;
      email: string;
    },
    input: EventRegistrationRequest
  ) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        if (!post || post.status !== "published") {
          throw eventNotFound(lifePostId);
        }
        if (!["public", "members"].includes(post.visibility)) {
          throw eventNotFound(lifePostId);
        }
        if (!post.registrationEnabled) {
          throw eventNotOpen(
            "Registration is not enabled for this event.",
            lifePostId
          );
        }
        if (
          post.registrationDeadline &&
          new Date(post.registrationDeadline) <= new Date()
        ) {
          throw eventNotOpen("Registration deadline has passed.", lifePostId);
        }
        const partySize = input.partySize;
        if (partySize > post.registrationMaxPartySize) {
          throw eventPartySizeInvalid(
            lifePostId,
            post.registrationMaxPartySize
          );
        }
        const existing = await store.getActiveRegistrationForUser(
          lifePostId,
          user.id
        );
        if (existing) {
          return existing;
        }
        const registeredCount =
          await store.countActiveRegistrationPartySize(lifePostId);
        if (
          post.registrationCapacity !== null &&
          registeredCount + partySize > post.registrationCapacity
        ) {
          throw eventCapacityFull(lifePostId, {
            capacity: post.registrationCapacity,
            registeredCount,
            requestedPartySize: partySize
          });
        }
        return store.createRegistration({
          lifePostId,
          userId: user.id,
          attendeeName: input.attendeeName?.trim() || user.displayName,
          attendeeEmail: input.attendeeEmail?.trim() || user.email || null,
          partySize,
          note: input.note?.trim() ?? ""
        });
      }
    );
  }

  async createRegistrationForAdmin(
    lifePostId: string,
    input: EventRegistrationAdminCreateRequest
  ) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        if (!post) {
          throw eventNotFound(lifePostId);
        }
        if (!post.registrationEnabled) {
          throw eventNotOpen(
            "Registration is not enabled for this event.",
            lifePostId
          );
        }
        if (input.partySize > post.registrationMaxPartySize) {
          throw eventPartySizeInvalid(
            lifePostId,
            post.registrationMaxPartySize
          );
        }
        const registeredCount =
          await store.countActiveRegistrationPartySize(lifePostId);
        if (
          post.registrationCapacity !== null &&
          registeredCount + input.partySize > post.registrationCapacity
        ) {
          throw eventCapacityFull(lifePostId, {
            capacity: post.registrationCapacity,
            registeredCount,
            requestedPartySize: input.partySize
          });
        }
        return store.createRegistration({
          lifePostId,
          userId: null,
          attendeeName: input.attendeeName.trim(),
          attendeeEmail: input.attendeeEmail?.trim() || null,
          partySize: input.partySize,
          note: input.note?.trim() ?? ""
        });
      }
    );
  }

  async cancelEventRegistration(lifePostId: string, userId: string) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        if (
          !post ||
          post.status !== "published" ||
          !["public", "members"].includes(post.visibility)
        ) {
          throw eventNotFound(lifePostId);
        }
        if (!post.registrationEnabled || !post.registrationAllowCancellation) {
          throw eventNotOpen(
            "Registration cancellation is not allowed.",
            lifePostId
          );
        }
        const existing = await store.getActiveRegistrationForUser(
          lifePostId,
          userId
        );
        if (!existing) {
          throw registrationNotFound(lifePostId);
        }
        if (existing.status !== "confirmed") {
          throw checkInNotAllowed(lifePostId, existing.id);
        }
        const registration = await store.cancelRegistration(lifePostId, userId);
        if (!registration) {
          throw registrationNotFound(lifePostId);
        }
        return registration;
      }
    );
  }

  async updateEventRegistrationForMember(
    lifePostId: string,
    userId: string,
    input: EventRegistrationMemberUpdateRequest
  ) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        if (!post || post.status !== "published") {
          throw eventNotFound(lifePostId);
        }
        if (!["public", "members"].includes(post.visibility)) {
          throw eventNotFound(lifePostId);
        }
        if (!post.registrationEnabled) {
          throw eventNotOpen(
            "Registration is not enabled for this event.",
            lifePostId
          );
        }
        if (
          post.registrationDeadline &&
          new Date(post.registrationDeadline) <= new Date()
        ) {
          throw eventNotOpen("Registration deadline has passed.", lifePostId);
        }
        if (input.partySize > post.registrationMaxPartySize) {
          throw eventPartySizeInvalid(
            lifePostId,
            post.registrationMaxPartySize
          );
        }
        const existing = await store.getActiveRegistrationForUser(
          lifePostId,
          userId
        );
        if (!existing) {
          throw registrationNotFound(lifePostId);
        }
        if (existing.status !== "confirmed") {
          throw checkInNotAllowed(lifePostId, existing.id);
        }
        const registeredCount =
          await store.countActiveRegistrationPartySize(lifePostId);
        if (
          post.registrationCapacity !== null &&
          registeredCount - existing.partySize + input.partySize >
            post.registrationCapacity
        ) {
          throw eventCapacityFull(lifePostId, {
            capacity: post.registrationCapacity,
            registeredCount,
            requestedPartySize: input.partySize
          });
        }
        const registration = await store.updateRegistrationForUser(
          lifePostId,
          userId,
          input
        );
        if (!registration) {
          throw registrationNotFound(lifePostId);
        }
        return registration;
      }
    );
  }

  async updateRegistrationStatus(
    lifePostId: string,
    registrationId: string,
    status: EventRegistrationStatus
  ) {
    return this.updateRegistration(lifePostId, registrationId, { status });
  }

  async updateRegistration(
    lifePostId: string,
    registrationId: string,
    input: EventRegistrationUpdateRequest,
    actorAdminUserId?: string | null
  ) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        if (!post) {
          throw eventNotFound(lifePostId);
        }
        const registrationBeforeUpdate = await store.getRegistrationById(
          lifePostId,
          registrationId
        );
        if (!registrationBeforeUpdate) {
          throw registrationNotFound(lifePostId, registrationId);
        }
        const nextStatus = input.status ?? registrationBeforeUpdate.status;
        const nextPartySize =
          input.partySize ?? registrationBeforeUpdate.partySize;
        if (nextPartySize > post.registrationMaxPartySize) {
          throw eventPartySizeInvalid(
            lifePostId,
            post.registrationMaxPartySize
          );
        }
        if (["confirmed", "checked_in"].includes(nextStatus)) {
          const registeredCount =
            await store.countActiveRegistrationPartySize(lifePostId);
          const currentActivePartySize = ["confirmed", "checked_in"].includes(
            registrationBeforeUpdate.status
          )
            ? registrationBeforeUpdate.partySize
            : 0;
          if (
            post.registrationCapacity !== null &&
            registeredCount - currentActivePartySize + nextPartySize >
              post.registrationCapacity
          ) {
            throw eventCapacityFull(lifePostId, {
              capacity: post.registrationCapacity,
              registeredCount,
              requestedPartySize: nextPartySize
            });
          }
        }
        const registration = await store.updateRegistration(
          lifePostId,
          registrationId,
          eventRegistrationAttendancePatch(
            input,
            registrationBeforeUpdate,
            actorAdminUserId ?? null
          )
        );
        if (!registration) {
          throw registrationNotFound(lifePostId, registrationId);
        }
        return registration;
      }
    );
  }

  async exportRegistrationsCsv(lifePostId: string) {
    const post = await this.repository.getById(lifePostId);
    if (!post) {
      return null;
    }
    const registrations =
      await this.repository.listAllRegistrations(lifePostId);
    const csv = eventRegistrationsToCsv(registrations);
    return { post, csv };
  }
}
