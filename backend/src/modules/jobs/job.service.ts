import type {
  JobListQuery,
  UpdateJobStatusRequest
} from "@mbc/api-contracts";

import { jobActionStateConflict } from "./job-error-result.js";
import type { JobRepository } from "./job.repository.js";

export class JobService {
  constructor(private readonly repository: JobRepository) {}

  list(query: JobListQuery) {
    return this.repository.list(query);
  }

  stats() {
    return this.repository.stats();
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  updateStatus(id: string, input: UpdateJobStatusRequest) {
    return this.repository.updateStatus(id, input);
  }

  async cancel(id: string) {
    const job = await this.repository.getById(id);
    if (!job) {
      return null;
    }
    if (job.status === "canceled") {
      return job;
    }
    if (job.status !== "queued" && job.status !== "running") {
      throw jobActionStateConflict(
        job,
        "job_cancel_invalid_state",
        `Only queued or running jobs can be canceled. Current status: ${job.status}.`
      );
    }
    return this.repository.cancel(id);
  }
}
