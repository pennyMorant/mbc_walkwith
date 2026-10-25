import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mbc_walkwith/features/study/data/bible_notes_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_note.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/verse_annotation_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_colors.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('does not reseed deleted shared note from stale provider data', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final repository = _StaleDeleteBibleNotesRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [bibleNotesRepositoryProvider.overrideWithValue(repository)],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              initialTabIndex: 1,
              onBookmarkChanged: (_) async {},
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(_sharedNoteInputText(tester), 'Existing reflection');

    await tester.tap(find.text('Delete'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(repository.deletedNoteIds, ['note-1']);
    expect(_sharedNoteInputText(tester), isEmpty);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -280));
    await tester.pumpAndSettle();
    expect(find.text('2 reflections'), findsOneWidget);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -220));
    await tester.pumpAndSettle();
    expect(find.text('Another reader'), findsOneWidget);
  });

  testWidgets('private note input is distinct from the sheet background', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            _StaleDeleteBibleNotesRepository(),
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              onBookmarkChanged: (_) async {},
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final field = tester.widget<TextField>(find.byType(TextField).first);
    final context = tester.element(find.byType(TextField).first);
    final colorScheme = Theme.of(context).colorScheme;

    expect(field.decoration?.fillColor, colorScheme.insetSurfaceColor);
    expect(field.decoration?.fillColor, isNot(colorScheme.surface));
  });

  testWidgets('sheet stays below the status bar when the keyboard opens', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    tester.view.padding = const FakeViewPadding(top: 24);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPadding);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            _StaleDeleteBibleNotesRepository(),
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            resizeToAvoidBottomInset: false,
            body: Align(
              alignment: Alignment.bottomCenter,
              child: VerseAnnotationSheet(
                verse: _verse,
                bookId: 'rom',
                chapter: 8,
                annotation: null,
                onBookmarkChanged: (_) async {},
                onHighlightChanged: (_) async {},
                onNoteSaved: (_) async {},
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    tester.view.viewInsets = const FakeViewPadding(bottom: 320);
    addTearDown(tester.view.resetViewInsets);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 180));

    final sheet = find.byKey(const ValueKey('verse-annotation-sheet-content'));
    expect(tester.getTopLeft(sheet).dy, greaterThanOrEqualTo(32));
    expect(tester.getBottomLeft(sheet).dy, lessThanOrEqualTo(480));
  });

  testWidgets('private note stays open with its text when saving fails', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            _StaleDeleteBibleNotesRepository(),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              onBookmarkChanged: (_) async {},
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) async {
                throw StateError('database unavailable');
              },
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Keep this note');
    final saveButton = find.widgetWithText(FilledButton, 'Save note');
    await tester.ensureVisible(saveButton);
    await tester.pumpAndSettle();
    await tester.tap(saveButton);
    await tester.pumpAndSettle();

    expect(find.byType(VerseAnnotationSheet), findsOneWidget);
    expect(find.text('Keep this note'), findsOneWidget);
    expect(
      find.text('Your note could not be saved. Please try again.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('private note input is disabled while save is pending', (
    tester,
  ) async {
    final pendingSave = Completer<void>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            _StaleDeleteBibleNotesRepository(),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              onBookmarkChanged: (_) async {},
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) => pendingSave.future,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Pending note');
    final saveButton = find.widgetWithText(FilledButton, 'Save note');
    await tester.ensureVisible(saveButton);
    await tester.tap(saveButton);
    await tester.pump();

    expect(
      tester.widget<TextField>(find.byType(TextField).first).enabled,
      isFalse,
    );
    expect(find.text('Pending note'), findsOneWidget);

    pendingSave.completeError(StateError('database unavailable'));
    await tester.pumpAndSettle();
  });

  testWidgets('church note inputs are disabled while update is pending', (
    tester,
  ) async {
    final repository = _PendingUpdateBibleNotesRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [bibleNotesRepositoryProvider.overrideWithValue(repository)],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              initialTabIndex: 1,
              onBookmarkChanged: (_) async {},
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Update'));
    await tester.pump();

    final fields = tester.widgetList<TextField>(find.byType(TextField));
    expect(fields, isNotEmpty);
    expect(fields.every((field) => field.enabled == false), isTrue);

    repository.pendingUpdate.completeError(StateError('network unavailable'));
    await tester.pumpAndSettle();
  });

  testWidgets('failed bookmark save rolls back and stays recoverable', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            _StaleDeleteBibleNotesRepository(),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: VerseAnnotationSheet(
              verse: _verse,
              bookId: 'rom',
              chapter: 8,
              annotation: null,
              onBookmarkChanged: (_) async {
                throw StateError('database unavailable');
              },
              onHighlightChanged: (_) async {},
              onNoteSaved: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();

    expect(tester.widget<Switch>(find.byType(Switch)).value, isFalse);
    expect(
      find.text('Your note could not be saved. Please try again.'),
      findsOneWidget,
    );
    expect(find.textContaining('database unavailable'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}

String _sharedNoteInputText(WidgetTester tester) {
  final editableTexts = tester
      .widgetList<EditableText>(find.byType(EditableText))
      .toList(growable: false);
  return editableTexts.last.controller.text;
}

const _verse = BibleVerse(
  id: 'rom.8.28',
  number: 28,
  text: 'All things work together for good.',
);

class _StaleDeleteBibleNotesRepository implements BibleNotesRepository {
  final deletedNoteIds = <String>[];

  @override
  Future<List<BibleVerseNote>> listByVerse(String verseId) async {
    return [_existingNote, _otherNote];
  }

  @override
  Future<BibleVerseNote> create({
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String content,
    String? externalDisplayName,
  }) async {
    return _existingNote;
  }

  @override
  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  }) async {
    return _existingNote;
  }

  @override
  Future<void> delete(String noteId) async {
    deletedNoteIds.add(noteId);
  }
}

class _PendingUpdateBibleNotesRepository
    extends _StaleDeleteBibleNotesRepository {
  final pendingUpdate = Completer<BibleVerseNote>();

  @override
  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  }) {
    return pendingUpdate.future;
  }
}

final _existingNote = BibleVerseNote(
  id: 'note-1',
  verseId: 'rom.8.28',
  bookId: 'rom',
  chapter: 8,
  verse: 28,
  content: 'Existing reflection',
  authorType: 'external',
  authorDisplayName: 'Guest',
  isMine: true,
  createdAt: _noteTime,
  updatedAt: _noteTime,
);

final _otherNote = BibleVerseNote(
  id: 'note-2',
  verseId: 'rom.8.28',
  bookId: 'rom',
  chapter: 8,
  verse: 28,
  content: 'A second reflection',
  authorType: 'member',
  authorDisplayName: 'Another reader',
  isMine: false,
  createdAt: _noteTime.subtract(const Duration(days: 1)),
  updatedAt: _noteTime.subtract(const Duration(days: 1)),
);

final _noteTime = DateTime.utc(2026, 7, 8);
