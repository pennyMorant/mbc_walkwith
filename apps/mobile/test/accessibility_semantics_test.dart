import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_tab_bar.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/chapter_grid_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_unread_count_badge.dart';

void main() {
  testWidgets('life tab unread badge includes semantic context', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        const Center(
          child: LifeDashboardTabLabel(label: 'Events', unreadCount: 2),
        ),
      ),
    );

    expect(find.bySemanticsLabel('Events, 2 unread items'), findsOneWidget);
  });

  testWidgets('chapter picker buttons include book and chapter semantics', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        ChapterGridSheet(
          book: _romans,
          useEnglishNames: true,
          currentChapter: 8,
          onChapterSelected: (_) {},
        ),
      ),
    );

    expect(find.bySemanticsLabel('Romans chapter 8'), findsOneWidget);
  });

  testWidgets('unread badge caps display and keeps the exact semantic count', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        const AppUnreadCountBadge(
          count: 140,
          semanticLabel: 'Notifications, 140 unread items',
          child: Icon(Icons.notifications_outlined),
        ),
      ),
    );

    expect(find.text('99+'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Notifications, 140 unread items'),
      findsOneWidget,
    );
  });
}

Widget _localizedApp(Widget child) {
  return MaterialApp(
    locale: const Locale('en'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: Scaffold(body: child),
  );
}

const _romans = BibleBook(
  id: 'rom',
  testament: BibleTestament.newTestament,
  category: BibleBookCategory.paulineLetters,
  nameZh: '罗马书',
  nameEn: 'Romans',
  abbreviationZh: 'Rom',
  abbreviationEn: 'Rom',
  chapterCount: 16,
  sortOrder: 45,
);
