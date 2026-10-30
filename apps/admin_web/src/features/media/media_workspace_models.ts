import type {
  MediaConsentStatus,
  MediaVisibility
} from "@mbc/api-contracts";

export type MediaLibraryFilterForm = {
  visibility: MediaVisibility | "";
  consentStatus: MediaConsentStatus | "";
};

export type MediaLibraryFilterSnapshot = MediaLibraryFilterForm;

export function createMediaLibraryFilterForm(): MediaLibraryFilterForm {
  return { visibility: "", consentStatus: "" };
}

export function mediaLibraryFilterSnapshot(
  filters: MediaLibraryFilterForm
): MediaLibraryFilterSnapshot {
  return { ...filters };
}

export function sameMediaLibraryFilters(
  current: MediaLibraryFilterSnapshot,
  next: MediaLibraryFilterSnapshot
) {
  return (
    current.visibility === next.visibility &&
    current.consentStatus === next.consentStatus
  );
}

export function resetMediaLibraryFilterForm(filters: MediaLibraryFilterForm) {
  filters.visibility = "";
  filters.consentStatus = "";
}

export function mediaCommandTargetsSelection(
  selectedAssetId: string | null,
  dialogOpen: boolean,
  commandAssetId: string
) {
  return dialogOpen && selectedAssetId === commandAssetId;
}
