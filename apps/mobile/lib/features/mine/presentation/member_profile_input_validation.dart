bool isValidOptionalMemberYear(String value) {
  final clean = value.trim();
  if (clean.isEmpty) {
    return true;
  }
  final year = int.tryParse(clean);
  return year != null && year >= 1900 && year <= 2100;
}

bool isValidOptionalIsoDate(String value) {
  final clean = value.trim();
  if (clean.isEmpty) {
    return true;
  }
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(clean);
  if (match == null) {
    return false;
  }
  final year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);
  final parsed = DateTime.utc(year, month, day);
  return parsed.year == year && parsed.month == month && parsed.day == day;
}
