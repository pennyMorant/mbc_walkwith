import 'package:flutter/material.dart';

import '../../../../core/settings/app_text_scale_provider.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../life/presentation/push_notifications_controller.dart';
import '../../../study/domain/bible_translation.dart';
import '../../../study/presentation/reader_assist_settings_provider.dart';
import 'preference_display_section.dart';
import 'preference_reader_assist_section.dart';
import 'preference_system_section.dart';

class PreferenceSettingsCard extends StatelessWidget {
  const PreferenceSettingsCard({
    super.key,
    required this.themeMode,
    required this.onThemeModeChanged,
    required this.textScale,
    required this.onTextScaleChanged,
    required this.locale,
    required this.translation,
    required this.onOpenLanguageSettings,
    required this.pushState,
    required this.onNotificationPermissionPressed,
    required this.readerAssistSettings,
    required this.onChapterPeopleChanged,
    required this.onChapterPlacesChanged,
    required this.onLexiconChanged,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeModeChanged;
  final AppTextScale textScale;
  final ValueChanged<AppTextScale> onTextScaleChanged;
  final Locale locale;
  final BibleTranslation translation;
  final VoidCallback onOpenLanguageSettings;
  final PushNotificationsState pushState;
  final VoidCallback onNotificationPermissionPressed;
  final ReaderAssistSettings readerAssistSettings;
  final ValueChanged<bool> onChapterPeopleChanged;
  final ValueChanged<bool> onChapterPlacesChanged;
  final ValueChanged<bool> onLexiconChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CardTitle(icon: Icons.tune, title: l10n.preferencesTitle),
            const SizedBox(height: 16),
            PreferenceAppearanceControl(
              themeMode: themeMode,
              onChanged: onThemeModeChanged,
            ),
            const Divider(height: 28),
            PreferenceTextScaleControl(
              textScale: textScale,
              onChanged: onTextScaleChanged,
            ),
            const Divider(height: 28),
            PreferenceLanguageControl(
              locale: locale,
              translation: translation,
              onOpenSettings: onOpenLanguageSettings,
            ),
            const Divider(height: 28),
            PreferenceNotificationPermissionControl(
              state: pushState,
              onPressed: onNotificationPermissionPressed,
            ),
            const Divider(height: 28),
            PreferenceReaderAssistSection(
              settings: readerAssistSettings,
              onChapterPeopleChanged: onChapterPeopleChanged,
              onChapterPlacesChanged: onChapterPlacesChanged,
              onLexiconChanged: onLexiconChanged,
            ),
          ],
        ),
      ),
    );
  }
}

class _CardTitle extends StatelessWidget {
  const _CardTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon),
        const SizedBox(width: 10),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}
