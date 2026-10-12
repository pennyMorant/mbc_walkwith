import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';
import 'verse_highlight_options.dart';

class MyVerseNoteTab extends StatelessWidget {
  const MyVerseNoteTab({
    super.key,
    required this.isBookmarked,
    required this.highlightColor,
    required this.noteController,
    required this.onBookmarkChanged,
    required this.onHighlightChanged,
    required this.onNoteSaved,
  });

  final bool isBookmarked;
  final String? highlightColor;
  final TextEditingController noteController;
  final ValueChanged<bool> onBookmarkChanged;
  final ValueChanged<String?> onHighlightChanged;
  final VoidCallback onNoteSaved;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Material(
            color: colorScheme.tintedCardColor,
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
            child: SwitchListTile(
              value: isBookmarked,
              title: Text(l10n.bookmarkVerseTitle),
              secondary: Icon(
                isBookmarked ? Icons.bookmark : Icons.bookmark_outline,
                color: colorScheme.primary,
              ),
              onChanged: onBookmarkChanged,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            l10n.highlightTitle,
            style: Theme.of(context).textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              VerseHighlightChip(
                label: l10n.highlightNone,
                selected: highlightColor == null,
                onSelected: () => onHighlightChanged(null),
              ),
              for (final option in verseHighlightOptions(context))
                VerseHighlightChip(
                  label: option.label,
                  color: option.color,
                  selected: highlightColor == option.id,
                  onSelected: () => onHighlightChanged(option.id),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            l10n.noteTitle,
            style: Theme.of(context).textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          AppFilledTextField(
            controller: noteController,
            hintText: l10n.noteHint,
            minLines: 3,
            maxLines: 5,
            textInputAction: TextInputAction.newline,
            fillColor: colorScheme.insetSurfaceColor,
          ),
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.icon(
              onPressed: onNoteSaved,
              icon: const Icon(Icons.save_outlined),
              label: Text(l10n.saveNoteAction),
            ),
          ),
        ],
      ),
    );
  }
}
