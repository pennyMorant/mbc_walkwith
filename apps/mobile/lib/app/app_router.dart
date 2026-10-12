import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/life/domain/giving_checkout_return.dart';
import '../features/life/presentation/life_tab.dart';
import '../features/life/presentation/annual_statements_page.dart';
import '../features/life/presentation/course_detail_page.dart';
import '../features/life/presentation/event_check_in_scan_page.dart';
import '../features/life/presentation/giving_history_page.dart';
import '../features/life/presentation/group_detail_page.dart';
import '../features/life/presentation/life_post_detail_page.dart';
import '../features/life/presentation/my_serving_page.dart';
import '../features/life/presentation/notification_center_page.dart';
import '../features/life/presentation/serving_assignment_detail_page.dart';
import '../features/mine/presentation/member_profile_page.dart';
import '../features/member_auth/data/member_session_repository.dart';
import '../features/member_auth/presentation/member_email_verification_page.dart';
import '../features/member_auth/presentation/member_login_email_page.dart';
import '../features/member_auth/presentation/member_login_password_page.dart';
import '../features/member_auth/presentation/member_password_recovery_page.dart';
import '../features/member_auth/presentation/member_registration_page.dart';
import '../features/mine/presentation/mine_tab.dart';
import '../features/mine/presentation/my_groups_page.dart';
import '../features/mine/presentation/my_courses_page.dart';
import '../features/mine/presentation/my_reading_plans_page.dart';
import '../features/sermons/presentation/sermon_detail_page.dart';
import '../features/sermons/presentation/sermons_tab.dart';
import '../features/shell/shell_page.dart';
import '../features/study/presentation/bible_reader_page.dart';
import '../features/study/presentation/bible_search_page.dart';
import '../features/study/presentation/study_tab.dart';
import 'app_routes.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createAppRouter() {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutePaths.study,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ShellPage(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutePaths.study,
                name: AppRouteNames.study,
                builder: (context, state) => const StudyTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutePaths.sermons,
                name: AppRouteNames.sermons,
                builder: (context, state) => const SermonsTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutePaths.life,
                name: AppRouteNames.life,
                builder: (context, state) => const LifeTab(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutePaths.mine,
                name: AppRouteNames.mine,
                builder: (context, state) => const MineTab(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberLoginEmail,
        name: AppRouteNames.memberLoginEmail,
        pageBuilder: (context, state) =>
            _authPage(state, const MemberLoginEmailPage()),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberLoginPassword,
        name: AppRouteNames.memberLoginPassword,
        pageBuilder: (context, state) => _authPage(
          state,
          MemberLoginPasswordPage(email: state.extra as String?),
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberRegister,
        name: AppRouteNames.memberRegister,
        pageBuilder: (context, state) =>
            _authPage(state, const MemberRegistrationPage()),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberEmailVerification,
        name: AppRouteNames.memberEmailVerification,
        pageBuilder: (context, state) => _authPage(
          state,
          MemberEmailVerificationPage(
            request: state.extra as MemberCodeRequestResult?,
          ),
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberPasswordRecovery,
        name: AppRouteNames.memberPasswordRecovery,
        pageBuilder: (context, state) => _authPage(
          state,
          MemberPasswordRecoveryPage(email: state.extra as String?),
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.studySearch,
        name: AppRouteNames.studySearch,
        builder: (context, state) => const BibleSearchPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.studyReader,
        name: AppRouteNames.studyReader,
        builder: (context, state) {
          final bookId = state.pathParameters['bookId'] ?? 'rom';
          final chapter =
              int.tryParse(state.pathParameters['chapter'] ?? '') ?? 8;
          final restoreScrollOffset =
              state.uri.queryParameters['restoreScrollOffset'] == '1';
          final targetVerseId =
              state.uri.queryParameters['verseId'] ??
              _verseIdFromQuery(
                bookId: bookId,
                chapter: chapter,
                verse: state.uri.queryParameters['verse'],
              );

          return BibleReaderPage(
            bookId: bookId,
            chapter: chapter,
            restoreScrollOffset: restoreScrollOffset,
            targetVerseId: targetVerseId,
          );
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.sermonDetail,
        name: AppRouteNames.sermonDetail,
        builder: (context, state) {
          final sermonId = state.pathParameters['sermonId'] ?? '';
          return SermonDetailPage(sermonId: sermonId);
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.lifePostDetail,
        name: AppRouteNames.lifePostDetail,
        builder: (context, state) {
          final postId = state.pathParameters['postId'] ?? '';
          return LifePostDetailPage(postId: postId);
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.groupDetail,
        name: AppRouteNames.groupDetail,
        builder: (context, state) {
          final groupId = state.pathParameters['groupId'] ?? '';
          return GroupDetailPage(groupId: groupId);
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.courseDetail,
        name: AppRouteNames.courseDetail,
        builder: (context, state) {
          final courseId = state.pathParameters['courseId'] ?? '';
          return CourseDetailPage(courseId: courseId);
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.lifeCheckInScan,
        name: AppRouteNames.lifeCheckInScan,
        builder: (context, state) => const EventCheckInScanPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.memberProfile,
        name: AppRouteNames.memberProfile,
        builder: (context, state) => const MemberProfilePage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.myGroups,
        name: AppRouteNames.myGroups,
        builder: (context, state) => const MyGroupsPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.myCourses,
        name: AppRouteNames.myCourses,
        builder: (context, state) => const MyCoursesPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.myServing,
        name: AppRouteNames.myServing,
        builder: (context, state) => const MyServingPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.myReadingPlans,
        name: AppRouteNames.myReadingPlans,
        builder: (context, state) => const MyReadingPlansPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.servingDetail,
        name: AppRouteNames.servingDetail,
        builder: (context, state) => ServingAssignmentDetailPage(
          assignmentId: state.pathParameters['assignmentId'] ?? '',
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.notifications,
        name: AppRouteNames.notifications,
        builder: (context, state) => const NotificationCenterPage(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.givingHistory,
        name: AppRouteNames.givingHistory,
        builder: (context, state) {
          final checkoutReturn = parseGivingCheckoutReturn(
            state.uri.queryParameters['checkout'],
          );
          return GivingHistoryPage(
            checkoutReturn: checkoutReturn,
            onCheckoutReturnHandled: checkoutReturn == null
                ? null
                : () {
                    if (context.mounted) {
                      context.replace(AppRoutePaths.givingHistory);
                    }
                  },
          );
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutePaths.annualStatements,
        name: AppRouteNames.annualStatements,
        builder: (context, state) => const AnnualStatementsPage(),
      ),
    ],
  );
}

Page<void> _authPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 220),
    reverseTransitionDuration: const Duration(milliseconds: 180),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.035, 0),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

String? _verseIdFromQuery({
  required String bookId,
  required int chapter,
  required String? verse,
}) {
  final verseNumber = int.tryParse(verse ?? '');
  if (verseNumber == null || verseNumber <= 0) {
    return null;
  }
  return '$bookId.$chapter.$verseNumber';
}
