import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import 'event_registration_pending_action.dart';

class EventRegistrationActionButtons extends StatelessWidget {
  const EventRegistrationActionButtons({
    super.key,
    required this.isSignedIn,
    required this.isRegistered,
    required this.isCheckedIn,
    required this.pendingAction,
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
  final EventRegistrationPendingAction? pendingAction;
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
    final isSubmitting = pendingAction != null;
    if (!isSignedIn) {
      return _ResponsiveRegistrationActions(
        children: [
          AppButton(
            label: l10n.memberSignInAction,
            icon: Icons.login,
            variant: AppButtonVariant.filled,
            onPressed: onSignIn,
          ),
        ],
      );
    }
    if (!isRegistered) {
      final disabled = isSubmitting || registrationClosed || registrationFull;
      return _ResponsiveRegistrationActions(
        children: [
          AppButton(
            label: l10n.eventRegistrationRegisterAction,
            icon: Icons.how_to_reg_outlined,
            variant: AppButtonVariant.filled,
            loading: pendingAction == EventRegistrationPendingAction.register,
            onPressed: disabled ? null : onRegister,
          ),
        ],
      );
    }
    return _ResponsiveRegistrationActions(
      children: [
        if (!isCheckedIn)
          AppButton(
            label: l10n.eventCheckInScanAction,
            icon: Icons.qr_code_scanner_outlined,
            variant: AppButtonVariant.filled,
            onPressed: isSubmitting ? null : onCheckIn,
          ),
        AppButton(
          label: l10n.eventRegistrationUpdateAction,
          icon: Icons.save_outlined,
          variant: AppButtonVariant.filled,
          loading: pendingAction == EventRegistrationPendingAction.update,
          onPressed: isSubmitting || !canUpdateRegistration ? null : onUpdate,
        ),
        AppButton(
          label: l10n.eventRegistrationCancelAction,
          icon: Icons.event_busy_outlined,
          variant: AppButtonVariant.tonal,
          loading: pendingAction == EventRegistrationPendingAction.cancel,
          onPressed: isSubmitting || !allowCancellation ? null : onCancel,
        ),
      ],
    );
  }
}

class _ResponsiveRegistrationActions extends StatelessWidget {
  const _ResponsiveRegistrationActions({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 360) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var index = 0; index < children.length; index++) ...[
                if (index > 0) const SizedBox(height: 8),
                children[index],
              ],
            ],
          );
        }

        return Wrap(spacing: 8, runSpacing: 8, children: children);
      },
    );
  }
}
