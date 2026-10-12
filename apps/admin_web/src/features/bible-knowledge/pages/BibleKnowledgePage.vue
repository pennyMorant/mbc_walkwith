<script setup lang="ts">
import type {
  BibleKnowledgeEntity,
  BibleKnowledgeSection,
  BibleKnowledgeEntityType,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createBibleKnowledgeEntity,
  deleteBibleKnowledgeEntity,
  listBibleKnowledge,
  updateBibleKnowledgeEntity
} from "@/core/api/bible_knowledge";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import BibleKnowledgeEntityListCard from "../components/BibleKnowledgeEntityListCard.vue";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const drawer = ref(false);
const selectedEntity = ref<BibleKnowledgeEntity | null>(null);

const filters = reactive({
  query: "",
  type: "" as BibleKnowledgeEntityType | "",
  status: "" as BibleKnowledgeEntity["status"] | "",
  locale: "en",
  translationId: "web" as "web" | "cuvs" | "cuvt"
});

const form = reactive({
  id: "",
  type: "person" as BibleKnowledgeEntityType,
  name: "",
  category: "",
  summary: "",
  description: "",
  sections: [] as BibleKnowledgeSection[],
  aliasesText: "",
  verseAliasesText: "{}",
  status: "draft" as BibleKnowledgeEntity["status"]
});

const activeFilters = computed(() => ({ ...filters, limit: 50 }));
const entitiesQuery = useQuery({
  queryKey: ["bible-knowledge", activeFilters],
  queryFn: () => listBibleKnowledge(activeFilters.value)
});
const canManageKnowledge = computed(() =>
  authStore.can("bible_knowledge:update")
);

const createMutation = useMutation({
  mutationFn: () => {
    if (!canManageKnowledge.value || !canSave.value) {
      throw new Error(t("Bible knowledge update access required"));
    }
    return createBibleKnowledgeEntity(buildUpsertPayload());
  },
  onSuccess: async (entity) => {
    openEntity(entity);
    await queryClient.invalidateQueries({ queryKey: ["bible-knowledge"] });
  }
});

const updateMutation = useMutation({
  mutationFn: () => {
    const entity = requireSelected(
      selectedEntity.value,
      t("No Bible knowledge entity selected.")
    );
    if (!canManageKnowledge.value || !canSave.value) {
      throw new Error(t("Bible knowledge update access required"));
    }
    return updateBibleKnowledgeEntity(
      entity.id,
      buildUpdatePayload(),
      { locale: filters.locale, translationId: filters.translationId }
    );
  },
  onSuccess: async (entity) => {
    openEntity(entity);
    await queryClient.invalidateQueries({ queryKey: ["bible-knowledge"] });
  }
});

const deleteMutation = useMutation({
  mutationFn: async () => {
    const entity = requireSelected(
      selectedEntity.value,
      t("No Bible knowledge entity selected.")
    );
    if (!canManageKnowledge.value) {
      throw new Error(t("Bible knowledge update access required"));
    }
    await deleteBibleKnowledgeEntity(entity.id, {
      locale: filters.locale,
      translationId: filters.translationId
    });
  },
  onSuccess: async () => {
    drawer.value = false;
    selectedEntity.value = null;
    resetForm();
    await queryClient.invalidateQueries({ queryKey: ["bible-knowledge"] });
  }
});

const entities = computed(() => entitiesQuery.data.value ?? []);
const canSave = computed(
  () =>
    form.id.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.category.trim().length > 0
);
const entityMutationErrorMessage = computed(() =>
  formatApiErrorMessage(
    createMutation.error.value ||
      updateMutation.error.value ||
      deleteMutation.error.value,
    t("common.error")
  )
);

function openEntity(entity: BibleKnowledgeEntity) {
  selectedEntity.value = entity;
  form.id = entity.id;
  form.type = entity.type;
  form.name = entity.name;
  form.category = entity.category;
  form.summary = entity.summary;
  form.description = entity.description;
  form.sections = entity.sections.length > 0
    ? entity.sections.map((section) => ({ ...section }))
    : [
        {
          type: "overview",
          title: "Overview",
          body: entity.description
        }
      ];
  form.aliasesText = entity.aliases.join("\n");
  form.verseAliasesText = JSON.stringify(entity.verseAliases, null, 2);
  form.status = entity.status;
  drawer.value = true;
}

function newEntity() {
  selectedEntity.value = null;
  resetForm();
  drawer.value = true;
}

function resetForm() {
  form.id = "";
  form.type = "person";
  form.name = "";
  form.category = "";
  form.summary = "";
  form.description = "";
  form.sections = [
    {
      type: "overview",
      title: "Overview",
      body: ""
    }
  ];
  form.aliasesText = "";
  form.verseAliasesText = "{}";
  form.status = "draft";
}

function addSection() {
  form.sections.push({
    type: "overview",
    title: "Overview",
    body: ""
  });
}

function removeSection(index: number) {
  form.sections.splice(index, 1);
}

function moveSection(index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= form.sections.length) {
    return;
  }
  const current = form.sections[index];
  const next = form.sections[nextIndex];
  if (!current || !next) {
    return;
  }
  form.sections[index] = next;
  form.sections[nextIndex] = current;
}

function cleanedSections() {
  return form.sections
    .map((section) => ({
      type: section.type.trim() || "overview",
      title: section.title.trim() || "Overview",
      body: section.body.trim()
    }))
    .filter((section) => section.body.length > 0);
}

function aliasesFromText(value: string) {
  return value
    .split(/\n|,/)
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function buildUpsertPayload(): BibleKnowledgeUpsertRequest {
  return {
    id: form.id.trim(),
    type: form.type,
    locale: filters.locale.trim() || "en",
    translationId: filters.translationId,
    name: form.name.trim(),
    category: form.category.trim(),
    summary: form.summary.trim(),
    description: form.description.trim(),
    sections: cleanedSections(),
    aliases: aliasesFromText(form.aliasesText),
    verseAliases: parseVerseAliases(form.verseAliasesText),
    status: form.status
  };
}

function buildUpdatePayload(): BibleKnowledgeUpdateRequest {
  const { id: _id, locale: _locale, translationId: _translationId, ...payload } =
    buildUpsertPayload();
  return payload;
}

function parseVerseAliases(value: string): Record<string, string[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value.trim() || "{}");
  } catch {
    throw new Error(t("Verse aliases JSON is invalid."));
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([verseId, aliases]) => [
      verseId,
      Array.isArray(aliases)
        ? aliases
            .filter((alias): alias is string => typeof alias === "string")
            .map((alias) => alias.trim())
            .filter(Boolean)
        : []
    ])
  );
}

function saveEntity() {
  if (!canManageKnowledge.value || !canSave.value) {
    return;
  }
  if (selectedEntity.value) {
    updateMutation.mutate();
    return;
  }
  createMutation.mutate();
}

function deleteCurrentEntity() {
  if (
    !selectedEntity.value ||
    !canManageKnowledge.value ||
    deleteMutation.isPending.value
  ) {
    return;
  }
  deleteMutation.mutate();
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.bibleKnowledge") }}</div>
        <div class="page-subtitle">
          {{ t("bible.entitySubtitle") }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="entitiesQuery.isFetching.value"
          @click="entitiesQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="canManageKnowledge"
          color="primary"
          @click="newEntity"
        >
          {{ t("New entity") }}
        </v-btn>
      </div>
    </div>

    <BibleKnowledgeEntityListCard
      :filters="filters"
      :entities="entities"
      :is-pending="entitiesQuery.isPending.value"
      :error="entitiesQuery.error.value"
      :refetch="entitiesQuery.refetch"
      :open-entity="openEntity"
    />

    <v-navigation-drawer v-model="drawer" location="right" temporary width="560">
      <div class="pa-5">
        <div class="text-h6 font-weight-bold">
          {{ selectedEntity ? selectedEntity.name : t("New entity") }}
        </div>
        <v-form
          class="mt-5"
          @submit.prevent="saveEntity"
        >
          <v-text-field
            v-model="form.id"
            :label="t('ID')"
            density="comfortable"
            variant="outlined"
            :readonly="!!selectedEntity"
          />
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.type"
                :label="t('Type')"
                :items="optionItems(['person', 'place'])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="optionItems([
                  'draft',
                  'processing',
                  'needs_review',
                  'published',
                  'archived',
                  'failed'
                ])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="form.name"
            :label="t('Name')"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="form.category"
            :label="t('Category')"
            density="comfortable"
            variant="outlined"
          />
          <v-textarea
            v-model="form.summary"
            :label="t('Summary')"
            rows="3"
            density="comfortable"
            variant="outlined"
          />
          <v-textarea
            v-model="form.description"
            :label="t('Description')"
            rows="5"
            density="comfortable"
            variant="outlined"
          />
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-2 font-weight-bold">
                {{ t("Sections") }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ t("bible.sectionsSubtitle") }}
              </div>
            </div>
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              @click="addSection"
            >
              {{ t("Add") }}
            </v-btn>
          </div>
          <v-card
            v-for="(section, index) in form.sections"
            :key="index"
            class="mb-3"
            variant="outlined"
          >
            <div class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <div class="text-body-2 font-weight-bold">
                  {{ t("Section") }} {{ index + 1 }}
                </div>
                <div class="d-flex ga-1">
                  <v-btn
                    icon="mdi-arrow-up"
                    size="x-small"
                    variant="text"
                    :disabled="index === 0"
                    :aria-label="t('Move section up')"
                    @click="moveSection(index, -1)"
                  />
                  <v-btn
                    icon="mdi-arrow-down"
                    size="x-small"
                    variant="text"
                    :disabled="index === form.sections.length - 1"
                    :aria-label="t('Move section down')"
                    @click="moveSection(index, 1)"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    :aria-label="t('Remove section')"
                    @click="removeSection(index)"
                  />
                </div>
              </div>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="section.type"
                    :label="t('Type')"
                    density="compact"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="section.title"
                    :label="t('Title')"
                    density="compact"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
              <v-textarea
                v-model="section.body"
                :label="t('Body')"
                rows="4"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
          </v-card>
          <v-textarea
            v-model="form.aliasesText"
            :label="t('Aliases')"
            rows="4"
            density="comfortable"
            variant="outlined"
          />
          <v-textarea
            v-model="form.verseAliasesText"
            :label="t('Verse aliases JSON')"
            rows="5"
            density="comfortable"
            variant="outlined"
          />

          <v-alert
            v-if="entityMutationErrorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ entityMutationErrorMessage }}
          </v-alert>

          <div class="d-flex justify-space-between ga-3">
            <v-btn
              v-if="selectedEntity"
              color="error"
              variant="tonal"
              :disabled="!canManageKnowledge || deleteMutation.isPending.value"
              :loading="deleteMutation.isPending.value"
              @click="deleteCurrentEntity"
            >
              {{ t("Delete") }}
            </v-btn>
            <div v-else />
            <v-btn
              type="submit"
              color="primary"
              :disabled="
                !canSave ||
                !canManageKnowledge ||
                createMutation.isPending.value ||
                updateMutation.isPending.value
              "
              :loading="
                createMutation.isPending.value || updateMutation.isPending.value
              "
            >
              {{ t("common.save") }}
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-navigation-drawer>
  </div>
</template>
