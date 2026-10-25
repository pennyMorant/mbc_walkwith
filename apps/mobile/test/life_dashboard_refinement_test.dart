import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_tab_bar.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_view.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_sunday_hero_state_view.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('life feed preserves repository priority order', (tester) async {
    final priorityPost = _post(
      id: 'priority',
      title: 'Priority announcement',
      sort: 100,
      startsAt: DateTime.utc(2026, 10, 20),
    );
    final newerPost = _post(
      id: 'newer',
      title: 'Newer announcement',
      startsAt: DateTime.utc(2026, 10, 25),
    );

    await tester.pumpWidget(
      _dashboardApp(
        weekPostsAsync: AsyncData([priorityPost, newerPost]),
        memberSession: _memberSession,
      ),
    );
    await tester.pumpAndSettle();

    final priorityY = tester.getTopLeft(find.text(priorityPost.title)).dy;
    final newerY = tester.getTopLeft(find.text(newerPost.title)).dy;
    expect(priorityY, lessThan(newerY));
  });

  testWidgets('hero request errors are not presented as an empty bulletin', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: LifeSundayHeroStateView(
          postAsync: AsyncError(StateError('offline'), StackTrace.empty),
          showUnreadBadge: false,
          onRetry: _noop,
        ),
      ),
    );

    expect(
      find.text('This section could not be loaded. Please try again.'),
      findsOneWidget,
    );
    expect(
      find.text(
        'Sunday worship information will appear here after church staff publish it.',
      ),
      findsNothing,
    );
  });

  testWidgets('month feed errors do not hide the group section', (
    tester,
  ) async {
    await tester.pumpWidget(
      _dashboardApp(
        selectedTab: LifeDashboardTab.groups,
        monthPostsAsync: AsyncError(StateError('offline'), StackTrace.empty),
        memberSession: _memberSession,
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('This section could not be loaded. Please try again.'),
      findsOneWidget,
    );
    expect(
      find.text('No groups or fellowships are available right now.'),
      findsOneWidget,
    );
  });

  testWidgets('newcomer action is omitted for signed-in members', (
    tester,
  ) async {
    await tester.pumpWidget(_dashboardApp(memberSession: _memberSession));
    await tester.pumpAndSettle();

    expect(find.text('New here?'), findsNothing);
  });
}

Widget _dashboardApp({
  AsyncValue<List<LifePost>> weekPostsAsync = const AsyncData([]),
  AsyncValue<List<LifePost>> monthPostsAsync = const AsyncData([]),
  AsyncValue<LifePost?> heroPostAsync = const AsyncData(null),
  LifeDashboardTab selectedTab = LifeDashboardTab.week,
  MemberSession? memberSession,
}) {
  return _localizedApp(
    child: LifeDashboardView(
      weekPostsAsync: weekPostsAsync,
      monthPostsAsync: monthPostsAsync,
      heroPostAsync: heroPostAsync,
      selectedTab: selectedTab,
      onTabChanged: _ignoreTab,
      onRetryWeekPosts: _noop,
      onRetryMonthPosts: _noop,
      onRetryHero: _noop,
      prayerEnabled: true,
      publicPrayerRequestsAsync: const AsyncData([]),
      memberPrayerRequestsAsync: const AsyncData([]),
      memberSession: memberSession,
      groupsAsync: const AsyncData([]),
      coursesAsync: const AsyncData([]),
      servingAsync: const AsyncData([]),
      careRequestsAsync: const AsyncData([]),
      memberSessionResolved: true,
    ),
  );
}

Widget _localizedApp({required Widget child}) {
  return ProviderScope(
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: Scaffold(body: child),
    ),
  );
}

LifePost _post({
  required String id,
  required String title,
  int sort = 0,
  required DateTime startsAt,
}) {
  return LifePost(
    id: id,
    type: 'announcement',
    title: title,
    body: 'Body',
    meta: '',
    iconName: 'church',
    sort: sort,
    startsAt: startsAt,
  );
}

const _memberSession = MemberSession(
  accessToken: 'token',
  member: MemberProfile(
    id: 'member',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

void _noop() {}

void _ignoreTab(LifeDashboardTab tab) {}
