<script setup lang="ts">
import type {
  SermonDiscussionGuide,
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionGuideStatus,
  SermonDiscussionAudienceType,
  SermonDiscussionResponse
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createSermonDiscussionGuide,
  hideSermonDiscussionResponse,
  listSermonDiscussionGuides,
  listSermonDiscussionResponses,
  sermonDiscussionAudienceTypeOptions,
  sermonDiscussionGuideStatusOptions,
  sermonDiscussionQuestionTypeOptions,
  updateSermonDiscussionGuide
} from "@/core/api/sermon_discussion_guides";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import ContentLocalizationCard from "../../content-localization/components/ContentLocalizationCard.vue";
import SermonDiscussionGuideEditor from "../components/SermonDiscussionGuideEditor.vue";
import SermonDiscussionResponsesPanel from "../components/SermonDiscussionResponsesPanel.vue";
import { createSermonDiscussionLocalIdFactory } from "../sermon_discussion_guide_workspace_models";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();

const selectedGuide = ref<SermonDiscussionGuide | null>(null);
const activePanel = ref<"guide" | "responses">("guide");
const hidingResponseId = ref<string | null>(null);
const mutationErrorMessage = ref("");
const nextLocalId = createSermonDiscussionLocalIdFactory();

const filters = reactive({
  query: "",
  sermonId: "",
  status: "" as SermonDiscussionGuideStatus | "",
  audienceType: "" as SermonDiscussionAudienceType | ""
});

const responseFilters = reactive({
  userType: "" as "member" | "external" | ""
});

const guideForm = reactive<SermonDiscussionGuideCreateRequest>({
  sermonId: "",
  sourceLocale: "zh-Hans",
  title: "",
  summary: "",
  status: "draft",
  audienceType: "public",
  audienceId: null,
  questions: [],
  actionSteps: [],
  prayerPrompts: [],
  generatedMetadata: {}
});

const guidesQuery = useQuery({
  queryKey: computed(() => ["sermon-discussion-guides", { ...filters }]),
  queryFn: () => listSermonDiscussionGuides({ ...filters, limit: 100 })
});

const responsesQuery = useQuery({
  queryKey: computed(() => [
    "sermon-discussion-responses",
    selectedGuide.value?.id,
    { ...responseFilters }
  ]),
  enabled: computed(() => Boolean(selectedGuide.value)),
  queryFn: () =>
    selectedGuide.value
      ? listSermonDiscussionResponses(selectedGuide.value.id, {
          ...responseFilters,
          limit: 100
        })
      : Promise.resolve([] as SermonDiscussionResponse[])
});

const saveGuideMutation = useMutation({
  onMutate: () => {
    clearMutationError();
    return { guideId: selectedGuide.value?.id ?? null };
  },
  mutationFn: () => {
    if (!canManage.value || !canSaveGuide.value) {
      throw new Error(t("Sermon guide manage access required"));
    }
    const payload = buildGuideCreatePayload();
    if (!selectedGuide.value) {
      return createSermonDiscussionGuide(payload);
    }
    const { sermonId: _sermonId, ...updatePayload } = payload;
    return updateSermonDiscussionGuide(selectedGuide.value.id, {
      ...updatePayload,
      expectedRevision: selectedGuide.value.revision
    });
  },
  onSuccess: async (guide) => {
    selectGuide(guide);
    await queryClient.invalidateQueries({
      queryKey: ["sermon-discussion-guides"]
    });
    await queryClient.invalidateQueries({
      queryKey: ["sermon-discussion-responses"]
    });
  },
  onError: (error, _variables, context) => {
    if (context?.guideId === (selectedGuide.value?.id ?? null)) {
      captureMutationError(error);
    }
  }
});

const hideResponseMutation = useMutation({
  onMutate: () => {
    clearMutationError();
    return { guideId: selectedGuide.value?.id ?? null };
  },
  mutationFn: (responseId: string) => {
    if (!canManage.value || !responseId) {
      throw new Error(t("Sermon guide manage access required"));
    }
    hidingResponseId.value = responseId;
    return hideSermonDiscussionResponse(responseId);
  },
  onSettled: () => {
    hidingResponseId.value = null;
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: ["sermon-discussion-responses"]
    });
  },
  onError: (error, _responseId, context) => {
    if (context?.guideId === (selectedGuide.value?.id ?? null)) {
      captureMutationError(error);
    }
  }
});

const guides = computed(() => guidesQuery.data.value ?? []);
const responses = computed(() => responsesQuery.data.value ?? []);
const canManage = computed(() => authStore.can("sermon_guides:manage"));
const availableGuideStatusOptions = computed<SermonDiscussionGuideStatus[]>(
  () => {
    if (!selectedGuide.value) {
      return ["draft", "review"];
    }
    return {
      draft: ["draft", "review", "archived"],
      review: ["draft", "review", "published", "archived"],
      published: ["published", "review", "archived"],
      archived: ["archived", "draft"]
    }[selectedGuide.value.status] as SermonDiscussionGuideStatus[];
  }
);
const guideContentLocked = computed(
  () =>
    selectedGuide.value != null &&
    (selectedGuide.value.status === "published" ||
      selectedGuide.value.status === "archived") &&
    guideForm.status === selectedGuide.value.status
);
const canSaveGuide = computed(
  () =>
    canManage.value &&
    guideForm.title.trim().length > 0 &&
    (Boolean(selectedGuide.value) || guideForm.sermonId.trim().length > 0) &&
    (guideForm.audienceType === "public" ||
      Boolean(guideForm.audienceId?.trim()))
);
const queryErrorMessage = computed(() => {
  const error = guidesQuery.error.value || responsesQuery.error.value;
  return error ? formatApiErrorMessage(error, t("common.error")) : "";
});
const errorMessage = computed(
  () => queryErrorMessage.value || mutationErrorMessage.value
);

function selectGuide(guide: SermonDiscussionGuide) {
  clearMutationError();
  selectedGuide.value = guide;
  guideForm.sermonId = guide.sermonId;
  guideForm.sourceLocale = guide.sourceLocale;
  guideForm.title = guide.title;
  guideForm.summary = guide.summary;
  guideForm.status = guide.status;
  guideForm.audienceType = guide.audienceType;
  guideForm.audienceId = guide.audienceId;
  guideForm.questions = guide.questions.map((question, index) => ({
    ...question,
    sortOrder: question.sortOrder ?? index
  }));
  guideForm.actionSteps = guide.actionSteps.map((action, index) => ({
    ...action,
    sortOrder: action.sortOrder ?? index
  }));
  guideForm.prayerPrompts = [...guide.prayerPrompts];
  guideForm.generatedMetadata = { ...guide.generatedMetadata };
}

function newGuide() {
  clearMutationError();
  selectedGuide.value = null;
  activePanel.value = "guide";
  guideForm.sermonId = "";
  guideForm.sourceLocale = "zh-Hans";
  guideForm.title = "";
  guideForm.summary = "";
  guideForm.status = "draft";
  guideForm.audienceType = "public";
  guideForm.audienceId = null;
  guideForm.questions = [];
  guideForm.actionSteps = [];
  guideForm.prayerPrompts = [];
  guideForm.generatedMetadata = {};
}

function addQuestion() {
  const index = guideForm.questions.length;
  guideForm.questions.push({
    id: nextLocalId("question"),
    type: "application",
    prompt: "",
    sortOrder: index,
    startSeconds: null
  });
}

function addActionStep() {
  const index = guideForm.actionSteps.length;
  guideForm.actionSteps.push({
    id: nextLocalId("action"),
    title: "",
    description: "",
    sortOrder: index
  });
}

function addPrayerPrompt() {
  guideForm.prayerPrompts.push("");
}

function removeQuestion(index: number) {
  guideForm.questions.splice(index, 1);
}

function removeActionStep(index: number) {
  guideForm.actionSteps.splice(index, 1);
}

function removePrayerPrompt(index: number) {
  guideForm.prayerPrompts.splice(index, 1);
}

function buildGuideCreatePayload(): SermonDiscussionGuideCreateRequest {
  return {
    sermonId: guideForm.sermonId.trim(),
    sourceLocale: guideForm.sourceLocale,
    title: guideForm.title.trim(),
    summary: guideForm.summary.trim(),
    status: guideForm.status,
    audienceType: guideForm.audienceType,
    audienceId:
      guideForm.audienceType === "public"
        ? null
        : guideForm.audienceId?.trim() || null,
    questions: guideForm.questions
      .map((question, index) => ({
        id: question.id.trim() || nextLocalId("question"),
        type: question.type,
        prompt: question.prompt.trim(),
        sortOrder: index,
        startSeconds: question.startSeconds
      }))
      .filter((question) => question.prompt.length > 0),
    actionSteps: guideForm.actionSteps
      .map((action, index) => ({
        id: action.id.trim() || nextLocalId("action"),
        title: action.title.trim(),
        description: action.description.trim(),
        sortOrder: index
      }))
      .filter((action) => action.title.length > 0),
    prayerPrompts: guideForm.prayerPrompts
      .map((prompt) => prompt.trim())
      .filter(Boolean),
    generatedMetadata: guideForm.generatedMetadata
  };
}

function guideStatusColor(status: SermonDiscussionGuideStatus) {
  return {
    draft: "grey",
    review: "warning",
    published: "success",
    archived: "secondary"
  }[status];
}

function clearMutationError() {
  mutationErrorMessage.value = "";
}

function captureMutationError(error: unknown) {
  mutationErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
}

function saveGuide() {
  if (!canSaveGuide.value || saveGuideMutation.isPending.value) {
    return;
  }
  saveGuideMutation.mutate();
}

function hideResponse(responseId: string) {
  if (!canManage.value || hidingResponseId.value || !responseId) {
    return;
  }
  hideResponseMutation.mutate(responseId);
}
</script>

<template>
  <div>
    <div
      class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
    >
      <div>
        <div class="page-title">{{ t("nav.sermonGuides") }}</div>
        <div class="page-subtitle">
          {{ t("sermonGuides.subtitle") }}
        </div>
      </div>
      <v-btn
        v-if="canManage"
        color="primary"
        prepend-icon="mdi-plus"
        @click="newGuide"
      >
        {{ t("New discussion guide") }}
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card class="mt-5" variant="outlined">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="guidesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.sermonId"
              :label="t('Sermon ID')"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="guidesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :items="optionItems(['', ...sermonDiscussionGuideStatusOptions])"
              :label="t('Status')"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="guidesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.audienceType"
              :items="optionItems(['', ...sermonDiscussionAudienceTypeOptions])"
              :label="t('Audience')"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="guidesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn block variant="tonal" @click="guidesQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <v-card variant="outlined">
          <v-list lines="three">
            <v-list-item v-if="guidesQuery.isPending.value">
              <v-progress-linear color="primary" indeterminate />
            </v-list-item>
            <v-list-item v-else-if="guides.length === 0">
              {{ t("No discussion guides match the current filters.") }}
            </v-list-item>
            <v-list-item
              v-for="guide in guides"
              :key="guide.id"
              :active="selectedGuide?.id === guide.id"
              @click="selectGuide(guide)"
            >
              <template #title>
                <div class="font-weight-bold">{{ guide.title }}</div>
              </template>
              <template #subtitle>
                <div class="text-caption text-medium-emphasis">
                  {{ guide.sermonId }}
                </div>
                <div class="d-flex align-center flex-wrap ga-2 mt-1">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="guideStatusColor(guide.status)"
                  >
                    {{ t(guide.status) }}
                  </v-chip>
                  <v-chip size="x-small" variant="tonal">
                    {{ t(guide.audienceType) }}
                  </v-chip>
                  <span class="text-caption">
                    {{ guide.questions.length }} {{ t("questions") }}
                  </span>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <v-card-title>
            {{ selectedGuide?.title || t("Discussion guide") }}
          </v-card-title>
          <v-card-subtitle>
            {{
              selectedGuide
                ? `${t("Sermon ID")}: ${selectedGuide.sermonId}`
                : t("Create a guide linked to a sermon record.")
            }}
          </v-card-subtitle>
          <v-card-text>
            <v-btn-toggle
              v-model="activePanel"
              class="mb-5"
              density="comfortable"
              mandatory
            >
              <v-btn value="guide">{{ t("Guide") }}</v-btn>
              <v-btn value="responses">{{ t("Responses") }}</v-btn>
            </v-btn-toggle>

            <SermonDiscussionGuideEditor
              v-if="activePanel === 'guide'"
              :audience-type-options="sermonDiscussionAudienceTypeOptions"
              :can-manage="canManage"
              :can-save-guide="canSaveGuide"
              :content-locked="guideContentLocked"
              :form="guideForm"
              :is-editing="Boolean(selectedGuide)"
              :question-type-options="sermonDiscussionQuestionTypeOptions"
              :saving="saveGuideMutation.isPending.value"
              :status-options="availableGuideStatusOptions"
              @add-action-step="addActionStep"
              @add-prayer-prompt="addPrayerPrompt"
              @add-question="addQuestion"
              @remove-action-step="removeActionStep"
              @remove-prayer-prompt="removePrayerPrompt"
              @remove-question="removeQuestion"
              @save-guide="saveGuide"
            />

            <ContentLocalizationCard
              v-if="activePanel === 'guide' && selectedGuide"
              resource-type="sermon_discussion_guide"
              :resource-id="selectedGuide.id"
              :revision="selectedGuide.revision"
              :fields="{ title: guideForm.title, ...(guideForm.summary ? { summary: guideForm.summary } : {}) }"
              :can-edit="canManage"
              :can-use-ai="authStore.can('ai:use')"
              :source-locale="guideForm.sourceLocale"
              @update:source-locale="guideForm.sourceLocale = $event"
            />

            <SermonDiscussionResponsesPanel
              v-else
              :can-manage="canManage"
              :filters="responseFilters"
              :hiding-response-id="hidingResponseId"
              :pending="Boolean(selectedGuide) && responsesQuery.isFetching.value"
              :responses="responses"
              :selected-guide="selectedGuide"
              @hide-response="hideResponse"
              @refresh="responsesQuery.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
