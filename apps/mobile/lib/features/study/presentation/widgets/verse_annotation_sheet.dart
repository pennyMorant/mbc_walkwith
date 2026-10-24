import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../data/bible_notes_repository.dart';
import '../../domain/bible_note.dart';
import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'verse_annotation_sheet_frame.dart';
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
  final Future<void> Function(bool isBookmarked) onBookmarkChanged;
  final Future<void> Function(String? highlightColor) onHighlightChanged;
  final Future<void> Function(String noteText) onNoteSaved;
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
  bool _savingAnnotation = false;
  bool _savingPrivateNote = false;
  bool _savingChurchNote = false;
  String? _privateNoteError;
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
    return VerseAnnotationSheetFrame(
      verseNumber: widget.verse.number,
      initialTabIndex: widget.initialTabIndex,
      onOpenLexicon: widget.onOpenLexicon,
      myNoteTab: MyVerseNoteTab(
        isBookmarked: _isBookmarked,
        highlightColor: _highlightColor,
        noteController: _noteController,
        saving: _savingPrivateNote || _savingAnnotation,
        errorMessage: _privateNoteError,
        onBookmarkChanged: _setBookmark,
        onHighlightChanged: _setHighlight,
        onNoteSaved: _savePrivateNote,
      ),
      churchNotesTab: ChurchVerseNotesTab(
        verse: widget.verse,
        noteController: _churchNoteController,
        externalNameController: _externalNameController,
        saving: _savingChurchNote,
        errorMessage: _churchNoteError,
        onSeedMine: _seedChurchNote,
        onPublish: _saveChurchNote,
        onDelete: _deleteChurchNote,
      ),
    );
  }

  Future<void> _setBookmark(bool value) async {
    if (_savingAnnotation) {
      return;
    }
    final previousValue = _isBookmarked;
    setState(() {
      _isBookmarked = value;
      _savingAnnotation = true;
      _privateNoteError = null;
    });
    try {
      await widget.onBookmarkChanged(value);
    } catch (_) {
      if (mounted) {
        setState(() {
          _isBookmarked = previousValue;
          _privateNoteError = AppLocalizations.of(context)!.noteSaveError;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _savingAnnotation = false;
        });
      }
    }
  }

  Future<void> _setHighlight(String? colorId) async {
    if (_savingAnnotation) {
      return;
    }
    final previousColor = _highlightColor;
    setState(() {
      _highlightColor = colorId;
      _savingAnnotation = true;
      _privateNoteError = null;
    });
    try {
      await widget.onHighlightChanged(colorId);
    } catch (_) {
      if (mounted) {
        setState(() {
          _highlightColor = previousColor;
          _privateNoteError = AppLocalizations.of(context)!.noteSaveError;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _savingAnnotation = false;
        });
      }
    }
  }

  Future<void> _savePrivateNote() async {
    setState(() {
      _savingPrivateNote = true;
      _privateNoteError = null;
    });
    try {
      await widget.onNoteSaved(_noteController.text);
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _privateNoteError = AppLocalizations.of(context)!.noteSaveError;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _savingPrivateNote = false;
        });
      }
    }
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
    } catch (_) {
      if (mounted) {
        setState(() {
          _churchNoteError = AppLocalizations.of(context)!
              .verseNotesActionError;
        });
      }
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
    } catch (_) {
      if (mounted) {
        setState(() {
          _churchNoteError = AppLocalizations.of(context)!
              .verseNotesActionError;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _savingChurchNote = false;
        });
      }
    }
  }
}
