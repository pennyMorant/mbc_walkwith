import type {
  AdminPrayerRequest,
  AdminPrayerRequestListQuery,
  AdminPrayerRequestUpdateRequest,
  MemberPrayerRequestListQuery,
  MemberSharedPrayerRequestListQuery,
  PrayerRequest,
  PrayerRequestCreateRequest,
  PrayerRequestListQuery,
  PrayerStatus,
  PrayerRequestUpdateRequest
} from "@mbc/api-contracts";

export type PrayerRequestCreateRecord = PrayerRequestCreateRequest & {
  authorUserId?: string | null;
};

export interface PrayerRepository {
  listVisible(query: PrayerRequestListQuery): Promise<PrayerRequest[]>;
  listByAuthor(
    authorUserId: string,
    query: MemberPrayerRequestListQuery
  ): Promise<PrayerRequest[]>;
  listSharedForMember(
    query: MemberSharedPrayerRequestListQuery
  ): Promise<PrayerRequest[]>;
  listAdmin(query: AdminPrayerRequestListQuery): Promise<AdminPrayerRequest[]>;
  countAdminByStatus(status: PrayerStatus): Promise<number>;
  getById(id: string): Promise<AdminPrayerRequest | null>;
  create(input: PrayerRequestCreateRecord): Promise<AdminPrayerRequest>;
  update(
    id: string,
    input: PrayerRequestUpdateRequest
  ): Promise<AdminPrayerRequest | null>;
  updateAdmin(
    id: string,
    input: AdminPrayerRequestUpdateRequest & {
      moderatedByAdminUserId?: string | null;
    }
  ): Promise<AdminPrayerRequest | null>;
  delete(id: string): Promise<boolean>;
}
