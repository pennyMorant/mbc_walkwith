import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/giving_record.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/annual_statement_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/giving_history_cards.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('giving summary card formats cents as money', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        child: const GivingSummaryCard(
          overview: GivingOverview(
            summary: GivingSummary(
              year: 2026,
              totalAmountCents: 376300,
              transactionCount: 8,
              currency: 'USD',
            ),
            transactions: [],
            statements: [],
          ),
        ),
      ),
    );

    expect(find.textContaining('USD 3,763.00'), findsOneWidget);
    expect(find.textContaining('376300'), findsNothing);
  });

  testWidgets('giving transaction card labels unknown statuses explicitly', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: GivingTransactionCard(
          transaction: GivingTransaction(
            id: 'giving-unknown-status',
            amountCents: 1200,
            currency: 'USD',
            category: 'general',
            status: 'requires_review',
            givenAt: DateTime.utc(2026, 1, 4),
          ),
        ),
      ),
    );

    expect(find.text('Unknown status'), findsOneWidget);
    expect(find.text('Succeeded'), findsNothing);
  });

  testWidgets('giving transaction fallback category follows locale', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        locale: const Locale('zh'),
        child: GivingTransactionCard(
          transaction: GivingTransaction(
            id: 'giving-empty-category',
            amountCents: 1200,
            currency: 'USD',
            category: '',
            status: 'succeeded',
            givenAt: DateTime.utc(2026, 1, 4),
          ),
        ),
      ),
    );

    expect(find.text('奉献'), findsOneWidget);
    expect(find.text('Giving'), findsNothing);
  });

  testWidgets('annual statement card labels unknown statuses explicitly', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: const AnnualStatementCard(
          statement: GivingStatement(
            id: 'statement-unknown-status',
            taxYear: 2026,
            totalAmountCents: 1200,
            currency: 'USD',
            status: 'requires_review',
            generatedAt: null,
          ),
          isLoading: false,
          onPreview: null,
        ),
      ),
    );

    expect(find.text('Unknown status'), findsWidgets);
    expect(find.text('Ready'), findsNothing);
  });
}

Widget _localizedApp({
  required Widget child,
  Locale locale = const Locale('en'),
}) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(body: Center(child: child)),
  );
}
