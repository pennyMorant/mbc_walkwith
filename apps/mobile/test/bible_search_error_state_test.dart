import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/data/study_repository.dart';
import 'package:mbc_walkwith/features/study/presentation/bible_search_page.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('Bible search hides technical errors and retries the query', (
    tester,
  ) async {
    var searchCount = 0;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleSearchProvider.overrideWith((ref, request) async {
            searchCount += 1;
            throw StateError('private database detail');
          }),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const BibleSearchPage(),
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), 'grace');
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle();

    expect(searchCount, 1);
    expect(find.text('Search failed'), findsOneWidget);
    expect(
      find.text('Bible search could not be completed. Please try again.'),
      findsOneWidget,
    );
    expect(find.textContaining('private database detail'), findsNothing);

    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(searchCount, 2);
  });
}
