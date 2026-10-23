import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/reading_plan_collection_states.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('reading plan error explains failure and retries', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var retryCount = 0;

    await tester.pumpWidget(
      _app(
        child: ReadingPlanCollectionErrorState(onRetry: () => retryCount += 1),
      ),
    );

    final l10n = AppLocalizations.of(
      tester.element(find.byType(ReadingPlanCollectionErrorState)),
    )!;
    expect(find.text(l10n.readingPlanLoadErrorBody), findsOneWidget);
    expect(find.byType(AppButton), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text(l10n.retryAction));
    expect(retryCount, 1);
  });

  testWidgets('reading plan empty state preserves its message', (tester) async {
    const message = 'No active plan';
    await tester.pumpWidget(
      _app(child: const ReadingPlanCollectionEmptyState(message: message)),
    );

    expect(find.text(message), findsOneWidget);
  });
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
    home: Scaffold(body: child),
  );
}
