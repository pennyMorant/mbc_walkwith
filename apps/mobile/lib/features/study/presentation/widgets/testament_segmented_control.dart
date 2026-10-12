import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/bible_book.dart';

class TestamentSegmentedControl extends StatelessWidget {
  const TestamentSegmentedControl({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final BibleTestament selected;
  final ValueChanged<BibleTestament> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return SegmentedButton<BibleTestament>(
      segments: [
        ButtonSegment(
          value: BibleTestament.old,
          label: Text(l10n.oldTestamentLabel),
        ),
        ButtonSegment(
          value: BibleTestament.newTestament,
          label: Text(l10n.newTestamentLabel),
        ),
      ],
      selected: {selected},
      onSelectionChanged: (selection) {
        onChanged(selection.first);
      },
      showSelectedIcon: false,
    );
  }
}
