import 'reading_plan_json_reader.dart';

List<Map<String, Object?>> readingPlanEnvelopeItems(
  Map<String, Object?> envelope,
) {
  return readingPlanObjectList(readingPlanObject(envelope, 'data'), 'items');
}

Map<String, Object?> readingPlanEnvelopeData(Map<String, Object?> envelope) {
  return readingPlanObject(envelope, 'data');
}
