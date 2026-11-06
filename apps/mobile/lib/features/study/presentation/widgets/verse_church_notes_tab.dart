import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_loading_state.dart';
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
    required this.pendingAction,
    required this.errorMessage,
    required this.onSeedMine,
    required this.onPublish,
    required this.onDelete,
  });

  final BibleVerse verse;
  final TextEditingController noteController;
  final TextEditingController externalNameController;
  final VerseChurchNotePendingAction? pendingAction;
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
      loading: () => const AppLoadingState(),
      error: (error, stackTrace) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(l10n.verseNotesGenericError),
            const SizedBox(height: 8),
            AppButton(
              label: l10n.retryAction,
              icon: Icons.refresh,
              variant: AppButtonVariant.outlined,
              onPressed: () =>
                  ref.invalidate(bibleVerseNotesProvider(verse.id)),
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
                pendingAction: pendingAction,
                errorMessage: errorMessage,
                onPublish: onPublish,
                onDelete: onDelete,
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 22, bottom: 10),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final textScale = MediaQuery.textScalerOf(context).scale(1);
                    final stackHeader =
                        constraints.maxWidth < 280 || textScale > 1.15;
                    final title = Text(
                      l10n.verseNotesSharedTitle,
                      style: Theme.of(context).textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.w800),
                    );
                    final count = AppChip(
                      label: l10n.verseNotesCountLabel(notes.length),
                      icon: Icons.forum_outlined,
                      variant: AppChipVariant.filled,
                    );

                    if (stackHeader) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [title, const SizedBox(height: 8), count],
                      );
                    }
                    return Row(
                      children: [
                        Expanded(child: title),
                        const SizedBox(width: 10),
                        count,
                      ],
                    );
                  },
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
