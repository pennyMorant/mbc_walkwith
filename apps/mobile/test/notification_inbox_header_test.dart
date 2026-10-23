import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/notification_inbox_header.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets(
    'notification header stacks actions on a narrow large-text view',
    (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _app(
          const NotificationInboxHeader(
            unreadCount: 140,
            isSyncing: false,
            hasItems: true,
            onRefresh: _noop,
            onMarkAllRead: _noop,
            onClear: _noop,
          ),
        ),
      );

      final titleTop = tester
          .getTopLeft(find.text('Notificaciones recientes'))
          .dy;
      final actionTop = tester.getTopLeft(find.byIcon(Icons.refresh)).dy;
      expect(actionTop, greaterThan(titleTop));
      expect(find.text('99+'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('notification header disables item actions while syncing', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        const NotificationInboxHeader(
          unreadCount: 1,
          isSyncing: true,
          hasItems: true,
          onRefresh: _noop,
          onMarkAllRead: _noop,
          onClear: _noop,
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    for (final icon in [Icons.done_all, Icons.delete_outline]) {
      final button = tester.widget<IconButton>(
        find.ancestor(of: find.byIcon(icon), matching: find.byType(IconButton)),
      );
      expect(button.onPressed, isNull);
    }
  });
}

Widget _app(Widget child) {
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
    home: Scaffold(body: child),
  );
}

void _noop() {}
