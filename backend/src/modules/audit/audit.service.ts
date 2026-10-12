import type { AuditLogListQuery } from "@mbc/api-contracts";

import type { AuditLogInput, AuditRepository } from "./audit.repository.js";

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  record(input: AuditLogInput) {
    return this.repository.record(input);
  }

  list(query: AuditLogListQuery) {
    return this.repository.list(query);
  }

  listAiRecords() {
    return this.repository.listAiRecords();
  }
}
