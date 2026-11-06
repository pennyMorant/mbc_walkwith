import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_loading_state.dart';

void main() {
  testWidgets('centers a progress indicator', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: AppLoadingState())),
    );

    expect(find.byType(Center), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('exposes an optional live region label', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: AppLoadingState(semanticLabel: 'Loading notes')),
      ),
    );

    final semantics = tester.widget<Semantics>(
      find.byWidgetPredicate(
        (widget) =>
            widget is Semantics && widget.properties.label == 'Loading notes',
      ),
    );
    expect(semantics.properties.label, 'Loading notes');
    expect(semantics.properties.liveRegion, isTrue);
  });
}
