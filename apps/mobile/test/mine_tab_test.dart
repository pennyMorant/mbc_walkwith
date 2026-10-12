import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/storage/shared_preferences_provider.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/mine_tab.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('mine tab surfaces member church life overview', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(preferences),
          memberSessionProvider.overrideWith(
            (ref) async => const MemberSession(
              accessToken: 'member-token',
              member: MemberProfile(
                id: 'member-1',
                email: 'member@example.com',
                displayName: 'Member',
                roles: ['member'],
                appLocale: 'en',
                fellowshipGroupId: null,
                notificationSettings: MemberNotificationSettings.defaults,
              ),
            ),
          ),
          myMinistryGroupsProvider.overrideWith(
            (ref) async => const [
              MinistryGroup(
                id: 'group-1',
                name: 'Friday Fellowship',
                description: 'Weekly fellowship.',
                meetingTime: 'Friday 7 PM',
                location: 'Room 201',
                leaderName: 'Leader',
                visibility: 'members',
                status: 'active',
                capacity: null,
                memberCount: 8,
                myApplicationId: null,
                myApplicationStatus: null,
                myMembershipStatus: 'active',
              ),
            ],
          ),
          myCoursesProvider.overrideWith(
            (ref) async => const [
              CourseLearning(
                id: 'course-1',
                title: 'Foundations',
                description: 'Member class.',
                teacherName: 'Pastor',
                location: 'Room 101',
                scheduleText: 'Sunday',
                visibility: 'members',
                status: 'open',
                capacity: null,
                enrolledCount: 5,
                lessonCount: 4,
                myEnrollmentStatus: 'enrolled',
                myCompletedLessonCount: 1,
                lessons: [],
              ),
            ],
          ),
          servingAssignmentsProvider.overrideWith(
            (ref) async => [
              ServingAssignment(
                id: 'serving-1',
                teamName: 'Hospitality',
                roleName: 'Usher',
                title: 'Sunday usher',
                startsAt: DateTime.utc(2026, 7, 5, 16),
                endsAt: null,
                location: 'Sanctuary',
                status: 'scheduled',
                note: '',
                responseNote: '',
              ),
            ],
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const MineTab(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('My church life'), findsNothing);
    expect(find.text('Member'), findsOneWidget);
    expect(find.text('member@example.com'), findsOneWidget);
    expect(find.text('active'), findsOneWidget);
    expect(find.text('member'), findsOneWidget);
    expect(find.text('Friday Fellowship'), findsOneWidget);
    expect(find.text('1 class'), findsOneWidget);
    expect(find.text('1 serving role'), findsOneWidget);
    final servingActions = tester.widgetList<InkWell>(
      find.widgetWithText(InkWell, '1 serving role'),
    );
    expect(
      servingActions.any(
        (action) =>
            action.onTap != null && action.customBorder is StadiumBorder,
      ),
      isTrue,
    );
    expect(find.text('mock_foundations'), findsNothing);
    expect(find.text('Edit profile'), findsNothing);
    expect(find.text('Preferences'), findsOneWidget);
    expect(find.text('Notification permission'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Giving and annual statements'),
      240,
    );
    expect(find.text('Giving and annual statements'), findsOneWidget);
    expect(
      find.text(
        'Open giving history, confirmed records, and annual statement PDFs.',
      ),
      findsOneWidget,
    );
    await tester.scrollUntilVisible(find.text('About'), 240);
    expect(find.text('App version'), findsOneWidget);
  });
}
