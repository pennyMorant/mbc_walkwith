export type AuditLogFilterForm = {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
};

export type AuditLogFilterSnapshot = Readonly<AuditLogFilterForm>;

export function createAuditLogFilterForm(): AuditLogFilterForm {
  return {
    actorUserId: "",
    action: "",
    resourceType: "",
    resourceId: ""
  };
}

export function auditLogFilterSnapshot(
  form: AuditLogFilterForm
): AuditLogFilterSnapshot {
  return {
    actorUserId: form.actorUserId.trim(),
    action: form.action.trim(),
    resourceType: form.resourceType.trim(),
    resourceId: form.resourceId.trim()
  };
}

export function sameAuditLogFilters(
  first: AuditLogFilterSnapshot,
  second: AuditLogFilterSnapshot
) {
  return (
    first.actorUserId === second.actorUserId &&
    first.action === second.action &&
    first.resourceType === second.resourceType &&
    first.resourceId === second.resourceId
  );
}

export function resetAuditLogFilterForm(form: AuditLogFilterForm) {
  Object.assign(form, createAuditLogFilterForm());
}
