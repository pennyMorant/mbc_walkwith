import 'package:intl/intl.dart';

const _minimumGivingAmountCents = 100;
const _maximumGivingAmountCents = 10_000_000;

int? parseGivingAmountCents(String input, {required String localeTag}) {
  final value = input.trim();
  if (value.isEmpty) {
    return null;
  }
  final decimalSeparator = NumberFormat.decimalPattern(
    localeTag,
  ).symbols.DECIMAL_SEP;
  final pattern = RegExp(
    '^\\d+(?:${RegExp.escape(decimalSeparator)}\\d{1,2})?\$',
  );
  if (!pattern.hasMatch(value)) {
    return null;
  }

  final parts = value.split(decimalSeparator);
  final whole = int.tryParse(parts[0]);
  final fraction = parts.length == 1 ? 0 : int.parse(parts[1].padRight(2, '0'));
  if (whole == null) {
    return null;
  }
  final cents = whole * 100 + fraction;
  if (cents < _minimumGivingAmountCents || cents > _maximumGivingAmountCents) {
    return null;
  }
  return cents;
}
