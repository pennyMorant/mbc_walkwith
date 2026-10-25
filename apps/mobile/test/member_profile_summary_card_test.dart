import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/member_profile_summary_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('profile summary stacks Spanish labels for large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: const MemberProfileSummaryCard(member: _member),
      ),
    );

    final l10n = AppLocalizations.of(
      tester.element(find.byType(MemberProfileSummaryCard)),
    )!;
    final emailLabel = find.text(l10n.memberEmailLabel);
    final emailValue = find.text('member.with.long.email@example.com');
    expect(emailLabel, findsOneWidget);
    expect(emailValue, findsOneWidget);
    expect(find.text('Activo'), findsOneWidget);
    expect(find.text('active'), findsNothing);
    expect(
      tester.getTopLeft(emailValue).dy,
      greaterThan(tester.getTopLeft(emailLabel).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'profile summary keeps label and value inline when space allows',
    (tester) async {
      await tester.pumpWidget(
        _app(
          width: 560,
          child: const MemberProfileSummaryCard(member: _member),
        ),
      );

      final l10n = AppLocalizations.of(
        tester.element(find.byType(MemberProfileSummaryCard)),
      )!;
      expect(
        tester.getTopLeft(find.text(l10n.memberEmailLabel)).dy,
        tester.getTopLeft(find.text('member.with.long.email@example.com')).dy,
      );
    },
  );
}

Widget _app({
  required Widget child,
  double? width,
  TextScaler textScaler = TextScaler.noScaling,
}) {
  return MaterialApp(
    locale: const Locale('es'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    builder: (context, appChild) => MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: textScaler),
      child: appChild!,
    ),
    home: Scaffold(
      body: Center(
        child: SizedBox(
          width: width,
          child: Padding(padding: const EdgeInsets.all(20), child: child),
        ),
      ),
    ),
  );
}

const _member = MemberProfile(
  id: 'member-1',
  email: 'member.with.long.email@example.com',
  displayName: 'Member',
  roles: ['member'],
  appLocale: 'es',
  fellowshipGroupId: 'Grupo de compañerismo en español',
  notificationSettings: MemberNotificationSettings.defaults,
);
