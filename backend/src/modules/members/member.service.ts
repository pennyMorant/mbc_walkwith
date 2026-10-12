import type {
  MemberCreateRequest,
  MemberListQuery,
  MemberSelfUpdateRequest,
  MemberUpdateRequest
} from "@mbc/api-contracts";

import { memberEmailConflict } from "./auth/member-auth-errors.js";
import {
  MemberEmailConflictRepositoryError,
  type MemberRepository
} from "./member.repository.js";

export class MemberService {
  constructor(private readonly repository: MemberRepository) {}

  list(query: MemberListQuery) {
    return this.repository.list(query);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  async create(input: MemberCreateRequest) {
    const existing = await this.repository.getByEmail(input.email);
    if (existing) {
      throw memberEmailConflict(input.email);
    }
    try {
      return await this.repository.create(input);
    } catch (error) {
      if (error instanceof MemberEmailConflictRepositoryError) {
        throw memberEmailConflict(error.email);
      }
      throw error;
    }
  }

  update(id: string, input: MemberUpdateRequest) {
    return this.updateWithEmailConflictCheck(id, input);
  }

  private async updateWithEmailConflictCheck(
    id: string,
    input: MemberUpdateRequest
  ) {
    if (input.email) {
      const existing = await this.repository.getByEmail(input.email);
      if (existing && existing.id !== id) {
        throw memberEmailConflict(input.email);
      }
    }
    try {
      return await this.repository.update(id, input);
    } catch (error) {
      if (error instanceof MemberEmailConflictRepositoryError) {
        throw memberEmailConflict(error.email);
      }
      throw error;
    }
  }

  updateSelf(id: string, input: MemberSelfUpdateRequest) {
    return this.repository.update(id, input);
  }
}
