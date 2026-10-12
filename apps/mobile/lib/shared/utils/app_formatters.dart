import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

String formatDateOnly(BuildContext context, DateTime value) {
  return DateFormat.yMMMd(_localeTag(context)).format(value);
}

String formatDateTime(BuildContext context, DateTime value) {
  return DateFormat.yMMMd(_localeTag(context)).add_Hm().format(value);
}

String formatTimeOnly(BuildContext context, DateTime value) {
  return DateFormat.Hm(_localeTag(context)).format(value);
}

String formatDurationClock(Duration duration) {
  final cleanDuration = duration.isNegative ? Duration.zero : duration;
  final hours = cleanDuration.inHours;
  final minutes = hours > 0
      ? cleanDuration.inMinutes.remainder(60).toString().padLeft(2, '0')
      : cleanDuration.inMinutes.toString();
  final seconds = cleanDuration.inSeconds
      .remainder(60)
      .toString()
      .padLeft(2, '0');
  return hours > 0 ? '$hours:$minutes:$seconds' : '$minutes:$seconds';
}

String formatMoneyAmount({
  required BuildContext context,
  required String currency,
  required int amountCents,
}) {
  final formatter = NumberFormat.currency(
    locale: _localeTag(context),
    name: currency,
    symbol: '$currency ',
  );
  return formatter.format(amountCents / 100);
}

num? parseDecimalInput(BuildContext context, String value) {
  final clean = value.trim();
  return NumberFormat.decimalPattern(
    _localeTag(context),
  ).tryParse(clean.isEmpty ? '0' : clean);
}

String formatDateRangeByDay(
  BuildContext context,
  DateTime start, {
  DateTime? end,
}) {
  final startLabel = formatDateOnly(context, start);
  if (end == null) {
    return startLabel;
  }

  final endLabel = formatDateOnly(context, end);
  return startLabel == endLabel ? startLabel : '$startLabel - $endLabel';
}

String plainTextPreview(
  String markdownOrText, {
  int maxLength = 180,
  String fallback = '',
}) {
  final clean = markdownOrText
      .replaceAll(RegExp(r'```[\s\S]*?```'), ' ')
      .replaceAllMapped(RegExp(r'`([^`]*)`'), (match) => match.group(1) ?? '')
      .replaceAllMapped(
        RegExp(r'!\[([^\]]*)\]\([^)]+\)'),
        (match) => match.group(1) ?? '',
      )
      .replaceAllMapped(
        RegExp(r'\[([^\]]+)\]\([^)]+\)'),
        (match) => match.group(1) ?? '',
      )
      .replaceAll(RegExp(r'^[#>*+\-\s]+', multiLine: true), '')
      .replaceAll(RegExp(r'[_*~]+'), '')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();

  final value = clean.isEmpty ? fallback.trim() : clean;
  if (value.length <= maxLength) {
    return value;
  }
  return '${value.substring(0, maxLength).trimRight()}...';
}

String nonEmptyOrFallback(String? value, String fallback) {
  final clean = value?.trim();
  return clean == null || clean.isEmpty ? fallback : clean;
}

String _localeTag(BuildContext context) {
  return Localizations.localeOf(context).toLanguageTag();
}
