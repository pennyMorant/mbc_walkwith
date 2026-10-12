import type { EventRegistration, EventRegistrationStatus, LifePost } from "@mbc/api-contracts";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { computed, ref, watch, type Ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createEventCheckInCode,
  createEventRegistration,
  exportEventRegistrations,
  listEventRegistrations,
  updateEventRegistration,
  updateEventRegistrationStatus
} from "@/core/api/life_posts";
import { downloadTextFile } from "@/core/files/download_text_file";
import {
  eventRegistrationPageCount,
  eventRegistrationPageSize
} from "../life_event_registration_presenters";
import {
  createLifeEventRegistrationWorkspace,
  resetRegistrationCreateForm
} from "../life_event_registration_workspace";

type Translate = (key: string) => string;
type QueryClientLike = {
  invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown>;
};

type UseLifeEventRegistrationsInput = {
  selectedPost: Ref<LifePost | null>;
  canManage: Ref<boolean>;
  queryClient: QueryClientLike;
  t: Translate;
  showToast: (message: string, color?: string) => void;
  nullableTrimmed: (value: string) => string | null;
  syncSelectedPostFromList: () => void;
};

export function useLifeEventRegistrations(
  input: UseLifeEventRegistrationsInput
) {
  const {
    selectedPost,
    canManage,
    queryClient,
    t,
    showToast,
    nullableTrimmed
  } = input;
  const {
    registrationFilters,
    appliedRegistrationFilters,
    registrationPage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog
  } = createLifeEventRegistrationWorkspace();
  const registrationMutationErrorMessage = ref("");

  const registrationListQuery = computed(() => ({
    ...appliedRegistrationFilters.value,
    limit: eventRegistrationPageSize,
    offset: (registrationPage.value - 1) * eventRegistrationPageSize
  }));
  const registrationsQuery = useQuery({
    queryKey: computed(() => [
      "life-post-registrations",
      selectedPost.value?.id,
      registrationListQuery.value
    ]),
    enabled: computed(
      () => canManage.value && Boolean(selectedPost.value?.registrationEnabled)
    ),
    queryFn: () => {
      if (!selectedPost.value) {
        return Promise.resolve({
          items: [] as EventRegistration[],
          total: 0,
          limit: eventRegistrationPageSize,
          offset: 0
        });
      }
      return listEventRegistrations(
        selectedPost.value.id,
        registrationListQuery.value
      );
    }
  });

  const exportRegistrationsMutation = useMutation({
    onMutate: clearRegistrationMutationError,
    mutationFn: () => {
      const post = requireSelected(
        selectedPost.value,
        t("No life post selected.")
      );
      return exportEventRegistrations(post.id);
    },
    onSuccess: (result) => {
      downloadTextFile({
        content: result.csv,
        filename: result.filename,
        contentType: result.contentType
      });
      showToast(t("Event registrations exported."));
    },
    onError: captureRegistrationMutationError
  });

  const createRegistrationMutation = useMutation({
    onMutate: clearRegistrationMutationError,
    mutationFn: () => {
      const post = requireSelected(
        selectedPost.value,
        t("No life post selected.")
      );
      return createEventRegistration(post.id, {
        attendeeName: registrationCreateDialog.attendeeName,
        attendeeEmail: nullableTrimmed(registrationCreateDialog.attendeeEmail),
        partySize: registrationCreateDialog.partySize,
        note: registrationCreateDialog.note
      });
    },
    onSuccess: async () => {
      registrationCreateDialog.show = false;
      resetRegistrationCreateForm(registrationCreateDialog);
      await refreshRegistrationData();
      showToast(t("Registration added."));
    },
    onError: captureRegistrationMutationError
  });

  const createCheckInCodeMutation = useMutation({
    onMutate: clearRegistrationMutationError,
    mutationFn: (request: { rotate?: boolean } = {}) => {
      const post = requireSelected(
        selectedPost.value,
        t("No life post selected.")
      );
      return createEventCheckInCode(post.id, {
        rotate: request.rotate ?? false
      });
    },
    onSuccess: (code) => {
      checkInCodeDialog.code = code;
      checkInCodeDialog.show = true;
      showToast(t("Check-in QR is ready."));
    },
    onError: captureRegistrationMutationError
  });

  const updateRegistrationStatusMutation = useMutation({
    onMutate: clearRegistrationMutationError,
    mutationFn: (request: {
      registrationId: string;
      status: EventRegistrationStatus;
    }) => {
      const post = requireSelected(
        selectedPost.value,
        t("No life post selected.")
      );
      return updateEventRegistrationStatus(
        post.id,
        request.registrationId,
        request.status
      );
    },
    onSuccess: async () => {
      await refreshRegistrationData();
      showToast(t("Registration status updated."));
    },
    onError: captureRegistrationMutationError
  });

  const updateRegistrationMutation = useMutation({
    onMutate: clearRegistrationMutationError,
    mutationFn: () => {
      const post = requireSelected(
        selectedPost.value,
        t("No life post selected.")
      );
      return updateEventRegistration(
        post.id,
        registrationEditDialog.registrationId,
        {
          partySize: registrationEditDialog.partySize,
          note: registrationEditDialog.note
        }
      );
    },
    onSuccess: async () => {
      registrationEditDialog.show = false;
      await refreshRegistrationData();
      showToast(t("Registration updated."));
    },
    onError: captureRegistrationMutationError
  });

  const registrations = computed(
    () => registrationsQuery.data.value?.items ?? []
  );
  const registrationTotal = computed(
    () => registrationsQuery.data.value?.total ?? 0
  );
  const registrationPageCount = computed(() =>
    eventRegistrationPageCount(registrationTotal.value)
  );
  const registrationErrorMessage = computed(() => {
    const queryError = registrationsQuery.error.value;
    return queryError
      ? formatApiErrorMessage(queryError, t("common.error"))
      : registrationMutationErrorMessage.value;
  });

  watch(registrationTotal, () => {
    if (registrationPage.value > registrationPageCount.value) {
      registrationPage.value = registrationPageCount.value;
    }
  });

  function applyRegistrationFilters() {
    const next = {
      status: registrationFilters.status,
      query: registrationFilters.query.trim()
    };
    const unchanged =
      registrationPage.value === 1 &&
      next.status === appliedRegistrationFilters.value.status &&
      next.query === appliedRegistrationFilters.value.query;
    registrationPage.value = 1;
    appliedRegistrationFilters.value = next;
    if (unchanged) {
      void registrationsQuery.refetch();
    }
  }

  function setRegistrationPage(page: number) {
    registrationPage.value = Math.min(
      Math.max(1, page),
      registrationPageCount.value
    );
  }

  function openRegistrationEditor(registration: EventRegistration) {
    registrationEditDialog.registrationId = registration.id;
    registrationEditDialog.attendeeName = registration.attendeeName;
    registrationEditDialog.partySize = registration.partySize;
    registrationEditDialog.note = registration.note;
    registrationEditDialog.show = true;
  }

  function openRegistrationCreator() {
    resetRegistrationCreateForm(registrationCreateDialog);
    registrationCreateDialog.show = true;
  }

  function closeCheckInCodeDialog() {
    checkInCodeDialog.show = false;
  }

  function resetRegistrationWorkspace() {
    registrationFilters.status = "";
    registrationFilters.query = "";
    appliedRegistrationFilters.value = { status: "", query: "" };
    registrationPage.value = 1;
    registrationEditDialog.show = false;
    registrationCreateDialog.show = false;
    checkInCodeDialog.show = false;
    checkInCodeDialog.code = null;
    registrationMutationErrorMessage.value = "";
    exportRegistrationsMutation.reset();
    createRegistrationMutation.reset();
    createCheckInCodeMutation.reset();
    updateRegistrationStatusMutation.reset();
    updateRegistrationMutation.reset();
  }

  async function refreshRegistrationData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["life-post-registrations"] }),
      queryClient.invalidateQueries({ queryKey: ["life-posts"] })
    ]);
    input.syncSelectedPostFromList();
  }

  function clearRegistrationMutationError() {
    registrationMutationErrorMessage.value = "";
  }

  function captureRegistrationMutationError(error: unknown) {
    registrationMutationErrorMessage.value = formatApiErrorMessage(
      error,
      t("common.error")
    );
  }

  return {
    registrationFilters,
    registrationPage,
    registrationPageCount,
    registrationTotal,
    registrationErrorMessage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog,
    registrationsQuery,
    registrations,
    exportRegistrationsMutation,
    createRegistrationMutation,
    createCheckInCodeMutation,
    updateRegistrationStatusMutation,
    updateRegistrationMutation,
    applyRegistrationFilters,
    setRegistrationPage,
    openRegistrationEditor,
    openRegistrationCreator,
    closeCheckInCodeDialog,
    resetRegistrationWorkspace
  };
}
