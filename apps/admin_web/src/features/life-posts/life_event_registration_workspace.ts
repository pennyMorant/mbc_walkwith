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

export type RegistrationCreateIntent = {
  postId: string;
  payload: {
    attendeeName: string;
    attendeeEmail: string | null;
    partySize: number;
    note: string;
  };
};

export type RegistrationCommandContext = {
  postId: string;
  workspaceSessionId: number;
};

export type RegistrationUpdateIntent = {
  postId: string;
  registrationId: string;
  payload: {
    partySize: number;
    note: string;
  };
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

export function buildRegistrationCreateIntent(
  postId: string,
  dialog: RegistrationCreateDialog,
  nullableTrimmed: (value: string) => string | null
): RegistrationCreateIntent {
  return {
    postId,
    payload: {
      attendeeName: dialog.attendeeName.trim(),
      attendeeEmail: nullableTrimmed(dialog.attendeeEmail),
      partySize: dialog.partySize,
      note: dialog.note.trim()
    }
  };
}

export function buildRegistrationUpdateIntent(
  postId: string,
  dialog: RegistrationEditDialog
): RegistrationUpdateIntent {
  return {
    postId,
    registrationId: dialog.registrationId,
    payload: {
      partySize: dialog.partySize,
      note: dialog.note.trim()
    }
  };
}

export function isRegistrationCommandCurrent(
  intent: RegistrationCommandContext,
  workspaceSessionId: number,
  postId: string | null
) {
  return (
    intent.workspaceSessionId === workspaceSessionId &&
    intent.postId === postId
  );
}
