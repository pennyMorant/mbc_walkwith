import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_bottom_sheet_scaffold.dart';

void main() {
  testWidgets(
    'opens the canonical scroll-controlled sheet with a drag handle',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => TextButton(
              onPressed: () => showAppBottomSheet<void>(
                context: context,
                builder: (context) => const Text('Sheet content'),
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();

      final bottomSheet = tester.widget<BottomSheet>(find.byType(BottomSheet));
      expect(bottomSheet.showDragHandle, isTrue);
      expect(find.text('Sheet content'), findsOneWidget);
    },
  );

  testWidgets('adds keyboard inset to the canonical sheet padding', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(viewInsets: const EdgeInsets.only(bottom: 280)),
          child: child!,
        ),
        home: const Scaffold(
          resizeToAvoidBottomInset: false,
          body: AppBottomSheetScaffold(
            child: SizedBox(height: 600, child: Text('Form content')),
          ),
        ),
      ),
    );

    final scrollView = tester.widget<SingleChildScrollView>(
      find.byType(SingleChildScrollView),
    );
    final padding = scrollView.padding!.resolve(TextDirection.ltr);

    expect(padding, const EdgeInsets.fromLTRB(20, 0, 20, 300));
    expect(find.text('Form content'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
