import type {
  Job,
  JobListQuery,
  JobStatsResponse,
  UpdateJobStatusRequest
} from "@mbc/api-contracts";

export type JobListResult = {
  jobs: Job[];
  nextCursor: string | null;
};

export interface JobRepository {
  list(query: JobListQuery): Promise<JobListResult>;
  stats(): Promise<JobStatsResponse>;
  getById(id: string): Promise<Job | null>;
  updateStatus(id: string, input: UpdateJobStatusRequest): Promise<Job | null>;
  cancel(id: string): Promise<Job | null>;
}
