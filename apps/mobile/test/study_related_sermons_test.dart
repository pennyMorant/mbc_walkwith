import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/related_sermons_section.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/study_chapter_header.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('chapter header contains no fixed sermon copy', (tester) async {
    await tester.pumpWidget(
      _testApp(
        const StudyChapterHeader(
          book: _romans,
          chapter: 1,
          useEnglishNames: false,
          translationLabel: 'CUVS',
          relatedSermonCount: 0,
        ),
      ),
    );

    expect(find.text('罗马书 1'), findsOneWidget);
    expect(find.text('在苦难中的盼望'), findsNothing);
    expect(find.textContaining('AI'), findsNothing);
  });

  testWidgets('related sermon card renders repository sermon data', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        RelatedSermonsSection(
          sermons: const [_relatedSermon],
          onReferenceSelected: (_) {},
        ),
      ),
    );

    expect(find.text('相关讲道'), findsOneWidget);
    expect(find.text(_relatedSermon.title), findsOneWidget);
    expect(find.textContaining(_relatedSermon.speaker), findsOneWidget);
  });
}

Widget _testApp(Widget child) {
  return MaterialApp(
    locale: const Locale('zh'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(body: child),
  );
}

const _romans = BibleBook(
  id: 'rom',
  testament: BibleTestament.newTestament,
  category: BibleBookCategory.paulineLetters,
  nameZh: '罗马书',
  nameEn: 'Romans',
  abbreviationZh: '罗',
  abbreviationEn: 'Rom',
  chapterCount: 16,
  sortOrder: 45,
);

const _relatedSermon = Sermon(
  id: 'sermon-romans-1',
  title: '因信而活',
  speaker: '陈牧师',
  date: '2026-09-27',
  series: '罗马书',
  primaryReference: '罗马书 1:16-17',
  duration: Duration(minutes: 35),
  summary: '从福音的大能理解义人因信得生。',
  outline: [],
  references: [
    SermonReference(
      reference: '罗马书 1:16-17',
      verseId: 'rom.1.16',
      note: '核心经文',
    ),
  ],
);
