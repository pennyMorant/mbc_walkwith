class ScriptureReference {
  const ScriptureReference({
    required this.bookId,
    required this.chapter,
    required this.startVerse,
    required this.endVerse,
    required this.referenceLabel,
  });

  final String bookId;
  final int chapter;
  final int startVerse;
  final int endVerse;
  final String referenceLabel;

  String get displayLabel {
    final cleanLabel = referenceLabel.trim();
    if (cleanLabel.isNotEmpty) {
      return cleanLabel;
    }
    final verseLabel = startVerse == endVerse
        ? '$startVerse'
        : '$startVerse-$endVerse';
    return '$bookId $chapter:$verseLabel';
  }
}

class ReadingPlan {
  const ReadingPlan({
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

  final String id;
  final String title;
  final String description;
  final String status;
  final String visibility;
  final String locale;
  final int durationDays;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}

class ReadingPlanDay {
  const ReadingPlanDay({
    required this.id,
    required this.planId,
    required this.dayNumber,
    required this.title,
    required this.description,
    required this.references,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String planId;
  final int dayNumber;
  final String title;
  final String description;
  final List<ScriptureReference> references;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}

class ReadingPlanDayProgress {
  const ReadingPlanDayProgress({
    required this.id,
    required this.assignmentId,
    required this.dayId,
    required this.status,
    required this.note,
    required this.completedAt,
    required this.updatedAt,
  });

  final String id;
  final String assignmentId;
  final String dayId;
  final String status;
  final String note;
  final DateTime? completedAt;
  final DateTime? updatedAt;

  bool get isCompleted => status == 'completed';
}

class ReadingPlanAssignment {
  const ReadingPlanAssignment({
    required this.id,
    required this.planId,
    required this.planTitle,
    required this.planDurationDays,
    required this.attemptNumber,
    required this.userType,
    required this.userId,
    required this.sourceType,
    required this.sourceId,
    required this.status,
    required this.startedAt,
    required this.completedAt,
    required this.endedAt,
    required this.progress,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String planId;
  final String planTitle;
  final int planDurationDays;
  final int attemptNumber;
  final String userType;
  final String userId;
  final String sourceType;
  final String? sourceId;
  final String status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? endedAt;
  final List<ReadingPlanDayProgress> progress;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isInProgress => status == 'not_started' || status == 'active';

  bool get isOpen => isInProgress || status == 'paused';

  bool get isHistory => status == 'completed' || status == 'abandoned';

  int get completedCount {
    return progress.where((entry) => entry.isCompleted).length;
  }

  ReadingPlanDayProgress? progressForDay(String dayId) {
    for (final entry in progress) {
      if (entry.dayId == dayId) {
        return entry;
      }
    }
    return null;
  }
}

class ReadingPlanAssignmentPage {
  const ReadingPlanAssignmentPage({required this.items, this.nextCursor});

  final List<ReadingPlanAssignment> items;
  final String? nextCursor;
}

class ReadingPlanAssignmentDetail {
  const ReadingPlanAssignmentDetail({
    required this.assignment,
    required this.days,
    required this.canRestart,
  });

  final ReadingPlanAssignment assignment;
  final List<ReadingPlanDay> days;
  final bool canRestart;
}
