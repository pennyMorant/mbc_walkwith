import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/shared/widgets/app_error_state.dart';

void main() {
  testWidgets('renders its message and retries through the shared button', (
    tester,
  ) async {
    var retries = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true),
        home: Scaffold(
          body: AppErrorState(
            title: 'Could not load',
            body: 'Please try again.',
            retryLabel: 'Retry',
            onRetry: () => retries++,
          ),
        ),
      ),
    );

    expect(find.text('Could not load'), findsOneWidget);
    expect(find.text('Please try again.'), findsOneWidget);
    expect(find.byType(AppButton), findsOneWidget);

    await tester.tap(find.text('Retry'));
    expect(retries, 1);
  });

  testWidgets('supports a feature-specific icon', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AppErrorState(
            title: 'Reader unavailable',
            body: 'Try again.',
            retryLabel: 'Retry',
            icon: Icons.menu_book_outlined,
            onRetry: () {},
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.menu_book_outlined), findsOneWidget);
  });
}
