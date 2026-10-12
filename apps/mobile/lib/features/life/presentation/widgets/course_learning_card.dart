import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/course_learning.dart';

class CourseLearningCard extends StatelessWidget {
  const CourseLearningCard({
    super.key,
    required this.course,
    required this.isSubmitting,
    required this.onEnroll,
    this.onOpen,
  });

  final CourseLearning course;
  final bool isSubmitting;
  final VoidCallback? onEnroll;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final capacityLabel = course.capacity == null
        ? l10n.courseCapacityOpen
        : l10n.courseCapacityLabel(course.enrolledCount, course.capacity!);
    final statusLabel = _statusLabel(l10n, course);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          course.title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (course.teacherName.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              course.teacherName,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  AppChip(label: statusLabel, selected: course.isEnrolled),
                ],
              ),
              if (course.description.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  course.description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (course.scheduleText.isNotEmpty)
                    AppChip(icon: Icons.schedule, label: course.scheduleText),
                  if (course.location.isNotEmpty)
                    AppChip(icon: Icons.place_outlined, label: course.location),
                  AppChip(
                    icon: Icons.menu_book_outlined,
                    label: l10n.courseLessonCount(course.lessonCount),
                  ),
                  AppChip(icon: Icons.people_outline, label: capacityLabel),
                ],
              ),
              if (course.isEnrolled) ...[
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: course.lessonCount == 0
                      ? 0
                      : course.myCompletedLessonCount / course.lessonCount,
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.courseProgressLabel(
                    course.myCompletedLessonCount,
                    course.lessonCount,
                  ),
                  style: theme.textTheme.bodySmall,
                ),
              ],
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: course.canEnroll && !isSubmitting
                      ? onEnroll
                      : null,
                  icon: isSubmitting
                      ? const SizedBox.square(
                          dimension: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.school_outlined),
                  label: Text(_actionLabel(l10n)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _actionLabel(AppLocalizations l10n) {
    switch (course.myEnrollmentStatus) {
      case null:
        return l10n.courseEnrollAction;
      case 'submitted':
        return l10n.courseSubmittedAction;
      case 'enrolled':
        return l10n.courseEnrolledAction;
      case 'waitlisted':
        return l10n.courseWaitlistedAction;
      case 'cancelled':
        return course.canEnroll
            ? l10n.courseEnrollAction
            : l10n.courseCancelledAction;
      case 'completed':
        return l10n.courseCompletedAction;
      default:
        return l10n.commonStatusUnknownLabel;
    }
  }
}

String _statusLabel(AppLocalizations l10n, CourseLearning course) {
  return switch (course.status) {
    'draft' => l10n.courseStatusDraft,
    'closed' => l10n.courseStatusClosed,
    'in_progress' => l10n.courseStatusInProgress,
    'open' => l10n.courseStatusOpen,
    'completed' => l10n.courseStatusCompleted,
    'archived' => l10n.courseStatusArchived,
    _ => l10n.commonStatusUnknownLabel,
  };
}
