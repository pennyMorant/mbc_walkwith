import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../life/data/course_repository.dart';
import '../../life/domain/course_learning.dart';
import '../../life/presentation/widgets/course_learning_card.dart';
import '../../life/presentation/widgets/life_error_view.dart';
import '../../member_auth/data/member_session_repository.dart';

class MyCoursesPage extends ConsumerWidget {
  const MyCoursesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final sessionAsync = ref.watch(memberSessionProvider);

    return Scaffold(
      appBar: SecondaryAppBar(
        title: l10n.courseMyCoursesTitle,
        onBack: () => _goBack(context),
      ),
      body: sessionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) =>
            LifeErrorView(onRetry: () => ref.invalidate(memberSessionProvider)),
        data: (session) => session == null
            ? _GuestCoursesView(
                onSignIn: () =>
                    context.pushNamed(AppRouteNames.memberLoginEmail),
              )
            : _MyCoursesList(coursesAsync: ref.watch(myCoursesProvider)),
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.mine);
  }
}

class _MyCoursesList extends ConsumerWidget {
  const _MyCoursesList({required this.coursesAsync});

  final AsyncValue<List<CourseLearning>> coursesAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return coursesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) =>
          LifeErrorView(onRetry: () => ref.invalidate(myCoursesProvider)),
      data: (courses) => RefreshIndicator(
        onRefresh: () => ref.refresh(myCoursesProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
          children: [
            if (courses.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Text(l10n.courseMyCoursesEmptyBody),
                ),
              )
            else
              for (final course in courses) ...[
                CourseLearningCard(
                  course: course,
                  isSubmitting: false,
                  onEnroll: null,
                  onOpen: () => context.pushNamed(
                    AppRouteNames.courseDetail,
                    pathParameters: {'courseId': course.id},
                  ),
                ),
                const SizedBox(height: 8),
              ],
          ],
        ),
      ),
    );
  }
}

class _GuestCoursesView extends StatelessWidget {
  const _GuestCoursesView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.courseSignInToViewMineBody),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: onSignIn,
                  icon: const Icon(Icons.login),
                  label: Text(l10n.memberSignInAction),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
