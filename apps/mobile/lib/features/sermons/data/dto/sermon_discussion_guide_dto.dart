import '../../domain/sermon_discussion_guide.dart';
import 'sermon_discussion_json_reader.dart';

const _publicGuideStatuses = {'published'};
const _publicAudienceTypes = {'public'};
const _questionTypes = {
  'observation',
  'interpretation',
  'application',
  'prayer',
  'action',
};
const _responseUserTypes = {'member', 'external'};
const _responseStatuses = {
  'private',
  'shared_with_group',
  'hidden',
  'archived',
};

class SermonDiscussionGuideDto {
  const SermonDiscussionGuideDto({
    required this.id,
    required this.sermonId,
    required this.title,
    required this.summary,
    required this.status,
    required this.audienceType,
    required this.audienceId,
    required this.questions,
    required this.actionSteps,
    required this.prayerPrompts,
    required this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SermonDiscussionGuideDto.fromJson(Map<String, Object?> json) {
    return SermonDiscussionGuideDto(
      id: sermonDiscussionString(json, 'id'),
      sermonId: sermonDiscussionString(json, 'sermonId'),
      title: sermonDiscussionString(json, 'title'),
      summary: sermonDiscussionString(json, 'summary', allowEmpty: true),
      status: sermonDiscussionEnum(json, 'status', _publicGuideStatuses),
      audienceType: sermonDiscussionEnum(
        json,
        'audienceType',
        _publicAudienceTypes,
      ),
      audienceId: sermonDiscussionNull(json, 'audienceId'),
      questions: sermonDiscussionMappedList(
        json,
        'questions',
        SermonDiscussionQuestionDto.fromJson,
        maxItems: 50,
        idOf: (question) => question.id,
      ),
      actionSteps: sermonDiscussionMappedList(
        json,
        'actionSteps',
        SermonDiscussionActionStepDto.fromJson,
        maxItems: 50,
        idOf: (step) => step.id,
      ),
      prayerPrompts: sermonDiscussionStringList(
        json,
        'prayerPrompts',
        requireNonEmptyItems: true,
        maxItems: 50,
      ),
      publishedAt: sermonDiscussionNullableDateTime(json, 'publishedAt'),
      createdAt: sermonDiscussionDateTime(json, 'createdAt'),
      updatedAt: sermonDiscussionDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String sermonId;
  final String title;
  final String summary;
  final String status;
  final String audienceType;
  final String? audienceId;
  final List<SermonDiscussionQuestionDto> questions;
  final List<SermonDiscussionActionStepDto> actionSteps;
  final List<String> prayerPrompts;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  SermonDiscussionGuide toDomain() {
    return SermonDiscussionGuide(
      id: id,
      sermonId: sermonId,
      title: title,
      summary: summary,
      status: status,
      audienceType: audienceType,
      audienceId: audienceId,
      questions: questions.map((question) => question.toDomain()).toList(),
      actionSteps: actionSteps.map((step) => step.toDomain()).toList(),
      prayerPrompts: prayerPrompts,
      publishedAt: publishedAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class SermonDiscussionQuestionDto {
  const SermonDiscussionQuestionDto({
    required this.id,
    required this.type,
    required this.prompt,
    required this.sortOrder,
    required this.startSeconds,
  });

  factory SermonDiscussionQuestionDto.fromJson(Map<String, Object?> json) {
    return SermonDiscussionQuestionDto(
      id: sermonDiscussionString(json, 'id'),
      type: sermonDiscussionEnum(json, 'type', _questionTypes),
      prompt: sermonDiscussionString(json, 'prompt'),
      sortOrder: sermonDiscussionInt(json, 'sortOrder'),
      startSeconds: sermonDiscussionNullableInt(
        json,
        'startSeconds',
        nonNegative: true,
      ),
    );
  }

  final String id;
  final String type;
  final String prompt;
  final int sortOrder;
  final int? startSeconds;

  SermonDiscussionQuestion toDomain() {
    return SermonDiscussionQuestion(
      id: id,
      type: type,
      prompt: prompt,
      sortOrder: sortOrder,
      startSeconds: startSeconds,
    );
  }
}

class SermonDiscussionActionStepDto {
  const SermonDiscussionActionStepDto({
    required this.id,
    required this.title,
    required this.description,
    required this.sortOrder,
  });

  factory SermonDiscussionActionStepDto.fromJson(Map<String, Object?> json) {
    return SermonDiscussionActionStepDto(
      id: sermonDiscussionString(json, 'id'),
      title: sermonDiscussionString(json, 'title'),
      description: sermonDiscussionString(
        json,
        'description',
        allowEmpty: true,
      ),
      sortOrder: sermonDiscussionInt(json, 'sortOrder'),
    );
  }

  final String id;
  final String title;
  final String description;
  final int sortOrder;

  SermonDiscussionActionStep toDomain() {
    return SermonDiscussionActionStep(
      id: id,
      title: title,
      description: description,
      sortOrder: sortOrder,
    );
  }
}

class SermonDiscussionResponseDto {
  const SermonDiscussionResponseDto({
    required this.id,
    required this.guideId,
    required this.questionId,
    required this.userType,
    required this.userId,
    required this.status,
    required this.content,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SermonDiscussionResponseDto.fromJson(Map<String, Object?> json) {
    return SermonDiscussionResponseDto(
      id: sermonDiscussionString(json, 'id'),
      guideId: sermonDiscussionString(json, 'guideId'),
      questionId: sermonDiscussionNullableString(json, 'questionId'),
      userType: sermonDiscussionEnum(json, 'userType', _responseUserTypes),
      userId: sermonDiscussionString(json, 'userId'),
      status: sermonDiscussionEnum(json, 'status', _responseStatuses),
      content: sermonDiscussionString(json, 'content'),
      createdAt: sermonDiscussionDateTime(json, 'createdAt'),
      updatedAt: sermonDiscussionDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String guideId;
  final String? questionId;
  final String userType;
  final String userId;
  final String status;
  final String content;
  final DateTime createdAt;
  final DateTime updatedAt;

  SermonDiscussionResponse toDomain() {
    return SermonDiscussionResponse(
      id: id,
      guideId: guideId,
      questionId: questionId,
      userType: userType,
      userId: userId,
      status: status,
      content: content,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
