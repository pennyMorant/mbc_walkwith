export function formatGroupDate(value: string, locale: string) {
  return formatDate(value, locale, { dateStyle: "medium" });
}

export function formatGroupDateTime(
  value: string | null | undefined,
  locale: string
) {
  if (!value) {
    return "";
  }
  return formatDate(value, locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions
) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, options).format(date);
}
