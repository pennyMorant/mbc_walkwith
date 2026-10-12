import type { Sermon } from "@mbc/api-contracts";
import { useMutation } from "@tanstack/vue-query";
import { computed, onBeforeUnmount, ref, type Ref } from "vue";

import {
  deleteAdminSermonAudio,
  getAdminSermonAudioBlob,
  uploadAdminSermonAudio
} from "@/core/api/sermons";
import { appConfig } from "@/core/config/env";

type Translate = (key: string) => string;
type PermissionReader = { can(permission: string): boolean };

type UseSermonAudioStateInput = {
  selectedSermon: Ref<Sermon | null>;
  activeDetailTab: Ref<string>;
  authStore: PermissionReader;
  t: Translate;
  applySermonResult: (sermon: Sermon, replaceEditor?: boolean) => void;
  resetList: () => void;
};

export function useSermonAudioState(input: UseSermonAudioStateInput) {
  const {
    selectedSermon,
    activeDetailTab,
    authStore,
    t,
    applySermonResult,
    resetList
  } = input;
  const selectedAudioFile = ref<File | File[] | null>(null);
  const audioPreview = ref<{ sermonId: string; url: string } | null>(null);
  const maxSermonAudioBytes = 250 * 1024 * 1024;
  const allowedSermonAudioTypes = new Set([
    "audio/aac",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-m4a",
    "audio/x-wav"
  ]);

  const pendingAudioFile = computed(() => {
    const value = selectedAudioFile.value;
    return Array.isArray(value) ? value[0] ?? null : value;
  });

  const pendingAudioValidation = computed(() => {
    const file = pendingAudioFile.value;
    if (!file) {
      return null;
    }
    if (file.size <= 0) {
      return t("Audio file is empty.");
    }
    if (file.size > maxSermonAudioBytes) {
      return t("Audio file is too large.");
    }
    if (file.type && !allowedSermonAudioTypes.has(file.type)) {
      return t("Unsupported audio file type.");
    }
    return null;
  });

  const uploadAudioMutation = useMutation({
    mutationFn: (input: { sermonId: string; revision: number; file: File }) => {
      if (!authStore.can("sermons:update")) {
        throw new Error(t("Sermon update access required"));
      }
      return uploadAdminSermonAudio(
        input.sermonId,
        input.revision,
        input.file
      );
    },
    onSuccess: async (sermon, input) => {
      if (
        selectedSermon.value?.id === input.sermonId &&
        selectedSermon.value.revision === input.revision
      ) {
        setAudioPreviewUrl(sermon.id, URL.createObjectURL(input.file));
        if (pendingAudioFile.value === input.file) {
          selectedAudioFile.value = null;
        }
        applySermonResult(sermon, false);
        activeDetailTab.value = "audio";
      }
      resetList();
    }
  });

  const loadAudioPreviewMutation = useMutation({
    mutationFn: async (sermonId: string) => {
      const blob = await getAdminSermonAudioBlob(sermonId);
      return {
        sermonId,
        url: URL.createObjectURL(blob)
      };
    },
    onSuccess: ({ sermonId, url }) => {
      if (selectedSermon.value?.id === sermonId) {
        setAudioPreviewUrl(sermonId, url);
      } else {
        URL.revokeObjectURL(url);
      }
    }
  });

  const deleteAudioMutation = useMutation({
    mutationFn: (input: { sermonId: string; revision: number }) => {
      if (!authStore.can("sermons:update")) {
        throw new Error(t("Sermon update access required"));
      }
      return deleteAdminSermonAudio(input.sermonId, input.revision);
    },
    onSuccess: async (sermon, input) => {
      if (
        selectedSermon.value?.id === input.sermonId &&
        selectedSermon.value.revision === input.revision
      ) {
        clearAudioPreview();
        applySermonResult(sermon, false);
        activeDetailTab.value = "audio";
      }
      resetList();
    }
  });

  const canUploadAudio = computed(
    () =>
      Boolean(pendingAudioFile.value) &&
      !pendingAudioValidation.value &&
      authStore.can("sermons:update") &&
      !uploadAudioMutation.isPending.value
  );

  const publicAudioUrl = computed(() => {
    const audio = selectedSermon.value?.audio;
    if (
      !audio?.url ||
      audio.status !== "ready" ||
      selectedSermon.value?.status !== "published"
    ) {
      return null;
    }
    return new URL(audio.url, appConfig.apiBaseUrl).toString();
  });

  const audioPlaybackUrl = computed(() => {
    if (
      selectedSermon.value &&
      audioPreview.value?.sermonId === selectedSermon.value.id
    ) {
      return audioPreview.value.url;
    }
    return publicAudioUrl.value;
  });

  onBeforeUnmount(() => {
    clearAudioPreview();
  });

  function clearAudioPreviewForOtherSermon(sermonId: string) {
    if (audioPreview.value && audioPreview.value.sermonId !== sermonId) {
      clearAudioPreview();
    }
  }

  function setAudioPreviewUrl(sermonId: string, url: string) {
    clearAudioPreview();
    audioPreview.value = { sermonId, url };
  }

  function clearAudioPreview() {
    if (audioPreview.value) {
      URL.revokeObjectURL(audioPreview.value.url);
    }
    audioPreview.value = null;
  }

  function uploadSelectedAudio() {
    const sermon = selectedSermon.value;
    const file = pendingAudioFile.value;
    if (!sermon || !file || !canUploadAudio.value) {
      return;
    }
    uploadAudioMutation.mutate({
      sermonId: sermon.id,
      revision: sermon.revision,
      file
    });
  }

  function loadSelectedAudioPreview() {
    const sermon = selectedSermon.value;
    if (
      !sermon ||
      sermon.audio.status !== "ready" ||
      loadAudioPreviewMutation.isPending.value
    ) {
      return;
    }
    loadAudioPreviewMutation.mutate(sermon.id);
  }

  function deleteCurrentAudio() {
    const sermon = selectedSermon.value;
    if (
      !sermon ||
      !authStore.can("sermons:update") ||
      deleteAudioMutation.isPending.value
    ) {
      return;
    }
    deleteAudioMutation.mutate({
      sermonId: sermon.id,
      revision: sermon.revision
    });
  }

  return {
    selectedAudioFile,
    pendingAudioFile,
    pendingAudioValidation,
    canUploadAudio,
    audioPlaybackUrl,
    uploadAudioMutation,
    loadAudioPreviewMutation,
    deleteAudioMutation,
    uploadSelectedAudio,
    loadSelectedAudioPreview,
    deleteCurrentAudio,
    clearAudioPreviewForOtherSermon
  };
}
