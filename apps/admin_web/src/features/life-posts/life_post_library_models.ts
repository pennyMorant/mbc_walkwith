import type {
  LifePostStatus,
  LifePostVisibility
} from "@mbc/api-contracts";

export interface LifePostLibraryFilterForm {
  query: string;
  visibility: LifePostVisibility | "";
  status: LifePostStatus | "";
}

export type LifePostLibraryFilterSnapshot = Readonly<
  LifePostLibraryFilterForm
>;

export function createLifePostLibraryFilterForm(): LifePostLibraryFilterForm {
  return {
    query: "",
    visibility: "",
    status: ""
  };
}

export function lifePostLibraryFilterSnapshot(
  form: LifePostLibraryFilterForm
): LifePostLibraryFilterSnapshot {
  return {
    query: form.query.trim(),
    visibility: form.visibility,
    status: form.status
  };
}

export function sameLifePostLibraryFilters(
  first: LifePostLibraryFilterSnapshot,
  second: LifePostLibraryFilterSnapshot
) {
  return (
    first.query === second.query &&
    first.visibility === second.visibility &&
    first.status === second.status
  );
}

export function resetLifePostLibraryFilterForm(
  form: LifePostLibraryFilterForm
) {
  Object.assign(form, createLifePostLibraryFilterForm());
}
