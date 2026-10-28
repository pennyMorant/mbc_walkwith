export type SettingsFilterForm = {
  category: string;
  query: string;
};

export type SettingsFilterSnapshot = Readonly<SettingsFilterForm>;

export type SettingEditorContext = {
  settingKey: string;
  contextVersion: number;
};

export function createSettingsFilterForm(): SettingsFilterForm {
  return { category: "", query: "" };
}

export function settingsFilterSnapshot(
  form: SettingsFilterForm
): SettingsFilterSnapshot {
  return {
    category: form.category,
    query: form.query.trim()
  };
}

export function sameSettingsFilters(
  first: SettingsFilterSnapshot,
  second: SettingsFilterSnapshot
) {
  return first.category === second.category && first.query === second.query;
}

export function resetSettingsFilterForm(form: SettingsFilterForm) {
  Object.assign(form, createSettingsFilterForm());
}

export function isCurrentSettingEditorContext(
  context: SettingEditorContext | undefined,
  currentSettingKey: string | undefined,
  contextVersion: number
) {
  return Boolean(
    context &&
      context.settingKey === currentSettingKey &&
      context.contextVersion === contextVersion
  );
}
