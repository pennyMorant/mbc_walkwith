import type {
  EventRegistrationStatus,
  LifePost
} from "@mbc/api-contracts";
import { useMutation } from "@tanstack/vue-query";
import { computed, ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createEventCheckInCode,
  createEventRegistration,
  exportEventRegistrations,
  updateEventRegistration,
  updateEventRegistrationStatus
} from "@/core/api/life_posts";
import { downloadTextFile } from "@/core/files/download_text_file";
import {
  buildRegistrationCreateIntent,
  buildRegistrationUpdateIntent,
  isRegistrationCommandCurrent,
  resetRegistrationCreateForm,
  type CheckInCodeDialog,
  type RegistrationCreateDialog,
  type RegistrationEditDialog
} from "../life_event_registration_workspace";

type Input = {
  selectedPost: Ref<LifePost | null>;
  canManage: Ref<boolean>;
  registrationEditDialog: RegistrationEditDialog;
  registrationCreateDialog: RegistrationCreateDialog;
  checkInCodeDialog: CheckInCodeDialog;
  t: (key: string) => string;
  showToast: (message: string, color?: string) => void;
  nullableTrimmed: (value: string) => string | null;
  workspaceSessionId: Ref<number>;
  refreshRegistrationData: (postId: string) => Promise<void>;
};

type CommandContext = {
  postId: string;
  workspaceSessionId: number;
};

export function useLifeEventRegistrationCommands(input: Input) {
  const commandErrorMessage = ref("");

  const exportMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (intent: CommandContext) =>
      exportEventRegistrations(intent.postId),
    onSuccess: (result, intent) => {
      downloadTextFile({
        content: result.csv,
        filename: result.filename,
        contentType: result.contentType
      });
      if (isCurrentIntent(intent)) {
        input.showToast(input.t("Event registrations exported."));
      }
    },
    onError: captureCommandError
  });

  const createMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (
      intent: CommandContext & ReturnType<typeof buildRegistrationCreateIntent>
    ) =>
      createEventRegistration(intent.postId, intent.payload),
    onSuccess: async (_registration, intent) => {
      if (isCurrentIntent(intent)) {
        input.registrationCreateDialog.show = false;
        resetRegistrationCreateForm(input.registrationCreateDialog);
        input.showToast(input.t("Registration added."));
      }
      await input.refreshRegistrationData(intent.postId);
    },
    onError: captureCommandError
  });

  const checkInCodeMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (intent: CommandContext & { rotate: boolean }) =>
      createEventCheckInCode(intent.postId, { rotate: intent.rotate }),
    onSuccess: (code, intent) => {
      if (isCurrentIntent(intent)) {
        input.checkInCodeDialog.code = code;
        input.checkInCodeDialog.show = true;
        input.showToast(input.t("Check-in QR is ready."));
      }
    },
    onError: captureCommandError
  });

  const updateStatusMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (intent: CommandContext & {
      registrationId: string;
      status: EventRegistrationStatus;
    }) =>
      updateEventRegistrationStatus(
        intent.postId,
        intent.registrationId,
        intent.status
      ),
    onSuccess: async (_registration, intent) => {
      if (isCurrentIntent(intent)) {
        input.showToast(input.t("Registration status updated."));
      }
      await input.refreshRegistrationData(intent.postId);
    },
    onError: captureCommandError
  });

  const updateMutation = useMutation({
    onMutate: clearCommandError,
    mutationFn: (
      intent: CommandContext & ReturnType<typeof buildRegistrationUpdateIntent>
    ) =>
      updateEventRegistration(
        intent.postId,
        intent.registrationId,
        intent.payload
      ),
    onSuccess: async (_registration, intent) => {
      if (isCurrentIntent(intent)) {
        input.registrationEditDialog.show = false;
        input.showToast(input.t("Registration updated."));
      }
      await input.refreshRegistrationData(intent.postId);
    },
    onError: captureCommandError
  });

  const commandPending = computed(() =>
    [
      exportMutation,
      createMutation,
      checkInCodeMutation,
      updateStatusMutation,
      updateMutation
    ].some((mutation) => mutation.isPending.value)
  );

  function exportRegistrations() {
    const post = currentManageablePost();
    if (!post || commandPending.value) return;
    exportMutation.mutate(commandContext(post.id));
  }

  function createRegistration() {
    const post = currentManageablePost();
    if (!post || commandPending.value) return;
    createMutation.mutate({
      ...buildRegistrationCreateIntent(
        post.id,
        input.registrationCreateDialog,
        input.nullableTrimmed
      ),
      workspaceSessionId: input.workspaceSessionId.value
    });
  }

  function createCheckInCode(rotate: boolean) {
    const post = currentManageablePost();
    if (!post || commandPending.value) return;
    checkInCodeMutation.mutate({ ...commandContext(post.id), rotate });
  }

  function updateRegistrationStatus(request: {
    registrationId: string;
    status: EventRegistrationStatus;
  }) {
    const post = currentManageablePost();
    if (!post || commandPending.value) return;
    updateStatusMutation.mutate({ ...commandContext(post.id), ...request });
  }

  function updateRegistration() {
    const post = currentManageablePost();
    if (!post || commandPending.value) return;
    updateMutation.mutate({
      ...buildRegistrationUpdateIntent(post.id, input.registrationEditDialog),
      workspaceSessionId: input.workspaceSessionId.value
    });
  }

  function reset() {
    commandErrorMessage.value = "";
    exportMutation.reset();
    createMutation.reset();
    checkInCodeMutation.reset();
    updateStatusMutation.reset();
    updateMutation.reset();
  }

  function currentManageablePost() {
    return input.canManage.value ? input.selectedPost.value : null;
  }

  function isCurrentIntent(intent: CommandContext) {
    return isRegistrationCommandCurrent(
      intent,
      input.workspaceSessionId.value,
      input.selectedPost.value?.id ?? null
    );
  }

  function commandContext(postId: string): CommandContext {
    return { postId, workspaceSessionId: input.workspaceSessionId.value };
  }

  function clearCommandError(intent: CommandContext) {
    if (isCurrentIntent(intent)) commandErrorMessage.value = "";
  }

  function captureCommandError(error: unknown, intent: CommandContext) {
    if (isCurrentIntent(intent)) {
      commandErrorMessage.value = formatApiErrorMessage(
        error,
        input.t("common.error")
      );
    }
  }

  return {
    commandErrorMessage,
    commandPending,
    exportPending: computed(() => exportMutation.isPending.value),
    createPending: computed(() => createMutation.isPending.value),
    checkInCodePending: computed(() => checkInCodeMutation.isPending.value),
    updateStatusPending: computed(() => updateStatusMutation.isPending.value),
    updatePending: computed(() => updateMutation.isPending.value),
    exportRegistrations,
    createRegistration,
    createCheckInCode,
    updateRegistrationStatus,
    updateRegistration,
    reset
  };
}
