import 'package:flutter/material.dart';

import '../../../../core/settings/app_settings.dart';
import '../../../../l10n/app_localizations.dart';

class AboutChurchCard extends StatelessWidget {
  const AboutChurchCard({
    super.key,
    required this.settings,
    required this.appVersion,
    required this.onOpenUrl,
    required this.onOpenUri,
  });

  final AppSettings settings;
  final String appVersion;
  final ValueChanged<String> onOpenUrl;
  final ValueChanged<Uri> onOpenUri;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final aboutText = settings.churchAbout.trim().isEmpty
        ? settings.churchName
        : settings.churchAbout.trim();
    final address = settings.churchAddress.trim();
    final mapUrl = settings.churchMapUrl.trim();
    final phone = settings.churchContactPhone.trim();
    final email = settings.churchContactEmail.trim();
    final privacyPolicyUrl = settings.privacyPolicyUrl.trim();
    final termsOfUseUrl = settings.termsOfUseUrl.trim();

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(6, 10, 6, 6),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
              child: Row(
                children: [
                  const Icon(Icons.info_outline),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      l10n.aboutTitle,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            _AboutTile(
              icon: Icons.church_outlined,
              title: l10n.aboutChurchTitle,
              subtitle: aboutText,
            ),
            if (address.isNotEmpty)
              _AboutTile(
                icon: Icons.map_outlined,
                title: l10n.churchAddressTitle,
                subtitle: address,
                onTap: mapUrl.isEmpty ? null : () => onOpenUrl(mapUrl),
              ),
            if (phone.isNotEmpty)
              _AboutTile(
                icon: Icons.phone_outlined,
                title: l10n.churchPhoneTitle,
                subtitle: phone,
                onTap: () => onOpenUri(Uri(scheme: 'tel', path: phone)),
              ),
            if (email.isNotEmpty)
              _AboutTile(
                icon: Icons.mail_outline,
                title: l10n.churchEmailTitle,
                subtitle: email,
                onTap: () => onOpenUri(Uri(scheme: 'mailto', path: email)),
              ),
            if (privacyPolicyUrl.isNotEmpty)
              _AboutTile(
                icon: Icons.privacy_tip_outlined,
                title: l10n.privacyPolicyTitle,
                onTap: () => onOpenUrl(privacyPolicyUrl),
              ),
            if (termsOfUseUrl.isNotEmpty)
              _AboutTile(
                icon: Icons.description_outlined,
                title: l10n.termsOfUseTitle,
                onTap: () => onOpenUrl(termsOfUseUrl),
              ),
            _AboutTile(
              icon: Icons.verified_outlined,
              title: l10n.appVersionTitle,
              subtitle: l10n.appVersionValue(appVersion),
            ),
          ],
        ),
      ),
    );
  }
}

class _AboutTile extends StatelessWidget {
  const _AboutTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle == null ? null : Text(subtitle!),
      trailing: onTap == null ? null : const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
