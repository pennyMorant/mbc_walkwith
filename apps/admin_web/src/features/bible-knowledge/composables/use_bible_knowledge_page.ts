import type {
  BibleKnowledgeEntity,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createBibleKnowledgeEntity,
  deleteBibleKnowledgeEntity,
  updateBibleKnowledgeEntity
} from "@/core/api/bible_knowledge";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  bibleKnowledgeEditorContext,
  bibleKnowledgeEntityKey,
  bibleKnowledgeUpdatePayload,
  bibleKnowledgeUpsertPayload,
  canSubmitBibleKnowledgeEntity,
  createBibleKnowledgeEditorForm,
  createBibleKnowledgeSection,
  fillBibleKnowledgeEditorForm,
  moveBibleKnowledgeSection,
  resetBibleKnowledgeEditorForm,
  sameBibleKnowledgeEditorContext,
  type BibleKnowledgeEditorContext,
  type BibleKnowledgeEntityKey
} from "../bible_knowledge_workspace_models";
import { useBibleKnowledgeQuery } from "./use_bible_knowledge_query";

type SaveIntent =
  | {
      type: "create";
      context: BibleKnowledgeEditorContext;
      payload: BibleKnowledgeUpsertRequest;
    }
  | {
      type: "update";
      context: BibleKnowledgeEditorContext;
      key: BibleKnowledgeEntityKey;
      payload: BibleKnowledgeUpdateRequest;
    };

type DeleteIntent = {
  context: BibleKnowledgeEditorContext;
  key: BibleKnowledgeEntityKey;
};

export function useBibleKnowledgePage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const drawer = ref(false);
  const selectedEntity = ref<BibleKnowledgeEntity | null>(null);
  const commandErrorMessage = ref("");
  const form = reactive(createBibleKnowledgeEditorForm());
  const query = useBibleKnowledgeQuery();
  const canManage = computed(() => authStore.can("bible_knowledge:update"));
  const commandPending = computed(
    () => saveMutation.isPending.value || deleteMutation.isPending.value
  );
  const canSave = computed(
    () =>
      canSubmitBibleKnowledgeEntity(canManage.value, form) &&
      !commandPending.value
  );

  const initialErrorMessage = queryErrorMessage(
    query.initialError,
    "common.error"
  );
  const refreshErrorMessage = queryErrorMessage(
    query.refreshError,
    "bibleKnowledge.libraryRefreshFailed"
  );

  const saveMutation = useMutation({
    mutationFn: (intent: SaveIntent) => {
      if (intent.type === "create") {
        return createBibleKnowledgeEntity(intent.payload);
      }
      return updateBibleKnowledgeEntity(intent.key.id, intent.payload, {
        locale: intent.key.locale,
        translationId: intent.key.translationId
      });
    },
    onSuccess: async (entity, intent) => {
      if (commandTargetsCurrentEditor(intent.context)) openEntity(entity);
      await invalidateDirectory();
    },
    onError: (error, intent) => {
      if (commandTargetsCurrentEditor(intent.context)) {
        commandErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (intent: DeleteIntent) =>
      deleteBibleKnowledgeEntity(intent.key.id, {
        locale: intent.key.locale,
        translationId: intent.key.translationId
      }),
    onSuccess: async (_result, intent) => {
      if (commandTargetsCurrentEditor(intent.context)) {
        drawer.value = false;
        selectedEntity.value = null;
        resetBibleKnowledgeEditorForm(form);
      }
      await invalidateDirectory();
    },
    onError: (error, intent) => {
      if (commandTargetsCurrentEditor(intent.context)) {
        commandErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  function queryErrorMessage(
    error: { value: unknown },
    fallbackKey: string
  ) {
    return computed(() =>
      error.value
        ? formatApiErrorMessage(error.value, t(fallbackKey))
        : ""
    );
  }

  function currentEditorContext() {
    return bibleKnowledgeEditorContext(
      selectedEntity.value,
      query.appliedFilters.value
    );
  }

  function commandTargetsCurrentEditor(context: BibleKnowledgeEditorContext) {
    return (
      drawer.value &&
      sameBibleKnowledgeEditorContext(currentEditorContext(), context)
    );
  }

  function openEntity(entity: BibleKnowledgeEntity) {
    commandErrorMessage.value = "";
    selectedEntity.value = entity;
    fillBibleKnowledgeEditorForm(form, entity);
    drawer.value = true;
  }

  function newEntity() {
    commandErrorMessage.value = "";
    selectedEntity.value = null;
    resetBibleKnowledgeEditorForm(form);
    drawer.value = true;
  }

  function saveEntity() {
    if (!canSave.value || commandPending.value) return;
    commandErrorMessage.value = "";
    const context = currentEditorContext();
    try {
      if (!selectedEntity.value) {
        saveMutation.mutate({
          type: "create",
          context,
          payload: bibleKnowledgeUpsertPayload(
            form,
            query.appliedFilters.value,
            t("Verse aliases JSON is invalid.")
          )
        });
        return;
      }
      saveMutation.mutate({
        type: "update",
        context,
        key: bibleKnowledgeEntityKey(selectedEntity.value),
        payload: bibleKnowledgeUpdatePayload(
          form,
          t("Verse aliases JSON is invalid.")
        )
      });
    } catch (error) {
      commandErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }

  function deleteCurrentEntity() {
    const entity = selectedEntity.value;
    if (!entity || !canManage.value || commandPending.value) return;
    commandErrorMessage.value = "";
    deleteMutation.mutate({
      context: currentEditorContext(),
      key: bibleKnowledgeEntityKey(entity)
    });
  }

  function invalidateDirectory() {
    return queryClient.invalidateQueries({ queryKey: ["bible-knowledge"] });
  }

  return {
    addSection: () => form.sections.push(createBibleKnowledgeSection()),
    applyFilters: query.applyFilters,
    canManage,
    canSave,
    commandErrorMessage,
    deleteCurrentEntity,
    deleteMutation,
    drawer,
    entities: query.entities,
    entitiesQuery: query.entitiesQuery,
    filters: query.filters,
    form,
    initialErrorMessage,
    moveSection: (index: number, direction: -1 | 1) =>
      moveBibleKnowledgeSection(form.sections, index, direction),
    newEntity,
    openEntity,
    refreshErrorMessage,
    removeSection: (index: number) => form.sections.splice(index, 1),
    saveEntity,
    saveMutation,
    selectedEntity,
    t
  };
}
