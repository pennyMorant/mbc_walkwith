part of 'widget_test.dart';

void registerMemberAuthWidgetChecks() {
  testWidgets('member sign-in keeps a clear two-step flow on a small screen', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await tester.pump();
    GoRouter.of(tester.element(find.byType(Scaffold).first))
        .pushNamed(AppRouteNames.memberLoginEmail);
    await _pumpUntilFound(tester, find.text('欢迎回来'));

    expect(
      find.byKey(const ValueKey('member_auth_brand_logo')),
      findsOneWidget,
    );
    expect(find.text('欢迎回来'), findsOneWidget);
    expect(find.widgetWithText(AppButton, '下一步'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.enterText(find.byType(TextField), 'invalid-email');
    await tester.tap(find.widgetWithText(AppButton, '下一步'));
    await tester.pump();
    expect(find.text('请输入有效的邮箱地址。'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'member@example.com');
    await tester.tap(find.widgetWithText(AppButton, '下一步'));
    await _pumpUntilFound(
      tester,
      find.byKey(const ValueKey('member_auth_account_row')),
    );

    expect(
      find.byKey(const ValueKey('member_auth_account_row')),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('member_auth_account_row')),
        matching: find.text('member@example.com'),
      ),
      findsOneWidget,
    );
    expect(find.widgetWithText(AppButton, '登录'), findsOneWidget);
    expect(find.text('忘记密码？'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('member registration uses shared controls on a small screen', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final harness = await _localizedApp(locale: const Locale('es'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await tester.pump();
    GoRouter.of(tester.element(find.byType(Scaffold).first))
        .pushNamed(AppRouteNames.memberRegister);
    await _pumpUntilFound(tester, find.text('Registrarse'));

    expect(find.byType(AppFilledTextField), findsNWidgets(3));
    expect(find.widgetWithText(AppButton, 'Registrarse'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('password recovery uses shared controls on a small screen', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final harness = await _localizedApp(locale: const Locale('es'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await tester.pump();
    GoRouter.of(tester.element(find.byType(Scaffold).first)).pushNamed(
      AppRouteNames.memberPasswordRecovery,
      extra: 'member@example.com',
    );
    await _pumpUntilFound(tester, find.text('Restablecer contraseña'));

    expect(find.byType(AppFilledTextField), findsOneWidget);
    expect(find.widgetWithText(AppButton, 'Siguiente'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('email verification uses shared controls on a small screen', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final harness = await _localizedApp(locale: const Locale('es'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await tester.pump();
    GoRouter.of(tester.element(find.byType(Scaffold).first)).pushNamed(
      AppRouteNames.memberEmailVerification,
      extra: const MemberCodeRequestResult(
        challengeId: 'challenge',
        expiresInSeconds: 600,
        resendAfterSeconds: 60,
        maskedEmail: 'm***@example.com',
      ),
    );
    await _pumpUntilFound(tester, find.text('Verificar correo'));

    expect(find.byType(AppFilledTextField), findsOneWidget);
    expect(find.widgetWithText(AppButton, 'Verificar correo'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
