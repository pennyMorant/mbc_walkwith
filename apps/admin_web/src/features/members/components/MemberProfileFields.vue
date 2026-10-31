<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

import {
  isValidOptionalYear,
  type MemberEditorForm
} from "../member_workspace_models";

defineProps<{
  form: MemberEditorForm;
  disabled: boolean;
}>();

const { optionItems, t } = useI18n();
const yearRules = [
  (value: string) => isValidOptionalYear(value) || t("members.yearInvalid")
];
</script>

<template>
  <div class="text-subtitle-2 font-weight-bold mb-2">
    {{ t("members.basicDetails") }}
  </div>
  <v-text-field
    v-model="form.email"
    :label="t('Email')"
    type="email"
    autocomplete="off"
    density="comfortable"
    variant="outlined"
    :disabled="disabled"
  />
  <v-text-field
    v-model="form.displayName"
    :label="t('Display name')"
    density="comfortable"
    variant="outlined"
    :disabled="disabled"
  />
  <v-text-field
    v-model="form.phone"
    :label="t('Phone')"
    type="tel"
    density="comfortable"
    variant="outlined"
    :disabled="disabled"
  />
  <v-textarea
    v-model="form.address"
    :label="t('Address')"
    rows="2"
    auto-grow
    density="comfortable"
    variant="outlined"
    :disabled="disabled"
  />
  <v-row dense>
    <v-col cols="12" md="6">
      <v-select
        v-model="form.status"
        :label="t('Status')"
        :items="optionItems(['active', 'pending', 'inactive', 'blocked'])"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-select
        v-model="form.roles"
        :label="t('Roles')"
        :items="optionItems(['member', 'leader', 'pastor'])"
        multiple
        chips
        closable-chips
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
  </v-row>
  <v-row dense>
    <v-col cols="12" md="6">
      <v-select
        v-model="form.appLocale"
        :label="t('App locale')"
        :items="optionItems(['en', 'es', 'zh-Hans', 'zh-Hant'])"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="form.fellowshipGroupId"
        :label="t('Fellowship group')"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
  </v-row>

  <div class="text-subtitle-2 font-weight-bold mb-2">
    {{ t("members.churchJourney") }}
  </div>
  <v-row dense>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.faithStartYear"
        :label="t('Faith start year')"
        inputmode="numeric"
        maxlength="4"
        :rules="yearRules"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.baptizedYear"
        :label="t('Baptized year')"
        inputmode="numeric"
        maxlength="4"
        :rules="yearRules"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
  </v-row>
  <v-text-field
    v-model="form.joinedChurchAt"
    :label="t('Joined church at')"
    type="date"
    density="comfortable"
    variant="outlined"
    :disabled="disabled"
  />

  <div class="text-subtitle-2 font-weight-bold mb-2">
    {{ t("members.emergencyContact") }}
  </div>
  <v-row dense>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.emergencyContactName"
        :label="t('Emergency contact name')"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.emergencyContactPhone"
        :label="t('Emergency contact phone')"
        type="tel"
        density="comfortable"
        variant="outlined"
        :disabled="disabled"
      />
    </v-col>
  </v-row>
</template>
