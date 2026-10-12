import type {
  EventCheckInCode,
  EventRegistrationStatus
} from "@mbc/api-contracts";
import { reactive, ref } from "vue";

export type RegistrationFilters = {
  status: EventRegistrationStatus | "";
  query: string;
};

export type RegistrationEditDialog = {
  show: boolean;
  registrationId: string;
  attendeeName: string;
  partySize: number;
  note: string;
};

export type RegistrationCreateDialog = {
  show: boolean;
  attendeeName: string;
  attendeeEmail: string;
  partySize: number;
  note: string;
};

export type CheckInCodeDialog = {
  show: boolean;
  code: EventCheckInCode | null;
};

export function createLifeEventRegistrationWorkspace() {
  const registrationFilters = reactive<RegistrationFilters>({
    status: "",
    query: ""
  });
  const appliedRegistrationFilters = ref<RegistrationFilters>({
    status: "",
    query: ""
  });
  const registrationPage = ref(1);
  const registrationEditDialog = reactive<RegistrationEditDialog>({
    show: false,
    registrationId: "",
    attendeeName: "",
    partySize: 1,
    note: ""
  });
  const registrationCreateDialog = reactive<RegistrationCreateDialog>({
    show: false,
    attendeeName: "",
    attendeeEmail: "",
    partySize: 1,
    note: ""
  });
  const checkInCodeDialog = reactive<CheckInCodeDialog>({
    show: false,
    code: null
  });
  return {
    registrationFilters,
    appliedRegistrationFilters,
    registrationPage,
    registrationEditDialog,
    registrationCreateDialog,
    checkInCodeDialog
  };
}

export function resetRegistrationCreateForm(
  dialog: RegistrationCreateDialog
) {
  dialog.attendeeName = "";
  dialog.attendeeEmail = "";
  dialog.partySize = 1;
  dialog.note = "";
}
