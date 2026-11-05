import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/bible_book_section.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/chapter_grid_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets(
    'chapter sheet stacks long book name and count on a narrow view',
    (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _app(
          textScaler: const TextScaler.linear(1.3),
          child: ChapterGridSheet(
            book: _songOfSolomon,
            useEnglishNames: true,
            currentChapter: 3,
            onChapterSelected: (_) {},
          ),
        ),
      );

      final title = find.text(_songOfSolomon.nameEn);
      final count = find.byType(AppChip).first;
      expect(
        tester.getTopLeft(count).dy,
        greaterThan(tester.getBottomLeft(title).dy),
      );
      expect(
        tester.widget<AppButton>(find.widgetWithText(AppButton, '3')).selected,
        isTrue,
      );
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('book section stacks localized title and count for large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: CustomScrollView(
          slivers: [
            BibleBookSection(
              title: 'Libros poéticos y sapienciales',
              books: const [_songOfSolomon],
              currentBookId: _songOfSolomon.id,
              useEnglishNames: true,
              onBookSelected: (_) {},
            ),
          ],
        ),
      ),
    );

    final title = find.text('Libros poéticos y sapienciales');
    final count = find.byType(AppChip).first;
    expect(
      tester.getTopLeft(count).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(
      tester
          .widget<AppButton>(
            find.widgetWithText(AppButton, _songOfSolomon.nameEn),
          )
          .selected,
      isTrue,
    );
    expect(tester.takeException(), isNull);
  });
}

Widget _app({
  required Widget child,
  TextScaler textScaler = TextScaler.noScaling,
}) {
  return MaterialApp(
    locale: const Locale('es'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    builder: (context, appChild) => MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: textScaler),
      child: appChild!,
    ),
    home: Scaffold(body: child),
  );
}

const _songOfSolomon = BibleBook(
  id: 'sng',
  testament: BibleTestament.old,
  category: BibleBookCategory.wisdom,
  nameZh: '雅歌',
  nameEn: 'Song of Solomon',
  abbreviationZh: '歌',
  abbreviationEn: 'Song',
  chapterCount: 8,
  sortOrder: 22,
);
