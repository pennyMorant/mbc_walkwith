import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../data/study_repository.dart';
import '../domain/bible_book.dart';
import '../domain/bible_translation.dart';
import '../domain/reading_plan.dart';
import 'bible_book_display.dart';
import 'widgets/bible_book_section.dart';
import 'widgets/chapter_grid_sheet.dart';
import 'widgets/continue_reading_card.dart';
import 'widgets/reading_plan_section.dart';
import 'widgets/study_loading_view.dart';
import 'widgets/testament_segmented_control.dart';

class StudyTab extends ConsumerStatefulWidget {
  const StudyTab({super.key});

  @override
  ConsumerState<StudyTab> createState() => _StudyTabState();
}

class _StudyTabState extends ConsumerState<StudyTab> {
  BibleTestament _selectedTestament = BibleTestament.newTestament;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final translation = BibleTranslation.fromLocale(
      Localizations.localeOf(context),
    );
    final booksAsync = ref.watch(bibleBooksProvider(translation.id));
    final progressAsync = ref.watch(readingProgressProvider(translation.id));

    return Scaffold(
      appBar: ShellAppBar(
        title: l10n.studyTitle,
        actions: [
          IconButton(
            tooltip: l10n.bibleSearchTooltip,
            onPressed: _openSearch,
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 240),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        layoutBuilder: (currentChild, previousChildren) {
          return currentChild ?? const SizedBox.shrink();
        },
        child: booksAsync.when(
          loading: () => const StudyLoadingView(key: ValueKey('study-loading')),
          error: (error, stackTrace) => _StudyLoadError(
            key: const ValueKey('study-error'),
            onRetry: () => ref.invalidate(bibleBooksProvider(translation.id)),
          ),
          data: (books) {
            final visibleBooks = books
                .where((book) => book.testament == _selectedTestament)
                .toList();

            return CustomScrollView(
              key: const ValueKey('study-content'),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      layoutBuilder: (currentChild, previousChildren) {
                        return currentChild ?? const SizedBox.shrink();
                      },
                      child: progressAsync.maybeWhen(
                        data: (progress) => ContinueReadingCard(
                          key: const ValueKey('continue-reading-card'),
                          title: l10n.bibleChapterReference(
                            bibleBookDisplayName(
                              progress.book,
                              useEnglishNames: translation.usesEnglishNames,
                            ),
                            progress.chapter,
                          ),
                          subtitle: _progressSubtitle(
                            l10n,
                            progress,
                            useEnglishNames: translation.usesEnglishNames,
                          ),
                          onContinue: () => _openReader(
                            progress.book.id,
                            progress.chapter,
                            restoreScrollOffset: true,
                          ),
                        ),
                        loading: () => const ContinueReadingCardSkeleton(
                          key: ValueKey('continue-reading-loading'),
                        ),
                        orElse: () => ContinueReadingCard(
                          key: const ValueKey('continue-reading-fallback'),
                          title: l10n.defaultContinueReadingTitle,
                          subtitle: l10n.defaultContinueReadingSubtitle,
                          onContinue: () =>
                              _openReader('rom', 8, restoreScrollOffset: true),
                        ),
                      ),
                    ),
                  ),
                ),
                ReadingPlanSection(onOpenReference: _openReadingPlanReference),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: TestamentSegmentedControl(
                      selected: _selectedTestament,
                      onChanged: (value) {
                        setState(() {
                          _selectedTestament = value;
                        });
                      },
                    ),
                  ),
                ),
                for (final category in _categoriesFor(_selectedTestament))
                  BibleBookSection(
                    title: _categoryTitle(l10n, category),
                    books: visibleBooks
                        .where((book) => book.category == category)
                        .toList(),
                    currentBookId: progressAsync.maybeWhen(
                      data: (progress) => progress.book.id,
                      orElse: () => null,
                    ),
                    useEnglishNames: translation.usesEnglishNames,
                    onBookSelected: (book) {
                      final currentChapter = progressAsync.maybeWhen(
                        data: (progress) => progress.book.id == book.id
                            ? progress.chapter
                            : null,
                        orElse: () => null,
                      );
                      _showChapterPicker(
                        book,
                        useEnglishNames: translation.usesEnglishNames,
                        currentChapter: currentChapter,
                      );
                    },
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            );
          },
        ),
      ),
    );
  }

  void _openSearch() {
    context.pushNamed(AppRouteNames.studySearch);
  }

  void _showChapterPicker(
    BibleBook book, {
    required bool useEnglishNames,
    int? currentChapter,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (context) {
        return ChapterGridSheet(
          book: book,
          useEnglishNames: useEnglishNames,
          currentChapter: currentChapter,
          onChapterSelected: (chapter) {
            Navigator.of(context).pop();
            _openReader(book.id, chapter);
          },
        );
      },
    );
  }

  void _openReader(
    String bookId,
    int chapter, {
    bool restoreScrollOffset = false,
    int? verse,
  }) {
    context.pushNamed(
      AppRouteNames.studyReader,
      pathParameters: {'bookId': bookId, 'chapter': '$chapter'},
      queryParameters: {
        if (restoreScrollOffset) 'restoreScrollOffset': '1',
        if (verse != null) 'verse': '$verse',
      },
    );
  }

  void _openReadingPlanReference(ScriptureReference reference) {
    _openReader(
      reference.bookId,
      reference.chapter,
      verse: reference.startVerse,
    );
  }
}

List<BibleBookCategory> _categoriesFor(BibleTestament testament) {
  return switch (testament) {
    BibleTestament.old => const [
      BibleBookCategory.law,
      BibleBookCategory.oldTestamentHistory,
      BibleBookCategory.wisdom,
      BibleBookCategory.majorProphets,
      BibleBookCategory.minorProphets,
    ],
    BibleTestament.newTestament => const [
      BibleBookCategory.gospels,
      BibleBookCategory.acts,
      BibleBookCategory.paulineLetters,
      BibleBookCategory.generalLetters,
      BibleBookCategory.apocalyptic,
    ],
  };
}

String _progressSubtitle(
  AppLocalizations l10n,
  ReadingProgressEntry progress, {
  required bool useEnglishNames,
}) {
  final bookName = bibleBookDisplayName(
    progress.book,
    useEnglishNames: useEnglishNames,
  );
  final verseNumber = progress.verseId?.split('.').last;
  if (verseNumber == null || verseNumber.isEmpty) {
    return l10n.continueReadingChapterSubtitle(bookName, progress.chapter);
  }

  return l10n.continueReadingVerseSubtitle(
    progress.chapter,
    verseNumber,
    bookName,
  );
}

String _categoryTitle(AppLocalizations l10n, BibleBookCategory category) {
  return switch (category) {
    BibleBookCategory.law => l10n.categoryLaw,
    BibleBookCategory.oldTestamentHistory => l10n.categoryOldTestamentHistory,
    BibleBookCategory.wisdom => l10n.categoryWisdom,
    BibleBookCategory.majorProphets => l10n.categoryMajorProphets,
    BibleBookCategory.minorProphets => l10n.categoryMinorProphets,
    BibleBookCategory.gospels => l10n.categoryGospels,
    BibleBookCategory.acts => l10n.categoryActs,
    BibleBookCategory.paulineLetters => l10n.categoryPaulineLetters,
    BibleBookCategory.generalLetters => l10n.categoryGeneralLetters,
    BibleBookCategory.apocalyptic => l10n.categoryApocalyptic,
  };
}

class _StudyLoadError extends StatelessWidget {
  const _StudyLoadError({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.menu_book_outlined,
              size: 36,
              color: colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 12),
            Text(
              l10n.studyLoadErrorTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.studyLoadErrorBody,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retryAction),
            ),
          ],
        ),
      ),
    );
  }
}
