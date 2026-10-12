import type {
  EventCheckInCodeCreateRequest,
  LifePost,
  PublicLifePost
} from "@mbc/api-contracts";

import {
  checkInNotAllowed,
  eventCheckInCodeDisabled,
  eventCheckInCodeExpired,
  eventCheckInCodeInvalid,
  eventNotFound,
  eventNotOpen,
  registrationNotFound
} from "./event_registration_errors.js";
import type { EventRegistrationRepository } from "./event_registration.repository.js";
import {
  defaultCheckInCodeExpiresAt,
  generateEventCheckInQrPayload,
  generateEventCheckInShortCode,
  requireMemberCheckInWindow
} from "./event_check_in_rules.js";

export class LifeEventAttendanceService {
  constructor(
    private readonly repository: EventRegistrationRepository,
    private readonly getPostForMemberWithRegistration: (
      id: string,
      userId: string
    ) => Promise<PublicLifePost | null>
  ) {}

  async checkInForMember(lifePostId: string, userId: string) {
    return this.repository.withEventRegistrationLock(
      lifePostId,
      async (store) => {
        const post = await store.getById(lifePostId);
        requireMemberVisibleEvent(post, lifePostId);
        const existing = await store.getActiveRegistrationForUser(
          lifePostId,
          userId
        );
        if (!existing) {
          throw registrationNotFound(lifePostId);
        }
        if (existing.status === "checked_in") {
          return existing;
        }
        if (existing.status !== "confirmed") {
          throw checkInNotAllowed(lifePostId, existing.id);
        }
        requireMemberCheckInWindow(post, existing.id);
        const registration = await store.checkInRegistrationForUser(
          lifePostId,
          userId,
          {
            checkedInAt: new Date().toISOString(),
            checkInMethod: "member_self",
            checkedInByAdminUserId: null
          }
        );
        if (!registration) {
          throw registrationNotFound(lifePostId);
        }
        return registration;
      }
    );
  }

  async createOrRotateCheckInCode(
    lifePostId: string,
    input: EventCheckInCodeCreateRequest,
    actorAdminUserId?: string | null
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
        if (!input.rotate) {
          const existing = await store.getActiveCheckInCode(lifePostId);
          if (existing) {
            return existing;
          }
        }
        if (input.rotate) {
          await store.disableActiveCheckInCodes(lifePostId);
        }
        return store.createCheckInCode({
          lifePostId,
          qrPayload: generateEventCheckInQrPayload(),
          shortCode: generateEventCheckInShortCode(),
          expiresAt: input.expiresAt ?? defaultCheckInCodeExpiresAt(post),
          createdByAdminUserId: actorAdminUserId ?? null
        });
      }
    );
  }

  async checkInWithCode(rawCode: string, userId: string) {
    const normalizedCode = rawCode.trim();
    const discoveredCode =
      await this.repository.getCheckInCodeByValue(normalizedCode);
    if (!discoveredCode) {
      throw eventCheckInCodeInvalid();
    }
    const result = await this.repository.withEventRegistrationLock(
      discoveredCode.lifePostId,
      async (store) => {
        const checkInCode = await store.getCheckInCodeByValue(normalizedCode);
        if (!checkInCode) {
          throw eventCheckInCodeInvalid();
        }
        if (checkInCode.disabledAt) {
          throw eventCheckInCodeDisabled(checkInCode.lifePostId);
        }
        if (
          checkInCode.expiresAt &&
          new Date(checkInCode.expiresAt).getTime() <= Date.now()
        ) {
          throw eventCheckInCodeExpired(checkInCode.lifePostId);
        }
        const post = await store.getById(checkInCode.lifePostId);
        requireMemberVisibleEvent(post, checkInCode.lifePostId);
        const existing = await store.getActiveRegistrationForUser(
          checkInCode.lifePostId,
          userId
        );
        if (!existing) {
          throw registrationNotFound(checkInCode.lifePostId);
        }
        if (existing.status === "checked_in") {
          return {
            lifePostId: checkInCode.lifePostId,
            registration: existing
          };
        }
        if (existing.status !== "confirmed") {
          throw checkInNotAllowed(checkInCode.lifePostId, existing.id);
        }
        requireMemberCheckInWindow(post, existing.id);
        const registration = await store.checkInRegistrationForUser(
          checkInCode.lifePostId,
          userId,
          {
            checkedInAt: new Date().toISOString(),
            checkInMethod: "onsite_qr",
            checkedInByAdminUserId: null
          }
        );
        if (!registration) {
          throw registrationNotFound(checkInCode.lifePostId);
        }
        return { lifePostId: checkInCode.lifePostId, registration };
      }
    );
    const post = await this.getPostForMemberWithRegistration(
      result.lifePostId,
      userId
    );
    if (!post) {
      throw eventNotFound(result.lifePostId);
    }
    return { post, registration: result.registration };
  }
}

function requireMemberVisibleEvent(
  post: LifePost | null,
  lifePostId: string
): asserts post is LifePost {
  if (
    !post ||
    post.status !== "published" ||
    !["public", "members"].includes(post.visibility)
  ) {
    throw eventNotFound(lifePostId);
  }
  if (!post.registrationEnabled) {
    throw eventNotOpen(
      "Registration is not enabled for this event.",
      lifePostId
    );
  }
}
