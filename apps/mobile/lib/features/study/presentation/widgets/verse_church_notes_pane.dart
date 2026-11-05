import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../data/bible_notes_repository.dart';
import '../../domain/bible_note.dart';
import '../../domain/bible_verse.dart';
import 'verse_church_note_editor.dart';
import 'verse_church_notes_tab.dart';

class VerseChurchNotesPane extends ConsumerStatefulWidget {
  const VerseChurchNotesPane({
    super.key,
    required this.verse,
    required this.bookId,
    required this.chapter,
  });

  final BibleVerse verse;
  final String bookId;
  final int chapter;

  @override
  ConsumerState<VerseChurchNotesPane> createState() =>
      _VerseChurchNotesPaneState();
}

class _VerseChurchNotesPaneState extends ConsumerState<VerseChurchNotesPane> {
  final _noteController = TextEditingController();
  final _externalNameController = TextEditingController();
  String? _editingNoteId;
  bool _noteSeeded = false;
  VerseChurchNotePendingAction? _pendingAction;
  String? _errorMessage;

  @override
  void dispose() {
    _noteController.dispose();
    _externalNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChurchVerseNotesTab(
      verse: widget.verse,
      noteController: _noteController,
      externalNameController: _externalNameController,
      pendingAction: _pendingAction,
      errorMessage: _errorMessage,
      onSeedMine: _seedMine,
      onPublish: _save,
      onDelete: _delete,
    );
  }

  void _seedMine(BibleVerseNote? note) {
    if (_noteSeeded || note == null) {
      return;
    }
    _noteSeeded = true;
    _editingNoteId = note.id;
    _noteController.text = note.content;
  }

  Future<void> _save() async {
    if (_pendingAction != null) {
      return;
    }
    final content = _noteController.text.trim();
    if (content.isEmpty) {
      setState(() {
        _errorMessage = AppLocalizations.of(context)!.verseNotesEmptyError;
      });
      return;
    }
    setState(() {
      _pendingAction = VerseChurchNotePendingAction.publish;
      _errorMessage = null;
    });
    try {
      final repository = ref.read(bibleNotesRepositoryProvider);
      final noteId = _editingNoteId;
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
      _editingNoteId = saved.id;
      ref.invalidate(bibleVerseNotesProvider(widget.verse.id));
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMessage = AppLocalizations.of(context)!.verseNotesActionError;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _pendingAction = null);
      }
    }
  }

  Future<void> _delete(String noteId) async {
    if (_pendingAction != null) {
      return;
    }
    setState(() {
      _pendingAction = VerseChurchNotePendingAction.delete;
      _errorMessage = null;
    });
    try {
      await ref.read(bibleNotesRepositoryProvider).delete(noteId);
      _editingNoteId = null;
      _noteController.clear();
      _noteSeeded = true;
      ref.invalidate(bibleVerseNotesProvider(widget.verse.id));
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMessage = AppLocalizations.of(context)!.verseNotesActionError;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _pendingAction = null);
      }
    }
  }
}
