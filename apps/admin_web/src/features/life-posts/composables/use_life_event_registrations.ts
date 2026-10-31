import type { EventRegistration, LifePost } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, watch, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listEventRegistrations } from "@/core/api/life_posts";
import {
  eventRegistrationPageCount,
  eventRegistrationPageSize
} from "../life_event_registration_presenters";
import {
  createLifeEventRegistrationWorkspace,
  resetRegistrationCreateForm
} from "../life_event_registration_workspace";
import { useLifeEventRegistrationCommands } from "./use_life_event_registration_commands";

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
  const selectedPostId = computed(() => selectedPost.value?.id ?? null);
  const workspaceSessionId = ref(0);

  const registrationListQuery = computed(() => ({
    ...appliedRegistrationFilters.value,
    limit: eventRegistrationPageSize,
    offset: (registrationPage.value - 1) * eventRegistrationPageSize
  }));
  const registrationsQuery = useQuery({
    queryKey: computed(() => [
      "life-post-registrations",
      selectedPostId.value,
      registrationListQuery.value
    ]),
    enabled: computed(
      () => canManage.value && Boolean(selectedPost.value?.registrationEnabled)
    ),
    queryFn: ({ queryKey }) => {
      const [, postId, query] = queryKey as [
        string,
        string | null,
        typeof registrationListQuery.value
      ];
      if (!postId) {
        return Promise.resolve({
          items: [] as EventRegistration[],
          total: 0,
          limit: eventRegistrationPageSize,
          offset: 0
        });
      }
      return listEventRegistrations(postId, query);
    }
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
  const registrationInitialErrorMessage = computed(() =>
    registrationsQuery.data.value === undefined
      ? formatApiErrorMessage(registrationsQuery.error.value, t("common.error"))
      : ""
  );
  const registrationRefreshErrorMessage = computed(() =>
    registrationsQuery.data.value !== undefined
      ? formatApiErrorMessage(registrationsQuery.error.value, t("common.error"))
      : ""
  );
  const commands = useLifeEventRegistrationCommands({
    selectedPost,
    canManage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog,
    t,
    showToast,
    nullableTrimmed,
    workspaceSessionId,
    refreshRegistrationData
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
    workspaceSessionId.value += 1;
    registrationFilters.status = "";
    registrationFilters.query = "";
    appliedRegistrationFilters.value = { status: "", query: "" };
    registrationPage.value = 1;
    registrationEditDialog.show = false;
    registrationCreateDialog.show = false;
    checkInCodeDialog.show = false;
    checkInCodeDialog.code = null;
    commands.reset();
  }

  async function refreshRegistrationData(postId: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["life-post-registrations"] }),
      queryClient.invalidateQueries({ queryKey: ["life-posts"] })
    ]);
    if (selectedPostId.value === postId) input.syncSelectedPostFromList();
  }

  return {
    registrationFilters,
    registrationPage,
    registrationPageCount,
    registrationTotal,
    registrationInitialErrorMessage,
    registrationRefreshErrorMessage,
    registrationCommandErrorMessage: commands.commandErrorMessage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog,
    registrationsQuery,
    registrations,
    exportPending: commands.exportPending,
    createPending: commands.createPending,
    checkInCodePending: commands.checkInCodePending,
    updateStatusPending: commands.updateStatusPending,
    commandPending: commands.commandPending,
    updatePending: commands.updatePending,
    exportRegistrations: commands.exportRegistrations,
    createRegistration: commands.createRegistration,
    createCheckInCode: commands.createCheckInCode,
    updateRegistrationStatus: commands.updateRegistrationStatus,
    updateRegistration: commands.updateRegistration,
    applyRegistrationFilters,
    setRegistrationPage,
    openRegistrationEditor,
    openRegistrationCreator,
    closeCheckInCodeDialog,
    resetRegistrationWorkspace
  };
}
