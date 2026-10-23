import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../core/settings/app_settings.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';

class MemberGuestSessionContent extends StatelessWidget {
  const MemberGuestSessionContent({super.key, required this.settings});

  final AppSettings settings;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.memberOptionalSignInTitle,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          l10n.memberOptionalSignInBody,
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 14),
        if (settings.memberRegistrationHelpText.trim().isNotEmpty) ...[
          Text(
            settings.memberRegistrationHelpText,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
        ],
        AppButton(
          label: l10n.memberSignInAction,
          icon: Icons.login,
          variant: AppButtonVariant.filled,
          onPressed: () => context.pushNamed(AppRouteNames.memberLoginEmail),
        ),
        if (!settings.memberRegistrationOpen) ...[
          const SizedBox(height: 10),
          Text(
            l10n.memberRegistrationClosed,
            style: Theme.of(context).textTheme.bodySmall
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }
}
