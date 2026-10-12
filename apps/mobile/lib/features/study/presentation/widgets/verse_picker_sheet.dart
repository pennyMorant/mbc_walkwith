import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../theme/app_theme.dart';
import '../../domain/bible_verse.dart';

class VersePickerSheet extends StatelessWidget {
  const VersePickerSheet({
    super.key,
    required this.verses,
    required this.onVerseSelected,
  });

  final List<BibleVerse> verses;
  final ValueChanged<BibleVerse> onVerseSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final height = MediaQuery.sizeOf(context).height * 0.5;

    return SafeArea(
      top: false,
      child: SizedBox(
        height: height,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: ShapeDecoration(
                    color: Theme.of(context).colorScheme.outlineVariant,
                    shape: const StadiumBorder(),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                l10n.versePickerTitle,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth <= 0) {
                      return const SizedBox.shrink();
                    }

                    return GridView.builder(
                      itemCount: verses.length,
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 64,
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                          ),
                      itemBuilder: (context, index) {
                        final verse = verses[index];
                        return FilledButton.tonal(
                          onPressed: () => onVerseSelected(verse),
                          style: FilledButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                AppTheme.chipRadius,
                              ),
                            ),
                            padding: EdgeInsets.zero,
                          ),
                          child: Text('${verse.number}'),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
