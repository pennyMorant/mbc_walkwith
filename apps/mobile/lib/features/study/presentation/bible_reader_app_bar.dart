import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';

class BibleReaderAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BibleReaderAppBar({
    super.key,
    required this.title,
    required this.onBack,
    required this.showChapterPeople,
    required this.showChapterPlaces,
    required this.onShowChapterPeople,
    required this.onShowChapterPlaces,
    required this.onShowReaderSettings,
    this.onShowVersePicker,
  });

  final String title;
  final VoidCallback onBack;
  final bool showChapterPeople;
  final bool showChapterPlaces;
  final VoidCallback onShowChapterPeople;
  final VoidCallback onShowChapterPlaces;
  final VoidCallback onShowReaderSettings;
  final VoidCallback? onShowVersePicker;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 8);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SecondaryAppBar(
      title: title,
      onBack: onBack,
      actions: [
        if (showChapterPeople)
          IconButton(
            tooltip: l10n.chapterPeopleTooltip,
            onPressed: onShowChapterPeople,
            icon: const Icon(Icons.person_search),
          ),
        if (showChapterPlaces)
          IconButton(
            tooltip: l10n.chapterPlacesTooltip,
            onPressed: onShowChapterPlaces,
            icon: const Icon(Icons.travel_explore),
          ),
        IconButton(
          tooltip: l10n.versePickerTooltip,
          onPressed: onShowVersePicker,
          icon: const Icon(Icons.format_list_numbered),
        ),
        IconButton(
          tooltip: l10n.readerSettingsTooltip,
          onPressed: onShowReaderSettings,
          icon: const Icon(Icons.text_fields),
        ),
      ],
    );
  }
}
