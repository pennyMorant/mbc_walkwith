import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/app_formatters.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/course_repository.dart';
import '../domain/course_learning.dart';
import 'widgets/course_learning_card.dart';
import 'widgets/life_error_view.dart';

class CourseDetailPage extends ConsumerStatefulWidget {
  const CourseDetailPage({super.key, required this.courseId});

  final String courseId;

  @override
  ConsumerState<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends ConsumerState<CourseDetailPage> {
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final courseAsync = ref.watch(courseByIdProvider(widget.courseId));

    return Scaffold(
      appBar: SecondaryAppBar(title: '', onBack: () => _goBack(context)),
      body: courseAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => LifeErrorView(
          onRetry: () => ref.invalidate(courseByIdProvider(widget.courseId)),
        ),
        data: (course) => _CourseDetailContent(
          course: course,
          isSubmitting: _isSubmitting,
          onEnroll: () => _enroll(course),
        ),
      ),
    );
  }

  Future<void> _enroll(CourseLearning course) async {
    final session = await ref.read(memberSessionProvider.future);
    if (!mounted) {
      return;
    }
    if (session == null) {
      await context.pushNamed(AppRouteNames.memberLoginEmail);
      return;
    }
    if (_isSubmitting || !course.canEnroll) {
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await ref.read(courseRepositoryProvider).enroll(course.id, session);
      ref.invalidate(courseByIdProvider(course.id));
      ref.invalidate(coursesProvider);
      ref.invalidate(myCoursesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.courseEnrollmentSubmitSuccess,
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.life);
  }
}

class _CourseDetailContent extends ConsumerWidget {
  const _CourseDetailContent({
    required this.course,
    required this.isSubmitting,
    required this.onEnroll,
  });

  final CourseLearning course;
  final bool isSubmitting;
  final VoidCallback onEnroll;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (value) => value, orElse: () => null);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      children: [
        CourseLearningCard(
          course: course,
          isSubmitting: isSubmitting,
          onEnroll: course.canEnroll ? onEnroll : null,
        ),
        if (session == null && course.canEnroll) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.courseSignInToEnrollBody),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () =>
                        context.pushNamed(AppRouteNames.memberLoginEmail),
                    icon: const Icon(Icons.login),
                    label: Text(l10n.memberSignInAction),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        Text(
          l10n.courseLessonsTitle,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        if (course.lessons.isEmpty)
          _CourseMessageCard(body: l10n.courseLessonsEmptyBody)
        else
          for (var index = 0; index < course.lessons.length; index++) ...[
            _CourseLessonCard(
              lesson: course.lessons[index],
              sequence: index + 1,
            ),
            if (index != course.lessons.length - 1) const SizedBox(height: 8),
          ],
      ],
    );
  }
}

class _CourseLessonCard extends StatelessWidget {
  const _CourseLessonCard({required this.lesson, required this.sequence});

  final CourseLesson lesson;
  final int sequence;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$sequence. ${lesson.title}',
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            if (lesson.startsAt != null) ...[
              const SizedBox(height: 6),
              Text(
                formatDateTime(context, lesson.startsAt!.toLocal()),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (lesson.description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(lesson.description),
            ],
          ],
        ),
      ),
    );
  }
}

class _CourseMessageCard extends StatelessWidget {
  const _CourseMessageCard({required this.body});

  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(18), child: Text(body)),
    );
  }
}
