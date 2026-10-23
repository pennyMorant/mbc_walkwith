import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('app chip constrains a long localized label', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(null, Brightness.light),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: const TextScaler.linear(1.3)),
          child: child!,
        ),
        home: const Scaffold(
          body: Center(
            child: SizedBox(
              width: 120,
              child: AppChip(label: 'Boletín semanal de la iglesia'),
            ),
          ),
        ),
      ),
    );

    expect(find.text('Boletín semanal de la iglesia'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
