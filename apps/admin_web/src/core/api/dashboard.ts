import {
  adminDashboardResponseSchema,
  type AdminDashboardResponse
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  return apiClient.getData("/admin/dashboard", adminDashboardResponseSchema);
}
