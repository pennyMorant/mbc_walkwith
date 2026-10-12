import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/bible_verse_list.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('tapping a verse opens its tools directly', (tester) async {
    BibleVerse? openedVerse;
    await tester.pumpWidget(
      _testApp(onOpenVerseTools: (verse) => openedVerse = verse),
    );

    await tester.tap(find.text(_verses.first.text));
    await tester.pump();

    expect(openedVerse, _verses.first);
    expect(find.byType(IconButton), findsNothing);
  });

  testWidgets('long press keeps the AI study action separate', (tester) async {
    BibleVerse? explainedVerse;
    BibleVerse? openedVerse;
    await tester.pumpWidget(
      _testApp(
        onExplainVerse: (verse) => explainedVerse = verse,
        onOpenVerseTools: (verse) => openedVerse = verse,
      ),
    );

    await tester.longPress(find.text(_verses.last.text));
    await tester.pump();

    expect(explainedVerse, _verses.last);
    expect(openedVerse, isNull);
  });
}

Widget _testApp({
  ValueChanged<BibleVerse>? onExplainVerse,
  ValueChanged<BibleVerse>? onOpenVerseTools,
}) {
  final keys = <String, GlobalKey>{};
  return MaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(
      body: SizedBox(
        width: 320,
        child: SingleChildScrollView(
          child: BibleVerseList(
            verses: _verses,
            readerScale: 1.3,
            highlightedVerseId: null,
            currentTtsVerseId: null,
            annotations: const {},
            verseKey: (verseId) => keys.putIfAbsent(verseId, GlobalKey.new),
            onExplainVerse: onExplainVerse,
            onOpenVerseTools: onOpenVerseTools ?? (_) {},
          ),
        ),
      ),
    ),
  );
}

const _verses = [
  BibleVerse(
    id: 'rom.8.28',
    number: 28,
    text: 'All things work together for good for those who love God.',
  ),
  BibleVerse(
    id: 'rom.8.29',
    number: 29,
    text: 'Those he foreknew he also predestined to be conformed.',
  ),
];
