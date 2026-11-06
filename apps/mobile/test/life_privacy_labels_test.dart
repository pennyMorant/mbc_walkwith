import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/prayer_request.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/care_request_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/prayer_request_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/prayer_request_section.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('prayer cards display public visibility explicitly', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: PrayerRequestCard(request: _publicPrayerRequest, isMine: false),
      ),
    );

    expect(find.text('Public'), findsOneWidget);
    expect(find.text('Private'), findsNothing);
  });

  testWidgets('prayer section keeps member copy before public duplicate', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: PrayerRequestSection(
          publicPrayerRequestsAsync: AsyncData([_publicDuplicatePrayerRequest]),
          memberPrayerRequestsAsync: AsyncData([_memberDuplicatePrayerRequest]),
          memberSession: _memberSession,
        ),
      ),
    );

    expect(find.text('Member copy'), findsOneWidget);
    expect(find.text('Public copy'), findsNothing);
  });

  testWidgets('life cards label unknown privacy and visibility explicitly', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: ListView(
          children: [
            PrayerRequestCard(
              request: _unknownVisibilityPrayerRequest,
              isMine: false,
            ),
            CareRequestCard(request: _unknownPrivacyCareRequest),
          ],
        ),
      ),
    );

    expect(find.text('Unknown visibility'), findsOneWidget);
    expect(find.text('Unknown privacy'), findsOneWidget);
    expect(find.text('Private'), findsNothing);
    expect(find.text('Pastoral team only'), findsNothing);
  });

  testWidgets(
    'prayer and care cards fit Spanish large text on a small screen',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _localizedApp(
          locale: const Locale('es'),
          textScaler: const TextScaler.linear(1.3),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              PrayerRequestCard(
                request: _memberDuplicatePrayerRequest,
                isMine: true,
              ),
              const SizedBox(height: 12),
              CareRequestCard(request: _assignedCareRequest),
            ],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Mías'), findsOneWidget);
      expect(find.text('Solo pastoral'), findsOneWidget);
      expect(find.byIcon(Icons.favorite_outline), findsNothing);
      expect(find.byIcon(Icons.volunteer_activism_outlined), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
}

Widget _localizedApp({
  required Widget child,
  Locale locale = const Locale('en'),
  TextScaler textScaler = TextScaler.noScaling,
}) {
  return ProviderScope(
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      builder: (context, appChild) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: textScaler),
        child: appChild!,
      ),
      home: Scaffold(body: child),
    ),
  );
}

final _publicPrayerRequest = PrayerRequest(
  id: 'prayer_public_visibility',
  title: 'Prayer request',
  body: 'Please pray for our church family.',
  visibility: 'public',
  groupId: null,
  status: 'approved',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _unknownVisibilityPrayerRequest = PrayerRequest(
  id: 'prayer_unknown_visibility',
  title: 'Prayer request',
  body: 'Please pray for this need.',
  visibility: 'regional',
  groupId: null,
  status: 'approved',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _memberDuplicatePrayerRequest = PrayerRequest(
  id: 'prayer_duplicate',
  title: 'Member copy',
  body: 'Please keep the member-visible version.',
  visibility: 'members',
  groupId: null,
  status: 'pending',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _publicDuplicatePrayerRequest = PrayerRequest(
  id: 'prayer_duplicate',
  title: 'Public copy',
  body: 'The public stream should not overwrite the member copy.',
  visibility: 'public',
  groupId: null,
  status: 'approved',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _unknownPrivacyCareRequest = CareRequest(
  id: 'care_unknown_privacy',
  userId: 'member_1',
  memberDisplayName: 'Member',
  memberEmail: 'member@example.com',
  title: 'Pastoral care',
  body: 'A care request summary.',
  status: 'submitted',
  privacyLevel: 'regional_team',
  assigneeName: '',
  nextFollowUpAt: null,
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _assignedCareRequest = CareRequest(
  id: 'care_assigned',
  userId: 'member_1',
  memberDisplayName: 'Member',
  memberEmail: 'member@example.com',
  title: 'Acompañamiento pastoral para nuestra familia',
  body: 'Nos gustaría conversar con el equipo pastoral durante esta semana.',
  status: 'in_progress',
  privacyLevel: 'pastoral_only',
  assigneeName: 'Equipo de acompañamiento pastoral',
  nextFollowUpAt: DateTime.utc(2026, 11, 8),
  createdAt: DateTime.utc(2026, 11, 1),
  updatedAt: DateTime.utc(2026, 11, 2),
);

const _memberSession = MemberSession(
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
);
