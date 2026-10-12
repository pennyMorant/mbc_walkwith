import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';

void main() {
  Widget buildSubject(Widget child) {
    return MaterialApp(
      theme: ThemeData(useMaterial3: true),
      home: Scaffold(body: Center(child: child)),
    );
  }

  testWidgets('selected button renders and remains tappable', (tester) async {
    var taps = 0;

    await tester.pumpWidget(
      buildSubject(
        AppButton(label: 'Genesis', selected: true, onPressed: () => taps++),
      ),
    );

    await tester.tap(find.text('Genesis'));
    await tester.pump();

    expect(taps, 1);
  });

  testWidgets('default button keeps accessible minimum height', (tester) async {
    await tester.pumpWidget(
      buildSubject(AppButton(label: 'Read', onPressed: () {})),
    );

    final button = tester.widget<FilledButton>(find.byType(FilledButton));

    expect(button.style?.minimumSize?.resolve({})?.height, 44);
  });

  testWidgets('selected button uses selected container colors by default', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildSubject(
        AppButton(label: 'Genesis', selected: true, onPressed: () {}),
      ),
    );

    final colorScheme = Theme.of(
      tester.element(find.byType(AppButton)),
    ).colorScheme;
    final button = tester.widget<FilledButton>(find.byType(FilledButton));

    expect(
      button.style?.backgroundColor?.resolve({}),
      colorScheme.secondaryContainer,
    );
    expect(
      button.style?.foregroundColor?.resolve({}),
      colorScheme.onSecondaryContainer,
    );
  });

  testWidgets('disabled button does not trigger action', (tester) async {
    await tester.pumpWidget(
      buildSubject(const AppButton(label: 'Disabled', onPressed: null)),
    );

    await tester.tap(find.text('Disabled'));
    await tester.pump();

    expect(find.text('Disabled'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
    );
  });

  testWidgets('loading button shows progress and suppresses action', (
    tester,
  ) async {
    var taps = 0;

    await tester.pumpWidget(
      buildSubject(
        AppButton(label: 'Save', loading: true, onPressed: () => taps++),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.tap(find.text('Save'));
    await tester.pump();

    expect(taps, 0);
    final colorScheme = Theme.of(
      tester.element(find.byType(AppButton)),
    ).colorScheme;
    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(button.onPressed, isNull);
    expect(
      button.style?.backgroundColor?.resolve({WidgetState.disabled}),
      colorScheme.surfaceContainerHighest,
    );
    expect(
      button.style?.foregroundColor?.resolve({WidgetState.disabled}),
      colorScheme.onSurfaceVariant,
    );
  });

  testWidgets('disabled text button keeps transparent background', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildSubject(
        const AppButton(
          label: 'Text action',
          variant: AppButtonVariant.text,
          onPressed: null,
        ),
      ),
    );

    final colorScheme = Theme.of(
      tester.element(find.byType(AppButton)),
    ).colorScheme;
    final button = tester.widget<TextButton>(find.byType(TextButton));

    expect(
      button.style?.backgroundColor?.resolve({WidgetState.disabled}),
      Colors.transparent,
    );
    expect(
      button.style?.foregroundColor?.resolve({WidgetState.disabled}),
      colorScheme.onSurface.withValues(alpha: 0.38),
    );
  });
}
