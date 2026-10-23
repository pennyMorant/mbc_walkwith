import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/settings/app_settings.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/member_session_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('member card contains long Spanish content on a narrow view', (
    tester,
  ) async {
    await _setNarrowView(tester);

    await tester.pumpWidget(
      _app(
        child: const MemberSessionCard(
          session: _session,
          settings: AppSettings.defaults,
          groupsAsync: AsyncData(_groups),
          coursesAsync: AsyncData(_courses),
          servingAsync: AsyncData(_serving),
        ),
      ),
    );

    expect(find.text(_session.member.displayName), findsOneWidget);
    expect(find.text(_session.member.email), findsOneWidget);
    expect(
      find.text('Grupo de compañerismo con un nombre largo'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('guest card uses the shared sign-in button on a narrow view', (
    tester,
  ) async {
    await _setNarrowView(tester);

    await tester.pumpWidget(
      _app(
        child: const MemberSessionCard(
          session: null,
          settings: AppSettings.defaults,
          groupsAsync: AsyncData(<MinistryGroup>[]),
          coursesAsync: AsyncData(<CourseLearning>[]),
          servingAsync: AsyncData(<ServingAssignment>[]),
        ),
      ),
    );

    expect(find.byType(AppButton), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

Future<void> _setNarrowView(WidgetTester tester) async {
  tester.view.physicalSize = const Size(320, 640);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

Widget _app({required Widget child}) {
  return MaterialApp(
    locale: const Locale('es'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    builder: (context, appChild) => MediaQuery(
      data: MediaQuery.of(context)
          .copyWith(textScaler: const TextScaler.linear(1.3)),
      child: appChild!,
    ),
    home: Scaffold(
      body: Padding(padding: const EdgeInsets.all(20), child: child),
    ),
  );
}

const _session = MemberSession(
  accessToken: 'token',
  member: MemberProfile(
    id: 'member-1',
    email: 'miembro.con.correo.muy.largo@example.com',
    displayName: 'Nombre de miembro suficientemente largo para dos líneas',
    roles: ['member'],
    appLocale: 'es',
    fellowshipGroupId: 'group-1',
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _groups = <MinistryGroup>[
  MinistryGroup(
    id: 'group-1',
    name: 'Grupo de compañerismo con un nombre largo',
    description: '',
    meetingTime: '',
    location: '',
    leaderName: '',
    visibility: 'members',
    status: 'active',
    capacity: null,
    memberCount: 1,
    myApplicationId: null,
    myApplicationStatus: null,
    myMembershipStatus: 'active',
  ),
];

const _courses = <CourseLearning>[];
const _serving = <ServingAssignment>[];
