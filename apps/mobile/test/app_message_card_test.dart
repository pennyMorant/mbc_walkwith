import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_message_card.dart';

void main() {
  testWidgets('renders optional title, body, and action', (tester) async {
    var pressed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AppMessageCard(
            title: 'Account',
            body: 'Sign in to continue.',
            action: TextButton(
              onPressed: () => pressed = true,
              child: const Text('Sign in'),
            ),
          ),
        ),
      ),
    );

    expect(find.byType(Card), findsOneWidget);
    expect(find.text('Account'), findsOneWidget);
    expect(find.text('Sign in to continue.'), findsOneWidget);

    await tester.tap(find.text('Sign in'));
    expect(pressed, isTrue);
  });

  testWidgets('omits title and action when they are not supplied', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: AppMessageCard(body: 'Nothing here yet.')),
      ),
    );

    expect(find.text('Nothing here yet.'), findsOneWidget);
    expect(find.byType(TextButton), findsNothing);
    expect(find.byType(Column), findsOneWidget);
  });
}
