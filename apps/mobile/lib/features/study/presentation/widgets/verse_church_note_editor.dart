import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
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
    required this.pendingAction,
    required this.errorMessage,
    required this.onPublish,
    required this.onDelete,
  });

  final BibleVerseNote? mine;
  final TextEditingController noteController;
  final TextEditingController externalNameController;
  final VerseChurchNotePendingAction? pendingAction;
  final String? errorMessage;
  final Future<void> Function() onPublish;
  final Future<void> Function(String noteId) onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final saving = pendingAction != null;

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
              enabled: !saving,
              textInputAction: TextInputAction.next,
              fillColor: colorScheme.insetSurfaceColor,
            ),
            const SizedBox(height: 10),
            AppFilledTextField(
              controller: noteController,
              hintText: l10n.verseNotesContentHint,
              enabled: !saving,
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
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 8,
              runSpacing: 8,
              children: [
                if (mine != null)
                  AppButton(
                    label: l10n.verseNotesDeleteAction,
                    icon: Icons.delete_outline,
                    variant: AppButtonVariant.text,
                    loading:
                        pendingAction == VerseChurchNotePendingAction.delete,
                    onPressed: saving ? null : () => onDelete(mine!.id),
                  ),
                AppButton(
                  label: mine == null
                      ? l10n.verseNotesPublishAction
                      : l10n.verseNotesUpdateAction,
                  icon: Icons.send_outlined,
                  variant: AppButtonVariant.filled,
                  loading:
                      pendingAction == VerseChurchNotePendingAction.publish,
                  onPressed: saving ? null : onPublish,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

enum VerseChurchNotePendingAction { publish, delete }
