import '../../domain/reading_plan.dart';
import 'reading_plan_json_reader.dart';

const _planStatuses = {'draft', 'published', 'paused', 'archived'};
const _planVisibilities = {'public', 'members'};

class ScriptureReferenceDto {
  const ScriptureReferenceDto({
    required this.bookId,
    required this.chapter,
    required this.startVerse,
    required this.endVerse,
    required this.referenceLabel,
  });

  factory ScriptureReferenceDto.fromJson(Map<String, Object?> json) {
    return ScriptureReferenceDto(
      bookId: readingPlanString(json, 'bookId'),
      chapter: readingPlanPositiveInt(json, 'chapter'),
      startVerse: readingPlanPositiveInt(json, 'startVerse'),
      endVerse: _endVerse(json),
      referenceLabel: readingPlanString(
        json,
        'referenceLabel',
        allowEmpty: true,
      ),
    );
  }

  final String bookId;
  final int chapter;
  final int startVerse;
  final int endVerse;
  final String referenceLabel;

  ScriptureReference toDomain() {
    return ScriptureReference(
      bookId: bookId,
      chapter: chapter,
      startVerse: startVerse,
      endVerse: endVerse,
      referenceLabel: referenceLabel,
    );
  }
}

class ReadingPlanDto {
  const ReadingPlanDto({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.visibility,
    required this.locale,
    required this.durationDays,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReadingPlanDto.fromJson(Map<String, Object?> json) {
    return ReadingPlanDto(
      id: readingPlanString(json, 'id'),
      title: readingPlanString(json, 'title'),
      description: readingPlanString(json, 'description', allowEmpty: true),
      status: readingPlanEnum(json, 'status', _planStatuses),
      visibility: readingPlanEnum(json, 'visibility', _planVisibilities),
      locale: readingPlanString(json, 'locale'),
      durationDays: readingPlanPositiveInt(json, 'durationDays'),
      createdAt: readingPlanDateTime(json, 'createdAt'),
      updatedAt: readingPlanDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String title;
  final String description;
  final String status;
  final String visibility;
  final String locale;
  final int durationDays;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ReadingPlan toDomain() {
    return ReadingPlan(
      id: id,
      title: title,
      description: description,
      status: status,
      visibility: visibility,
      locale: locale,
      durationDays: durationDays,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class ReadingPlanDayDto {
  const ReadingPlanDayDto({
    required this.id,
    required this.planId,
    required this.dayNumber,
    required this.title,
    required this.description,
    required this.references,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReadingPlanDayDto.fromJson(Map<String, Object?> json) {
    return ReadingPlanDayDto(
      id: readingPlanString(json, 'id'),
      planId: readingPlanString(json, 'planId'),
      dayNumber: readingPlanPositiveInt(json, 'dayNumber'),
      title: readingPlanString(json, 'title', allowEmpty: true),
      description: readingPlanString(json, 'description', allowEmpty: true),
      references: readingPlanObjectList(
        json,
        'references',
      ).map(ScriptureReferenceDto.fromJson).toList(),
      createdAt: readingPlanDateTime(json, 'createdAt'),
      updatedAt: readingPlanDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String planId;
  final int dayNumber;
  final String title;
  final String description;
  final List<ScriptureReferenceDto> references;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ReadingPlanDay toDomain() {
    return ReadingPlanDay(
      id: id,
      planId: planId,
      dayNumber: dayNumber,
      title: title,
      description: description,
      references: references.map((reference) => reference.toDomain()).toList(),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

int _endVerse(Map<String, Object?> json) {
  final startVerse = readingPlanPositiveInt(json, 'startVerse');
  final endVerse = readingPlanPositiveInt(json, 'endVerse');
  if (endVerse < startVerse) {
    throw const FormatException('endVerse must not precede startVerse.');
  }
  return endVerse;
}
