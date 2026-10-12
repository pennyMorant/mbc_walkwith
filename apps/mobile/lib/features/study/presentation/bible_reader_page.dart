import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import '../../../features/sermons/data/sermons_repository.dart';
import '../../../features/sermons/domain/sermon.dart';
import '../../../l10n/app_localizations.dart';
import '../data/bible_people_repository.dart';
import '../data/bible_places_repository.dart';
import '../data/study_repository.dart';
import '../domain/bible_person.dart';
import '../domain/bible_person_matcher.dart';
import '../domain/bible_place.dart';
import '../domain/bible_place_matcher.dart';
import '../domain/bible_translation.dart';
import '../domain/study_annotation.dart';
import 'bible_book_display.dart';
import 'bible_chapter_prefetcher.dart';
import 'bible_reader_app_bar.dart';
import 'bible_reader_scroll_session.dart';
import 'bible_reader_sheet_actions.dart';
import 'bible_reader_tts_session.dart';
import 'bible_reader_tts_session_provider.dart';
import 'reader_assist_settings_provider.dart';
import 'widgets/bible_reader_content_view.dart';
import 'widgets/bible_reader_loading_view.dart';
import 'widgets/reader_load_error.dart';

class BibleReaderPage extends ConsumerStatefulWidget {
  const BibleReaderPage({
    super.key,
    required this.bookId,
    required this.chapter,
    required this.restoreScrollOffset,
    this.targetVerseId,
  });

  final String bookId;
  final int chapter;
  final bool restoreScrollOffset;
  final String? targetVerseId;

  @override
  ConsumerState<BibleReaderPage> createState() => _BibleReaderPageState();
}

class _BibleReaderPageState extends ConsumerState<BibleReaderPage> {
  late final BibleReaderScrollSession _scrollSession;
  late BibleReaderTtsSession _ttsSession;
  final _chapterPrefetcher = BibleChapterPrefetcher();
  double _readerScale = 1;
  String? _lastVisibleTtsVerseId;

  @override
  void initState() {
    super.initState();
    _scrollSession = BibleReaderScrollSession(
      isMounted: () => mounted,
      contextProvider: () => context,
      readOffset: (key) => ref.read(sharedPreferencesProvider).getDouble(key),
      saveOffset: (key, offset) {
        return ref.read(sharedPreferencesProvider).setDouble(key, offset);
      },
    )..addListener(_handleSessionStateChanged);
    _ttsSession = ref.read(bibleReaderTtsSessionProvider);
    if (_ttsSession.hasActivePassage &&
        !_ttsSession.isActivePassage(
          bookId: widget.bookId,
          chapter: widget.chapter,
        )) {
      unawaited(_ttsSession.stop());
    }
    _ttsSession.addListener(_handleSessionStateChanged);
    _recordReadingProgress();
  }

  @override
  void didUpdateWidget(covariant BibleReaderPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.bookId != widget.bookId ||
        oldWidget.chapter != widget.chapter ||
        oldWidget.restoreScrollOffset != widget.restoreScrollOffset ||
        oldWidget.targetVerseId != widget.targetVerseId) {
      unawaited(_ttsSession.stop());
      _lastVisibleTtsVerseId = null;
      _scrollSession.resetRouteState();
      _recordReadingProgress();
    }
  }

  @override
  void dispose() {
    _ttsSession.removeListener(_handleSessionStateChanged);
    _scrollSession.removeListener(_handleSessionStateChanged);
    _scrollSession.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final translation = BibleTranslation.fromLocale(
      Localizations.localeOf(context),
    );
    final bookRequest = BibleBookRequest(
      bookId: widget.bookId,
      translationId: translation.id,
    );
    final chapterRequest = BibleChapterRequest(
      bookId: widget.bookId,
      chapter: widget.chapter,
      translationId: translation.id,
    );
    final annotationsRequest = StudyAnnotationsRequest(
      bookId: widget.bookId,
      chapter: widget.chapter,
    );
    final bookAsync = ref.watch(bibleBookProvider(bookRequest));
    final versesAsync = ref.watch(bibleChapterVersesProvider(chapterRequest));
    final annotationsAsync = ref.watch(
      studyAnnotationsProvider(annotationsRequest),
    );
    final recommendedSermonsAsync = ref.watch(
      recommendedSermonsProvider(
        SermonRecommendationRequest(
          bookId: widget.bookId,
          chapter: widget.chapter,
          verseId: widget.targetVerseId,
        ),
      ),
    );
    final recommendedSermons = recommendedSermonsAsync.maybeWhen(
      data: (sermons) => sermons,
      orElse: () => const <Sermon>[],
    );
    final Map<String, StudyVerseAnnotation> annotations = annotationsAsync
        .maybeWhen(
          data: (annotations) => annotations,
          orElse: () => const <String, StudyVerseAnnotation>{},
        );
    final readerAssistSettings = ref.watch(readerAssistSettingsProvider);
    final people = readerAssistSettings.showChapterPeople
        ? ref
              .watch(biblePeopleProvider(translation.id))
              .maybeWhen(
                data: (people) => people,
                orElse: () => const <BiblePerson>[],
              )
        : const <BiblePerson>[];
    final chapterPeople =
        readerAssistSettings.showChapterPeople && people.isNotEmpty
        ? versesAsync.maybeWhen(
            data: (verses) =>
                findUniqueBiblePeopleInChapter(verses: verses, people: people),
            orElse: () => const <BiblePerson>[],
          )
        : const <BiblePerson>[];
    final places = readerAssistSettings.showChapterPlaces
        ? ref
              .watch(biblePlacesProvider(translation.id))
              .maybeWhen(
                data: (places) => places,
                orElse: () => const <BiblePlace>[],
              )
        : const <BiblePlace>[];
    final chapterPlaces =
        readerAssistSettings.showChapterPlaces && places.isNotEmpty
        ? versesAsync.maybeWhen(
            data: (verses) =>
                findUniqueBiblePlacesInChapter(verses: verses, places: places),
            orElse: () => const <BiblePlace>[],
          )
        : const <BiblePlace>[];

    _scrollSession.syncScrollOffsetKey(
      translationId: translation.id,
      bookId: widget.bookId,
      chapter: widget.chapter,
    );

    return Scaffold(
      appBar: BibleReaderAppBar(
        title: bookAsync.maybeWhen(
          data: (book) => l10n.bibleChapterReference(
            bibleBookDisplayName(
              book,
              useEnglishNames: translation.usesEnglishNames,
            ),
            widget.chapter,
          ),
          orElse: () => l10n.readerFallbackTitle,
        ),
        onBack: _closeReader,
        showChapterPeople: chapterPeople.isNotEmpty,
        showChapterPlaces: chapterPlaces.isNotEmpty,
        onShowChapterPeople: () => _sheets.showChapterPeople(chapterPeople),
        onShowChapterPlaces: () => _sheets.showChapterPlaces(chapterPlaces),
        onShowVersePicker: versesAsync.maybeWhen(
          data: (verses) =>
              verses.isEmpty ? null : () => _sheets.showVersePicker(verses),
          orElse: () => null,
        ),
        onShowReaderSettings: _sheets.showReaderSettings,
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 240),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        layoutBuilder: (currentChild, previousChildren) {
          return currentChild ?? const SizedBox.shrink();
        },
        child: bookAsync.when(
          loading: () => const BibleReaderLoadingView(
            key: ValueKey('reader-book-loading'),
          ),
          error: (error, stackTrace) => ReaderLoadError(
            key: const ValueKey('reader-book-error'),
            onRetry: () {
              ref.invalidate(bibleBookProvider(bookRequest));
              ref.invalidate(bibleChapterVersesProvider(chapterRequest));
            },
          ),
          data: (book) {
            return versesAsync.when(
              loading: () => const BibleReaderLoadingView(
                key: ValueKey('reader-verses-loading'),
              ),
              error: (error, stackTrace) => ReaderLoadError(
                key: const ValueKey('reader-verses-error'),
                onRetry: () {
                  ref.invalidate(bibleChapterVersesProvider(chapterRequest));
                },
              ),
              data: (verses) {
                _scrollSession.restoreScrollOffsetIfNeeded(
                  restoreScrollOffset: widget.restoreScrollOffset,
                  targetVerseId: widget.targetVerseId,
                );
                _scrollSession.scrollToTargetVerseIfNeeded(
                  targetVerseId: widget.targetVerseId,
                  verses: verses,
                );
                _chapterPrefetcher.prefetchAdjacent(
                  ref: ref,
                  book: book,
                  chapter: widget.chapter,
                  translationId: translation.id,
                );

                return BibleReaderContentView(
                  bookId: widget.bookId,
                  chapter: widget.chapter,
                  book: book,
                  translation: translation,
                  verses: verses,
                  scrollController: _scrollSession.controller,
                  recommendedSermons: recommendedSermons,
                  annotations: annotations,
                  ttsState: _ttsSession.state,
                  readerScale: _readerScale,
                  highlightedVerseId: _scrollSession.highlightedVerseId,
                  currentTtsVerseNumber: _ttsSession.currentVerseNumber(
                    verses: verses,
                    bookId: widget.bookId,
                    chapter: widget.chapter,
                  ),
                  verseKey: _scrollSession.verseKey,
                  onPlayTts: () => _ttsSession.play(
                    verses: verses,
                    translation: translation,
                    bookId: widget.bookId,
                    bookName: bibleBookDisplayName(
                      book,
                      useEnglishNames: translation.usesEnglishNames,
                    ),
                    chapter: widget.chapter,
                    firstVisibleVerseIndex: _scrollSession
                        .firstVisibleVerseIndex(verses),
                  ),
                  onPauseTts: _ttsSession.pause,
                  onStopTts: _ttsSession.stop,
                  onPreviousTts: () => _ttsSession.moveBy(
                    delta: -1,
                    verses: verses,
                    translation: translation,
                    bookId: widget.bookId,
                    bookName: bibleBookDisplayName(
                      book,
                      useEnglishNames: translation.usesEnglishNames,
                    ),
                    chapter: widget.chapter,
                  ),
                  onNextTts: () => _ttsSession.moveBy(
                    delta: 1,
                    verses: verses,
                    translation: translation,
                    bookId: widget.bookId,
                    bookName: bibleBookDisplayName(
                      book,
                      useEnglishNames: translation.usesEnglishNames,
                    ),
                    chapter: widget.chapter,
                  ),
                  onTtsRateChanged: (rate) {
                    unawaited(_ttsSession.updateRate(rate));
                  },
                  onOpenVerseTools: (verse) => _sheets.showVerseAnnotationSheet(
                    verse: verse,
                    annotationsRequest: annotationsRequest,
                    includeLexicon: readerAssistSettings.showLexicon,
                  ),
                  onSermonReferenceSelected: _openSermonReference,
                  onChapterSelected: _openChapter,
                );
              },
            );
          },
        ),
      ),
    );
  }

  BibleReaderSheetActions get _sheets {
    return BibleReaderSheetActions(
      context: context,
      ref: ref,
      isMounted: () => mounted,
      readerScale: _readerScale,
      onReaderScaleChanged: (value) {
        setState(() {
          _readerScale = value;
        });
      },
      scrollToTargetVerse: _scrollSession.scrollToTargetVerse,
    );
  }

  void _openChapter(int chapter) {
    context.pushReplacementNamed(
      AppRouteNames.studyReader,
      pathParameters: {'bookId': widget.bookId, 'chapter': '$chapter'},
    );
  }

  void _openSermonReference(SermonReference reference) {
    context.pushNamed(
      AppRouteNames.studyReader,
      pathParameters: {
        'bookId': reference.bookId,
        'chapter': '${reference.chapter}',
      },
      queryParameters: {'verseId': reference.verseId},
    );
  }

  void _closeReader() {
    unawaited(_closeReaderAfterSaving());
  }

  Future<void> _closeReaderAfterSaving() async {
    await _scrollSession.saveCurrentScrollOffset();
    if (!mounted) {
      return;
    }

    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.study);
  }

  void _recordReadingProgress() {
    unawaited(
      ref
          .read(studyRepositoryProvider)
          .saveReadingProgress(bookId: widget.bookId, chapter: widget.chapter)
          .then((_) {
            if (mounted) {
              for (final translation in BibleTranslation.values) {
                ref.invalidate(readingProgressProvider(translation.id));
              }
            }
          }),
    );
  }

  void _handleSessionStateChanged() {
    if (!mounted) {
      return;
    }
    final verseId =
        _ttsSession.isActivePassage(
          bookId: widget.bookId,
          chapter: widget.chapter,
        )
        ? _ttsSession.state.currentVerseId
        : null;
    if (verseId != null && verseId != _lastVisibleTtsVerseId) {
      _lastVisibleTtsVerseId = verseId;
      unawaited(_scrollSession.bringVerseIntoView(verseId));
    }
    setState(() {});
  }
}
