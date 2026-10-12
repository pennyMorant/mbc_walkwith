import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import '../../domain/bible_note.dart';

class VerseChurchNoteEditor extends StatelessWidget {
  const VerseChurchNoteEditor({
    super.key,
    required this.mine,
    required this.noteController,
    required this.externalNameController,
    required this.saving,
    required this.errorMessage,
    required this.onPublish,
    required this.onDelete,
  });

  final BibleVerseNote? mine;
  final TextEditingController noteController;
  final TextEditingController externalNameController;
  final bool saving;
  final String? errorMessage;
  final Future<void> Function() onPublish;
  final Future<void> Function(String noteId) onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.tintedCardColor,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.verseNotesYourReflectionTitle,
              style: Theme.of(context).textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              l10n.verseNotesPublishHint,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            AppFilledTextField(
              controller: externalNameController,
              hintText: l10n.verseNotesDisplayNameHint,
              textInputAction: TextInputAction.next,
              fillColor: colorScheme.insetSurfaceColor,
            ),
            const SizedBox(height: 10),
            AppFilledTextField(
              controller: noteController,
              hintText: l10n.verseNotesContentHint,
              minLines: 4,
              maxLines: 7,
              textInputAction: TextInputAction.newline,
              fillColor: colorScheme.insetSurfaceColor,
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                errorMessage!,
                style: Theme.of(context).textTheme.bodySmall
                    ?.copyWith(color: colorScheme.error),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                if (mine != null)
                  TextButton.icon(
                    onPressed: saving ? null : () => onDelete(mine!.id),
                    icon: const Icon(Icons.delete_outline),
                    label: Text(l10n.verseNotesDeleteAction),
                  ),
                const Spacer(),
                FilledButton.icon(
                  onPressed: saving ? null : onPublish,
                  icon: saving
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send_outlined),
                  label: Text(
                    mine == null
                        ? l10n.verseNotesPublishAction
                        : l10n.verseNotesUpdateAction,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
