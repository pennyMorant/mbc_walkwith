<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

type RegistrationSettingsForm = {
  registrationEnabled: boolean;
  registrationCapacity: number | null;
  registrationDeadline: string;
  registrationAllowCancellation: boolean;
  registrationMaxPartySize: number;
};

defineProps<{ form: RegistrationSettingsForm }>();

const emit = defineEmits<{
  updateForm: [patch: Partial<RegistrationSettingsForm>];
}>();

const { t } = useI18n();

function updateBoolean(
  field: "registrationEnabled" | "registrationAllowCancellation",
  value: unknown
) {
  emit("updateForm", { [field]: Boolean(value) });
}

function updateNumber(
  field: "registrationCapacity" | "registrationMaxPartySize",
  value: unknown
) {
  if (field === "registrationCapacity" && (value === null || value === "")) {
    emit("updateForm", { registrationCapacity: null });
    return;
  }
  const number = Number(value);
  if (Number.isFinite(number)) {
    emit("updateForm", { [field]: number });
  }
}

function updateDeadline(value: unknown) {
  emit("updateForm", { registrationDeadline: String(value ?? "") });
}
</script>

<template>
  <v-card class="pa-4 mb-5" variant="outlined">
    <div class="text-subtitle-2 font-weight-bold mb-2">
      {{ t("Event registration settings") }}
    </div>
    <v-switch
      :model-value="form.registrationEnabled"
      :label="t('Enable registration')"
      color="primary"
      density="comfortable"
      inset
      @update:model-value="updateBoolean('registrationEnabled', $event)"
    />
    <v-row v-if="form.registrationEnabled" dense>
      <v-col cols="12" md="6">
        <v-text-field
          :model-value="form.registrationCapacity"
          :label="t('Capacity')"
          type="number"
          min="1"
          density="comfortable"
          variant="outlined"
          @update:model-value="updateNumber('registrationCapacity', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          :model-value="form.registrationMaxPartySize"
          :label="t('Max party size')"
          type="number"
          min="1"
          max="20"
          density="comfortable"
          variant="outlined"
          @update:model-value="updateNumber('registrationMaxPartySize', $event)"
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          :model-value="form.registrationDeadline"
          :label="t('Registration deadline')"
          type="datetime-local"
          density="comfortable"
          variant="outlined"
          @update:model-value="updateDeadline"
        />
      </v-col>
      <v-col cols="12">
        <v-switch
          :model-value="form.registrationAllowCancellation"
          :label="t('Allow cancellation')"
          color="primary"
          density="comfortable"
          inset
          @update:model-value="
            updateBoolean('registrationAllowCancellation', $event)
          "
        />
      </v-col>
    </v-row>
  </v-card>
</template>
