import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_tab_views.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('guest group tab keeps the public catalog visible', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const Scaffold(
            body: LifeGroupsTabView(
              posts: [],
              groupsAsync: AsyncData([_publicGroup]),
              memberSession: null,
              showUnreadBadges: false,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Optional sign in'), findsOneWidget);
    expect(find.text('Public Fellowship'), findsOneWidget);
    final applyButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Apply to join'),
    );
    expect(applyButton.onPressed, isNull);
  });
}

const _publicGroup = MinistryGroup(
  id: 'public-fellowship',
  name: 'Public Fellowship',
  description: 'A weekly Bible fellowship.',
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
