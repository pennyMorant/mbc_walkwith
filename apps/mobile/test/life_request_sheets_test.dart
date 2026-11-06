import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/care_repository.dart';
import 'package:mbc_walkwith/features/life/data/prayer_repository.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/prayer_request.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/care_request_sheet.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_support_widgets.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/prayer_request_sheet.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('prayer submission ignores rapid duplicate taps', (tester) async {
    final repository = _PendingPrayerRepository();
    await tester.pumpWidget(
      _testApp(
        overrides: [
          prayerRepositoryProvider.overrideWithValue(repository),
          memberSessionProvider.overrideWith((ref) async => null),
        ],
        child: const PrayerRequestSheet(),
      ),
    );

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'Prayer title');
    await tester.enterText(fields.at(1), 'Please pray for this request.');
    final submit = find.text('Submit');
    await tester.tap(submit);
    await tester.tap(submit);

    expect(repository.submitCount, 1);

    repository.pending.completeError(StateError('test failure'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('care submission ignores rapid duplicate taps', (tester) async {
    final repository = _PendingCareRepository();
    await tester.pumpWidget(
      _testApp(
        overrides: [
          careRepositoryProvider.overrideWithValue(repository),
          memberSessionProvider.overrideWith((ref) async => _memberSession),
        ],
        child: const CareRequestSheet(),
      ),
    );
    await tester.pumpAndSettle();

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'Care title');
    await tester.enterText(fields.at(1), 'I would appreciate a call.');
    final submit = find.text('Request care');
    await tester.tap(submit);
    await tester.tap(submit);

    expect(repository.submitCount, 1);

    repository.pending.completeError(StateError('test failure'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('care form fits Spanish large text with the keyboard open', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 760);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _testApp(
        locale: const Locale('es'),
        textScaler: const TextScaler.linear(1.3),
        viewInsets: const EdgeInsets.only(bottom: 280),
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
        ],
        child: const CareRequestSheet(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Solicitar cuidado'), findsOneWidget);
    expect(find.text('Solo pastoral'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('prayer actions fit Spanish large text on a small screen', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _testApp(
        locale: const Locale('es'),
        textScaler: const TextScaler.linear(1.3),
        child: const SingleChildScrollView(
          child: LifePrayerActionCard(memberSession: _memberSession),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(AppButton), findsNWidgets(2));
    expect(find.text('Enviar solicitud'), findsNWidgets(2));
    expect(tester.takeException(), isNull);
  });
}

Widget _testApp({
  required Widget child,
  List<Override> overrides = const [],
  Locale locale = const Locale('en'),
  TextScaler textScaler = TextScaler.noScaling,
  EdgeInsets viewInsets = EdgeInsets.zero,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      builder: (context, appChild) => MediaQuery(
        data: MediaQuery.of(context)
            .copyWith(textScaler: textScaler, viewInsets: viewInsets),
        child: appChild!,
      ),
      home: Scaffold(body: child),
    ),
  );
}

class _PendingPrayerRepository implements PrayerRepository {
  final pending = Completer<PrayerRequest>();
  int submitCount = 0;

  @override
  Future<List<PrayerRequest>> fetchMemberRequests(
    MemberSession session,
  ) async => const [];

  @override
  Future<List<PrayerRequest>> fetchPublicRequests() async => const [];

  @override
  Future<PrayerRequest> submitRequest({
    required String title,
    required String body,
    required String visibility,
    String? submitterName,
    MemberSession? session,
  }) {
    submitCount += 1;
    return pending.future;
  }
}

class _PendingCareRepository implements CareRepository {
  final pending = Completer<CareRequest>();
  int submitCount = 0;

  @override
  Future<List<CareRequest>> fetchMine(MemberSession session) async => const [];

  @override
  Future<CareRequest> submitRequest({
    required MemberSession session,
    required String title,
    required String body,
    required String privacyLevel,
  }) {
    submitCount += 1;
    return pending.future;
  }
}

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
