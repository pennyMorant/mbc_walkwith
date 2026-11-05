import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/data/bible_notes_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_note.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/verse_church_note_editor.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/verse_church_notes_tab.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/verse_shared_note_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('mine label stacks below a long author for larger text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 500);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: SharedVerseNoteCard(note: _mine),
      ),
    );

    final author = find.text(_mine.authorDisplayName);
    final mineLabel = find.byType(AppChip);
    expect(
      tester.getTopLeft(mineLabel).dy,
      greaterThan(tester.getBottomLeft(author).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('delete progress stays on the matching church note action', (
    tester,
  ) async {
    final noteController = TextEditingController(text: _mine.content);
    final nameController = TextEditingController(text: _mine.authorDisplayName);
    addTearDown(noteController.dispose);
    addTearDown(nameController.dispose);

    await tester.pumpWidget(
      _app(
        child: SingleChildScrollView(
          child: VerseChurchNoteEditor(
            mine: _mine,
            noteController: noteController,
            externalNameController: nameController,
            pendingAction: VerseChurchNotePendingAction.delete,
            errorMessage: null,
            onPublish: () async {},
            onDelete: (_) async {},
          ),
        ),
      ),
    );

    final buttons = tester
        .widgetList<AppButton>(find.byType(AppButton))
        .toList();
    expect(buttons, hasLength(2));
    expect(buttons.first.loading, isTrue);
    expect(buttons.last.loading, isFalse);
    expect(buttons.every((button) => button.onPressed == null), isTrue);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('shared reflections header stacks its localized count', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final noteController = TextEditingController();
    final nameController = TextEditingController();
    addTearDown(noteController.dispose);
    addTearDown(nameController.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibleNotesRepositoryProvider.overrideWithValue(
            const _LayoutBibleNotesRepository(),
          ),
        ],
        child: _app(
          textScaler: const TextScaler.linear(1.3),
          child: ChurchVerseNotesTab(
            verse: _verse,
            noteController: noteController,
            externalNameController: nameController,
            pendingAction: null,
            errorMessage: null,
            onSeedMine: (_) {},
            onPublish: () async {},
            onDelete: (_) async {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -360));
    await tester.pumpAndSettle();

    final title = find.text('Reflexiones compartidas');
    final countLabel = find.text('1 reflexión');
    final countChip = find.ancestor(
      of: countLabel,
      matching: find.byType(AppChip),
    );
    expect(title, findsOneWidget);
    expect(countChip, findsOneWidget);
    expect(
      tester.getTopLeft(countChip).dy,
      greaterThan(tester.getBottomLeft(title).dy),
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
    home: Scaffold(
      body: Padding(padding: const EdgeInsets.all(20), child: child),
    ),
  );
}

final _mine = BibleVerseNote(
  id: 'note-1',
  verseId: 'rom.8.28',
  bookId: 'rom',
  chapter: 8,
  verse: 28,
  content: 'Una reflexión compartida con la iglesia.',
  authorType: 'external',
  authorDisplayName: 'Una persona con un nombre bastante largo',
  isMine: true,
  createdAt: DateTime.utc(2026, 11, 2),
  updatedAt: DateTime.utc(2026, 11, 2),
);

const _verse = BibleVerse(
  id: 'rom.8.28',
  number: 28,
  text: 'All things work together for good.',
);

class _LayoutBibleNotesRepository implements BibleNotesRepository {
  const _LayoutBibleNotesRepository();

  @override
  Future<List<BibleVerseNote>> listByVerse(String verseId) async => [_mine];

  @override
  Future<BibleVerseNote> create({
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String content,
    String? externalDisplayName,
  }) async => _mine;

  @override
  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  }) async => _mine;

  @override
  Future<void> delete(String noteId) async {}
}
