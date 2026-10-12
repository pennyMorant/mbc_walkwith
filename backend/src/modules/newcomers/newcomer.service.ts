import type {
  NewcomerCreateRequest,
  NewcomerFollowUpCreateRequest,
  NewcomerListQuery,
  NewcomerProfile,
  NewcomerSubmission,
  NewcomerUpdateRequest
} from "@mbc/api-contracts";

import {
  newcomerFollowUpInvalid,
  newcomerNotFound
} from "./newcomer-errors.js";
import type { NewcomerRepository } from "./newcomer.repository.js";

export class NewcomerService {
  constructor(private readonly repository: NewcomerRepository) {}

  list(query: NewcomerListQuery) {
    return this.repository.list(query);
  }

  async getById(id: string) {
    const newcomer = await this.repository.getById(id);
    if (!newcomer) {
      throw newcomerNotFound(id);
    }
    return newcomer;
  }

  create(input: NewcomerCreateRequest) {
    return this.repository.create(input);
  }

  async update(id: string, input: NewcomerUpdateRequest) {
    const newcomer = await this.repository.update(id, input);
    if (!newcomer) {
      throw newcomerNotFound(id);
    }
    return newcomer;
  }

  async listFollowUps(newcomerId: string) {
    await this.getById(newcomerId);
    return this.repository.listFollowUps(newcomerId);
  }

  async createFollowUp(
    newcomerId: string,
    actor: { id: string; name: string } | null,
    input: NewcomerFollowUpCreateRequest
  ) {
    await this.getById(newcomerId);
    validateFollowUpLifecycle(newcomerId, input);
    const followUp = await this.repository.createFollowUp({
      ...input,
      newcomerId,
      authorAdminUserId: actor?.id ?? null,
      authorName: actor?.name ?? ""
    });
    if (input.status === "completed") {
      const current = await this.getById(newcomerId);
      if (current.status === "new" || current.status === "assigned") {
        await this.repository.update(newcomerId, { status: "contacted" });
      }
    }
    return followUp;
  }
}

export function toNewcomerSubmission(
  newcomer: NewcomerProfile
): NewcomerSubmission {
  return {
    id: newcomer.id,
    displayName: newcomer.displayName,
    status: newcomer.status,
    createdAt: newcomer.createdAt
  };
}

function validateFollowUpLifecycle(
  newcomerId: string,
  input: NewcomerFollowUpCreateRequest
) {
  if (input.status !== "completed" && input.completedAt) {
    throw newcomerFollowUpInvalid(
      newcomerId,
      "completedAt requires completed status"
    );
  }
  if (input.status !== "completed" && !input.plannedAt) {
    throw newcomerFollowUpInvalid(
      newcomerId,
      "non-completed follow-up requires plannedAt"
    );
  }
}
