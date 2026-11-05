import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/bible_verse.dart';
import '../../domain/study_annotation.dart';
import 'verse_annotation_sheet_frame.dart';
import 'verse_church_notes_pane.dart';
import 'verse_my_note_tab.dart';

class VerseAnnotationSheet extends StatefulWidget {
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
  State<VerseAnnotationSheet> createState() => _VerseAnnotationSheetState();
}

class _VerseAnnotationSheetState extends State<VerseAnnotationSheet> {
  late final TextEditingController _noteController;
  late bool _isBookmarked;
  String? _highlightColor;
  bool _savingAnnotation = false;
  bool _savingPrivateNote = false;
  String? _privateNoteError;

  @override
  void initState() {
    super.initState();
    _isBookmarked = widget.annotation?.isBookmarked ?? false;
    _highlightColor = widget.annotation?.highlightColor;
    _noteController = TextEditingController(
      text: widget.annotation?.noteText ?? '',
    );
  }

  @override
  void dispose() {
    _noteController.dispose();
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
      churchNotesTab: VerseChurchNotesPane(
        verse: widget.verse,
        bookId: widget.bookId,
        chapter: widget.chapter,
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
}
