import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/bible_notes_repository.dart';
import '../../domain/bible_note.dart';
import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'verse_annotation_header.dart';
import 'verse_church_notes_tab.dart';
import 'verse_my_note_tab.dart';

class VerseAnnotationSheet extends ConsumerStatefulWidget {
  const VerseAnnotationSheet({
    super.key,
    required this.verse,
    required this.bookId,
    required this.chapter,
    required this.annotation,
    this.initialTabIndex = 0,
    required this.onBookmarkChanged,
    required this.onHighlightChanged,
    required this.onNoteSaved,
    this.onOpenLexicon,
  });

  final BibleVerse verse;
  final String bookId;
  final int chapter;
  final StudyVerseAnnotation? annotation;
  final int initialTabIndex;
  final ValueChanged<bool> onBookmarkChanged;
  final ValueChanged<String?> onHighlightChanged;
  final ValueChanged<String> onNoteSaved;
  final VoidCallback? onOpenLexicon;

  @override
  ConsumerState<VerseAnnotationSheet> createState() =>
      _VerseAnnotationSheetState();
}

class _VerseAnnotationSheetState extends ConsumerState<VerseAnnotationSheet> {
  late final TextEditingController _noteController;
  late final TextEditingController _churchNoteController;
  final _externalNameController = TextEditingController();
  late bool _isBookmarked;
  String? _highlightColor;
  String? _editingChurchNoteId;
  bool _churchNoteSeeded = false;
  bool _savingChurchNote = false;
  String? _churchNoteError;

  @override
  void initState() {
    super.initState();
    _isBookmarked = widget.annotation?.isBookmarked ?? false;
    _highlightColor = widget.annotation?.highlightColor;
    _noteController = TextEditingController(
      text: widget.annotation?.noteText ?? '',
    );
    _churchNoteController = TextEditingController();
  }

  @override
  void dispose() {
    _noteController.dispose();
    _churchNoteController.dispose();
    _externalNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final mediaQuery = MediaQuery.of(context);
    final bottomPadding = mediaQuery.padding.bottom;
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final preferredHeight = mediaQuery.size.height * 0.85;
    final availableHeight =
        (mediaQuery.size.height - keyboardInset - mediaQuery.padding.top - 8)
            .clamp(0.0, mediaQuery.size.height)
            .toDouble();
    final sheetHeight = preferredHeight.clamp(0.0, availableHeight).toDouble();

    return AnimatedPadding(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
      padding: EdgeInsets.only(bottom: keyboardInset),
      child: SafeArea(
        top: false,
        child: AnimatedContainer(
          key: const ValueKey('verse-annotation-sheet-content'),
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          height: sheetHeight,
          child: DefaultTabController(
            length: 2,
            initialIndex: widget.initialTabIndex,
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 20 + bottomPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  VerseAnnotationHeader(
                    verseNumber: widget.verse.number,
                    onOpenLexicon: widget.onOpenLexicon,
                  ),
                  const SizedBox(height: 12),
                  TabBar(
                    tabs: [
                      Tab(text: l10n.verseNotesMyNotesTab),
                      Tab(text: l10n.verseNotesChurchNotesTab),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: TabBarView(
                      children: [
                        MyVerseNoteTab(
                          isBookmarked: _isBookmarked,
                          highlightColor: _highlightColor,
                          noteController: _noteController,
                          onBookmarkChanged: (value) {
                            setState(() {
                              _isBookmarked = value;
                            });
                            widget.onBookmarkChanged(value);
                          },
                          onHighlightChanged: _setHighlight,
                          onNoteSaved: () {
                            widget.onNoteSaved(_noteController.text);
                            Navigator.of(context).pop();
                          },
                        ),
                        ChurchVerseNotesTab(
                          verse: widget.verse,
                          noteController: _churchNoteController,
                          externalNameController: _externalNameController,
                          saving: _savingChurchNote,
                          errorMessage: _churchNoteError,
                          onSeedMine: _seedChurchNote,
                          onPublish: _saveChurchNote,
                          onDelete: _deleteChurchNote,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _setHighlight(String? colorId) {
    setState(() {
      _highlightColor = colorId;
    });
    widget.onHighlightChanged(colorId);
  }

  void _seedChurchNote(BibleVerseNote? note) {
    if (_churchNoteSeeded || note == null) {
      return;
    }
    _churchNoteSeeded = true;
    _editingChurchNoteId = note.id;
    _churchNoteController.text = note.content;
  }

  Future<void> _saveChurchNote() async {
    final content = _churchNoteController.text.trim();
    if (content.isEmpty) {
      setState(() {
        _churchNoteError = AppLocalizations.of(context)!.verseNotesEmptyError;
      });
      return;
    }
    setState(() {
      _savingChurchNote = true;
      _churchNoteError = null;
    });
    try {
      final repository = ref.read(bibleNotesRepositoryProvider);
      final noteId = _editingChurchNoteId;
      final saved = noteId == null
          ? await repository.create(
              verseId: widget.verse.id,
              bookId: widget.bookId,
              chapter: widget.chapter,
              verse: widget.verse.number,
              content: content,
              externalDisplayName: _externalNameController.text,
            )
          : await repository.update(noteId: noteId, content: content);
      _editingChurchNoteId = saved.id;
      ref.invalidate(bibleVerseNotesProvider(widget.verse.id));
    } catch (error) {
      _churchNoteError = _errorMessage(error);
    } finally {
      if (mounted) {
        setState(() {
          _savingChurchNote = false;
        });
      }
    }
  }

  Future<void> _deleteChurchNote(String noteId) async {
    setState(() {
      _savingChurchNote = true;
      _churchNoteError = null;
    });
    try {
      await ref.read(bibleNotesRepositoryProvider).delete(noteId);
      _editingChurchNoteId = null;
      _churchNoteController.clear();
      _churchNoteSeeded = true;
      ref.invalidate(bibleVerseNotesProvider(widget.verse.id));
    } catch (error) {
      _churchNoteError = _errorMessage(error);
    } finally {
      if (mounted) {
        setState(() {
          _savingChurchNote = false;
        });
      }
    }
  }

  String _errorMessage(Object error) {
    if (error is ApiError) {
      return error.message;
    }
    return AppLocalizations.of(context)!.verseNotesGenericError;
  }
}
