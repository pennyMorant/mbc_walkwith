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
  updateBibleKnowledgeEntity,
  type BibleKnowledgeListFilters
} from "@/core/api/bible_knowledge";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import BibleKnowledgeEntityEditor from "../components/BibleKnowledgeEntityEditor.vue";
import BibleKnowledgeEntityListCard from "../components/BibleKnowledgeEntityListCard.vue";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { t } = useI18n();
const drawer = ref(false);
const selectedEntity = ref<BibleKnowledgeEntity | null>(null);

const filters = reactive({
  query: "",
  type: "" as BibleKnowledgeEntityType | "",
  status: "" as BibleKnowledgeEntity["status"] | "",
  locale: "en",
  translationId: "web" as "web" | "cuvs" | "cuvt"
});
const appliedFilters = ref<BibleKnowledgeListFilters>({
  query: "",
  type: "",
  status: "",
  locale: "en",
  translationId: "web",
  limit: 50
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

const entitiesQuery = useQuery({
  queryKey: ["bible-knowledge", appliedFilters],
  queryFn: () => listBibleKnowledge(appliedFilters.value)
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
      { locale: entity.locale, translationId: entity.translationId }
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
      locale: entity.locale,
      translationId: entity.translationId
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
const entitiesErrorMessage = computed(() =>
  formatApiErrorMessage(entitiesQuery.error.value, t("common.error"))
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
    locale: appliedFilters.value.locale?.trim() || "en",
    translationId: appliedFilters.value.translationId ?? "web",
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

function applyFilters() {
  const nextFilters: BibleKnowledgeListFilters = {
    query: filters.query,
    type: filters.type,
    status: filters.status,
    locale: filters.locale.trim() || "en",
    translationId: filters.translationId,
    limit: 50
  };
  if (JSON.stringify(nextFilters) === JSON.stringify(appliedFilters.value)) {
    void entitiesQuery.refetch();
    return;
  }
  appliedFilters.value = nextFilters;
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
    <AdminPageHeader :title="t('nav.bibleKnowledge')" :subtitle="t('bible.entitySubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="entitiesQuery.isFetching.value"
          @click="entitiesQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn
          v-if="canManageKnowledge"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newEntity"
        >
          {{ t("New entity") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <BibleKnowledgeEntityListCard
      v-model="filters"
      :entities="entities"
      :is-pending="entitiesQuery.isPending.value"
      :is-fetching="entitiesQuery.isFetching.value"
      :error-message="entitiesErrorMessage"
      @apply-filters="applyFilters"
      @retry="entitiesQuery.refetch()"
      @open-entity="openEntity"
    />

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="560">
      <div class="pa-5">
        <BibleKnowledgeEntityEditor
          v-model="form"
          :selected-entity="selectedEntity"
          :can-manage="canManageKnowledge"
          :can-save="canSave"
          :saving="createMutation.isPending.value || updateMutation.isPending.value"
          :deleting="deleteMutation.isPending.value"
          :error-message="entityMutationErrorMessage"
          @add-section="addSection"
          @move-section="moveSection"
          @remove-section="removeSection"
          @save="saveEntity"
          @delete="deleteCurrentEntity"
        />
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>
