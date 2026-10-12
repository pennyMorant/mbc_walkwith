import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/course_repository.dart';
import '../../domain/course_learning.dart';
import 'course_learning_card.dart';
import 'life_dashboard_support_widgets.dart';

class CourseLearningSection extends ConsumerStatefulWidget {
  const CourseLearningSection({
    super.key,
    required this.coursesAsync,
    required this.memberSession,
  });

  final AsyncValue<List<CourseLearning>> coursesAsync;
  final MemberSession? memberSession;

  @override
  ConsumerState<CourseLearningSection> createState() =>
      _CourseLearningSectionState();
}

class _CourseLearningSectionState extends ConsumerState<CourseLearningSection> {
  String? _submittingCourseId;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (widget.coursesAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }
    if (widget.coursesAsync.hasError) {
      return LifeEmptyTabCard(
        title: l10n.coursesTitle,
        body: l10n.lifeSectionLoadError,
        action: TextButton.icon(
          onPressed: () => ref.invalidate(coursesProvider),
          icon: const Icon(Icons.refresh),
          label: Text(l10n.retryAction),
        ),
      );
    }

    final courses = widget.coursesAsync.value ?? const <CourseLearning>[];
    if (courses.isEmpty) {
      return LifeEmptyTabCard(
        title: l10n.coursesTitle,
        body: l10n.coursesEmptyBody,
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        children: [
          for (final course in courses) ...[
            CourseLearningCard(
              course: course,
              isSubmitting: _submittingCourseId == course.id,
              onEnroll: widget.memberSession == null
                  ? null
                  : () => _enroll(course),
              onOpen: () => context.pushNamed(
                AppRouteNames.courseDetail,
                pathParameters: {'courseId': course.id},
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Future<void> _enroll(CourseLearning course) async {
    final memberSession = widget.memberSession;
    if (_submittingCourseId != null || memberSession == null) {
      return;
    }
    setState(() => _submittingCourseId = course.id);
    try {
      await ref.read(courseRepositoryProvider).enroll(course.id, memberSession);
      ref.invalidate(coursesProvider);
      ref.invalidate(courseByIdProvider(course.id));
      ref.invalidate(myCoursesProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.courseEnrollmentSubmitSuccess,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
    } finally {
      if (mounted) {
        setState(() => _submittingCourseId = null);
      }
    }
  }
}
