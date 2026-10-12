class SermonDiscussionGuide {
  const SermonDiscussionGuide({
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

  final String id;
  final String sermonId;
  final String title;
  final String summary;
  final String status;
  final String audienceType;
  final String? audienceId;
  final List<SermonDiscussionQuestion> questions;
  final List<SermonDiscussionActionStep> actionSteps;
  final List<String> prayerPrompts;
  final DateTime? publishedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}

class SermonDiscussionQuestion {
  const SermonDiscussionQuestion({
    required this.id,
    required this.type,
    required this.prompt,
    required this.sortOrder,
    required this.startSeconds,
  });

  final String id;
  final String type;
  final String prompt;
  final int sortOrder;
  final int? startSeconds;
}

class SermonDiscussionActionStep {
  const SermonDiscussionActionStep({
    required this.id,
    required this.title,
    required this.description,
    required this.sortOrder,
  });

  final String id;
  final String title;
  final String description;
  final int sortOrder;
}

class SermonDiscussionResponse {
  const SermonDiscussionResponse({
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

  final String id;
  final String guideId;
  final String? questionId;
  final String userType;
  final String userId;
  final String status;
  final String content;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}
