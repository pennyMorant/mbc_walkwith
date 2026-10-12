import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class EventRegistrationActionButtons extends StatelessWidget {
  const EventRegistrationActionButtons({
    super.key,
    required this.isSignedIn,
    required this.isRegistered,
    required this.isCheckedIn,
    required this.isSubmitting,
    required this.canUpdateRegistration,
    required this.allowCancellation,
    required this.registrationClosed,
    required this.registrationFull,
    required this.onSignIn,
    required this.onRegister,
    required this.onUpdate,
    required this.onCancel,
    required this.onCheckIn,
  });

  final bool isSignedIn;
  final bool isRegistered;
  final bool isCheckedIn;
  final bool isSubmitting;
  final bool canUpdateRegistration;
  final bool allowCancellation;
  final bool registrationClosed;
  final bool registrationFull;
  final VoidCallback onSignIn;
  final VoidCallback? onRegister;
  final VoidCallback? onUpdate;
  final VoidCallback? onCancel;
  final VoidCallback? onCheckIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (!isSignedIn) {
      return FilledButton.icon(
        onPressed: onSignIn,
        icon: const Icon(Icons.login),
        label: Text(l10n.memberSignInAction),
      );
    }
    if (!isRegistered) {
      final disabled = isSubmitting || registrationClosed || registrationFull;
      return FilledButton.icon(
        onPressed: disabled ? null : onRegister,
        icon: isSubmitting
            ? const SizedBox.square(
                dimension: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.how_to_reg_outlined),
        label: Text(l10n.eventRegistrationRegisterAction),
      );
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (!isCheckedIn)
          FilledButton.icon(
            onPressed: isSubmitting ? null : onCheckIn,
            icon: isSubmitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.qr_code_scanner_outlined),
            label: Text(l10n.eventCheckInScanAction),
          ),
        FilledButton.icon(
          onPressed: isSubmitting || !canUpdateRegistration ? null : onUpdate,
          icon: isSubmitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.save_outlined),
          label: Text(l10n.eventRegistrationUpdateAction),
        ),
        FilledButton.tonalIcon(
          onPressed: isSubmitting || !allowCancellation ? null : onCancel,
          icon: const Icon(Icons.event_busy_outlined),
          label: Text(l10n.eventRegistrationCancelAction),
        ),
      ],
    );
  }
}
