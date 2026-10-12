import type { SermonStatus } from "@mbc/api-contracts";

export type SermonLibraryFilterForm = {
  query: string;
  status: SermonStatus | "";
  speaker: string;
  series: string;
  topic: string;
};

export type SermonLibraryFilterSnapshot = Readonly<SermonLibraryFilterForm>;

export function createSermonLibraryFilterForm(): SermonLibraryFilterForm {
  return {
    query: "",
    status: "",
    speaker: "",
    series: "",
    topic: ""
  };
}

export function sermonLibraryFilterSnapshot(
  form: SermonLibraryFilterForm
): SermonLibraryFilterSnapshot {
  return {
    query: form.query.trim(),
    status: form.status,
    speaker: form.speaker.trim(),
    series: form.series.trim(),
    topic: form.topic.trim()
  };
}

export function sameSermonLibraryFilters(
  left: SermonLibraryFilterSnapshot,
  right: SermonLibraryFilterSnapshot
) {
  return (
    left.query === right.query &&
    left.status === right.status &&
    left.speaker === right.speaker &&
    left.series === right.series &&
    left.topic === right.topic
  );
}
