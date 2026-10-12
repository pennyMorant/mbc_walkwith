import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../data/bible_notes_repository.dart';
import '../../domain/bible_note.dart';
import '../../domain/bible_verse.dart';
import 'verse_church_note_editor.dart';
import 'verse_shared_note_card.dart';

class ChurchVerseNotesTab extends ConsumerWidget {
  const ChurchVerseNotesTab({
    super.key,
    required this.verse,
    required this.noteController,
    required this.externalNameController,
    required this.saving,
    required this.errorMessage,
    required this.onSeedMine,
    required this.onPublish,
    required this.onDelete,
  });

  final BibleVerse verse;
  final TextEditingController noteController;
  final TextEditingController externalNameController;
  final bool saving;
  final String? errorMessage;
  final ValueChanged<BibleVerseNote?> onSeedMine;
  final Future<void> Function() onPublish;
  final Future<void> Function(String noteId) onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final notesAsync = ref.watch(bibleVerseNotesProvider(verse.id));

    return notesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(l10n.verseNotesGenericError),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () =>
                  ref.invalidate(bibleVerseNotesProvider(verse.id)),
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retryAction),
            ),
          ],
        ),
      ),
      data: (notes) {
        final mine = notes.where((note) => note.isMine).firstOrNull;
        onSeedMine(mine);
        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: VerseChurchNoteEditor(
                mine: mine,
                noteController: noteController,
                externalNameController: externalNameController,
                saving: saving,
                errorMessage: errorMessage,
                onPublish: onPublish,
                onDelete: onDelete,
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 22, bottom: 10),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.verseNotesSharedTitle,
                        style: Theme.of(context).textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    AppChip(
                      label: l10n.verseNotesCountLabel(notes.length),
                      icon: Icons.forum_outlined,
                      variant: AppChipVariant.filled,
                    ),
                  ],
                ),
              ),
            ),
            if (notes.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      l10n.verseNotesEmptyState,
                      style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SharedVerseNoteCard(note: notes[index]),
                  );
                }, childCount: notes.length),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
          ],
        );
      },
    );
  }
}
