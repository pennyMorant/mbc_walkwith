import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/presentation/group_detail_page.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/my_groups_page.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('group detail shows the complete public group projection', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => null),
          ministryGroupByIdProvider.overrideWith((ref, groupId) async {
            expect(groupId, _publicGroup.id);
            return _publicGroup;
          }),
        ],
        child: const GroupDetailPage(groupId: 'public-fellowship'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Public Fellowship'), findsOneWidget);
    expect(find.text(_longDescription), findsOneWidget);
    expect(find.text('Leader Lee'), findsOneWidget);
    expect(find.text('8/20 members'), findsOneWidget);
  });

  testWidgets('submitted application can be withdrawn from group detail', (
    tester,
  ) async {
    final repository = _RecordingGroupRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          groupRepositoryProvider.overrideWithValue(repository),
          ministryGroupByIdProvider.overrideWith(
            (ref, groupId) async => _submittedGroup,
          ),
        ],
        child: const GroupDetailPage(groupId: 'public-fellowship'),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Withdraw application'));
    await tester.pumpAndSettle();

    expect(repository.withdrawnGroupId, _submittedGroup.id);
    expect(find.text('Application withdrawn.'), findsOneWidget);
  });

  testWidgets('my groups renders canonical member memberships', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          myMinistryGroupsProvider.overrideWith(
            (ref) async => const [_memberGroup],
          ),
        ],
        child: const MyGroupsPage(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('My groups'), findsOneWidget);
    expect(find.text('Member Fellowship'), findsOneWidget);
    expect(find.text('You are a member'), findsWidgets);
  });

  testWidgets('full group exposes a disabled capacity action', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          ministryGroupByIdProvider.overrideWith(
            (ref, groupId) async => _fullGroup,
          ),
        ],
        child: const GroupDetailPage(groupId: 'full-group'),
      ),
    );
    await tester.pumpAndSettle();

    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Group is full'),
    );
    expect(button.onPressed, isNull);
  });
}

Widget _localizedApp({
  required List<Override> overrides,
  required Widget child,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: child,
    ),
  );
}

class _RecordingGroupRepository implements GroupRepository {
  String? withdrawnGroupId;

  @override
  Future<void> withdrawApplication(
    MinistryGroup group,
    MemberSession session,
  ) async {
    withdrawnGroupId = group.id;
  }

  @override
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  }) async {}

  @override
  Future<MinistryGroup> getGroup(
    String groupId,
    MemberSession? session,
  ) async => _publicGroup;

  @override
  Future<List<MinistryGroup>> getGroups(MemberSession? session) async => const [
    _publicGroup,
  ];

  @override
  Future<List<MinistryGroup>> getMyGroups(MemberSession session) async =>
      const [_memberGroup];
}

const _longDescription =
    'A weekly Bible fellowship where members share a meal, study Scripture, '
    'pray for one another, and practice following Jesus together.';

const _publicGroup = MinistryGroup(
  id: 'public-fellowship',
  name: 'Public Fellowship',
  description: _longDescription,
  meetingTime: 'Friday 7 PM',
  location: 'Room 201',
  leaderName: 'Leader Lee',
  visibility: 'public',
  status: 'active',
  capacity: 20,
  memberCount: 8,
  myApplicationId: null,
  myApplicationStatus: null,
  myMembershipStatus: null,
);

const _submittedGroup = MinistryGroup(
  id: 'public-fellowship',
  name: 'Public Fellowship',
  description: _longDescription,
  meetingTime: 'Friday 7 PM',
  location: 'Room 201',
  leaderName: 'Leader Lee',
  visibility: 'public',
  status: 'active',
  capacity: 20,
  memberCount: 8,
  myApplicationId: 'application-1',
  myApplicationStatus: 'submitted',
  myMembershipStatus: null,
);

const _memberGroup = MinistryGroup(
  id: 'member-fellowship',
  name: 'Member Fellowship',
  description: 'A member fellowship.',
  meetingTime: 'Sunday 1 PM',
  location: 'Room 101',
  leaderName: 'Leader Chan',
  visibility: 'members',
  status: 'active',
  capacity: null,
  memberCount: 12,
  myApplicationId: 'approved-application',
  myApplicationStatus: 'approved',
  myMembershipStatus: 'active',
);

const _fullGroup = MinistryGroup(
  id: 'full-group',
  name: 'Full Group',
  description: 'This group has reached capacity.',
  meetingTime: 'Tuesday 7 PM',
  location: 'Room 202',
  leaderName: 'Leader Wong',
  visibility: 'members',
  status: 'active',
  capacity: 8,
  memberCount: 8,
  myApplicationId: null,
  myApplicationStatus: null,
  myMembershipStatus: null,
);

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: 'member-fellowship',
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
