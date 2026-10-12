import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../study/presentation/reader_assist_settings_provider.dart';

class PreferenceReaderAssistSection extends StatelessWidget {
  const PreferenceReaderAssistSection({
    super.key,
    required this.settings,
    required this.onChapterPeopleChanged,
    required this.onChapterPlacesChanged,
    required this.onLexiconChanged,
  });

  final ReaderAssistSettings settings;
  final ValueChanged<bool> onChapterPeopleChanged;
  final ValueChanged<bool> onChapterPlacesChanged;
  final ValueChanged<bool> onLexiconChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.readerAssistsTitle,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 4),
        _AssistSwitchTile(
          icon: Icons.person_search,
          title: l10n.chapterPeopleAssistTitle,
          subtitle: l10n.chapterPeopleAssistBody,
          value: settings.showChapterPeople,
          onChanged: onChapterPeopleChanged,
        ),
        _AssistSwitchTile(
          icon: Icons.travel_explore,
          title: l10n.chapterPlacesAssistTitle,
          subtitle: l10n.chapterPlacesAssistBody,
          value: settings.showChapterPlaces,
          onChanged: onChapterPlacesChanged,
        ),
        _AssistSwitchTile(
          icon: Icons.translate,
          title: l10n.lexiconAssistTitle,
          subtitle: l10n.lexiconAssistBody,
          value: settings.showLexicon,
          onChanged: onLexiconChanged,
        ),
      ],
    );
  }
}

class _AssistSwitchTile extends StatelessWidget {
  const _AssistSwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      contentPadding: EdgeInsets.zero,
      secondary: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: onChanged,
    );
  }
}
