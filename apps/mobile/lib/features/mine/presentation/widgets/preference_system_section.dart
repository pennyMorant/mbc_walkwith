import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../life/presentation/push_notifications_controller.dart';
import '../../../study/domain/bible_translation.dart';

class PreferenceLanguageControl extends StatelessWidget {
  const PreferenceLanguageControl({
    super.key,
    required this.locale,
    required this.translation,
    required this.onOpenSettings,
  });

  final Locale locale;
  final BibleTranslation translation;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final subtitle =
        '${l10n.systemLanguageLabel}: ${_localeLabel(locale)}\n'
        '${l10n.bibleTranslationLabel}: ${translation.name} '
        '(${translation.abbreviation})';

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.language),
      title: Text(l10n.languageTitle),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onOpenSettings,
    );
  }
}

class PreferenceNotificationPermissionControl extends StatelessWidget {
  const PreferenceNotificationPermissionControl({
    super.key,
    required this.state,
    required this.onPressed,
  });

  final PushNotificationsState state;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final enabled = state.permissionGranted;
    final subtitle = !state.supported
        ? l10n.notificationDeviceUnavailableBody
        : enabled
        ? l10n.notificationPermissionEnabledBody
        : l10n.notificationPermissionDisabledBody;

    return SwitchListTile.adaptive(
      contentPadding: EdgeInsets.zero,
      secondary: const Icon(Icons.notifications_active_outlined),
      title: Text(l10n.notificationPermissionTitle),
      subtitle: Text(subtitle),
      value: enabled,
      onChanged: state.supported && !state.isLoading
          ? (_) => onPressed()
          : null,
    );
  }
}

String _localeLabel(Locale locale) {
  final script = locale.scriptCode;
  final country = locale.countryCode;
  final parts = [
    locale.languageCode,
    if (script != null && script.isNotEmpty) script,
    if (country != null && country.isNotEmpty) country,
  ];
  return parts.join('-');
}
