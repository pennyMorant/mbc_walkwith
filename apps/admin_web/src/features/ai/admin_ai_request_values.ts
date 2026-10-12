import {
  aiTaskInputLimits,
  type AdminAiTask,
  type AiLocale,
  type AiResourceReference,
  type AiTask,
  type AiTaskInput
} from "@mbc/api-contracts";

const contentTruncationNotice = "\n\n[Context excerpt truncated]";
const fieldTruncationNotice = " [truncated]";

export function prepareAdminAiTaskInput(input: AiTaskInput): AiTaskInput {
  const prepared: AiTaskInput = {
    context: input.context
      .map((item) => ({
        label: boundedAiValue(
          item.label,
          aiTaskInputLimits.contextLabel,
          fieldTruncationNotice
        ),
        value: boundedAiValue(
          item.value,
          aiTaskInputLimits.contextValue,
          contentTruncationNotice
        )
      }))
      .filter((item) => item.label.length > 0 && item.value.length > 0)
      .slice(0, aiTaskInputLimits.contextItems)
  };

  assignBoundedValue(
    prepared,
    "title",
    input.title,
    aiTaskInputLimits.title,
    fieldTruncationNotice
  );
  assignBoundedValue(
    prepared,
    "body",
    input.body,
    aiTaskInputLimits.body,
    contentTruncationNotice
  );
  assignBoundedValue(
    prepared,
    "reference",
    input.reference,
    aiTaskInputLimits.reference,
    fieldTruncationNotice
  );
  assignBoundedValue(
    prepared,
    "question",
    input.question,
    aiTaskInputLimits.question,
    fieldTruncationNotice
  );
  assignBoundedValue(
    prepared,
    "audience",
    input.audience,
    aiTaskInputLimits.audience,
    fieldTruncationNotice
  );
  return prepared;
}

export function hasAdminAiTaskInput(input: AiTaskInput): boolean {
  return Boolean(
    input.title?.trim() ||
      input.body?.trim() ||
      input.reference?.trim() ||
      input.question?.trim() ||
      input.audience?.trim() ||
      input.context.some((item) => item.value.trim().length > 0)
  );
}

export function adminAiRequestIdentity(input: {
  task: AdminAiTask;
  locale: AiLocale;
  taskInput: AiTaskInput;
  resource?: AiResourceReference;
}) {
  return JSON.stringify(input);
}

export type AdminAiRequestState = Readonly<{
  serial: number;
  pendingSerial: number | null;
}>;

export function createAdminAiRequestState(): AdminAiRequestState {
  return { serial: 0, pendingSerial: null };
}

export function beginAdminAiRequest(state: AdminAiRequestState) {
  if (state.pendingSerial !== null) {
    return null;
  }
  const serial = state.serial + 1;
  return {
    serial,
    state: { serial, pendingSerial: serial } satisfies AdminAiRequestState
  };
}

export function invalidateAdminAiRequest(
  state: AdminAiRequestState
): AdminAiRequestState {
  return { ...state, serial: state.serial + 1 };
}

export function settleAdminAiRequest(
  state: AdminAiRequestState,
  serial: number
): AdminAiRequestState {
  return state.pendingSerial === serial
    ? { ...state, pendingSerial: null }
    : state;
}

export function isAdminAiRequestPending(state: AdminAiRequestState) {
  return state.pendingSerial !== null;
}

export function isCurrentAdminAiRequest(input: {
  responseIdentity: string;
  activeIdentity: string;
  responseSerial: number;
  activeSerial: number;
}) {
  return (
    input.responseSerial === input.activeSerial &&
    input.responseIdentity === input.activeIdentity
  );
}

export function isCurrentAdminAiDraftResult(input: {
  responseTask: AiTask;
  activeTask: AdminAiTask;
  responseIdentity: string;
  activeIdentity: string;
  responseSerial: number;
  activeSerial: number;
}) {
  return (
    isCurrentAdminAiRequest(input) &&
    input.responseTask === input.activeTask
  );
}

function assignBoundedValue(
  target: AiTaskInput,
  key: "title" | "body" | "reference" | "question" | "audience",
  value: string | undefined,
  maxLength: number,
  truncationNotice: string
) {
  const bounded = boundedAiValue(value ?? "", maxLength, truncationNotice);
  if (bounded) {
    target[key] = bounded;
  }
}

function boundedAiValue(
  value: string,
  maxLength: number,
  truncationNotice: string
) {
  const clean = value.trim();
  if (clean.length <= maxLength) {
    return clean;
  }

  const budget = maxLength - truncationNotice.length;
  if (budget <= 0) {
    return truncationNotice.slice(0, maxLength);
  }
  let end = budget;
  if (
    isHighSurrogate(clean.charCodeAt(end - 1)) &&
    isLowSurrogate(clean.charCodeAt(end))
  ) {
    end -= 1;
  }
  return `${clean.slice(0, end).trimEnd()}${truncationNotice}`;
}

function isHighSurrogate(value: number) {
  return value >= 0xd800 && value <= 0xdbff;
}

function isLowSurrogate(value: number) {
  return value >= 0xdc00 && value <= 0xdfff;
}
