import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import 'member_auth_inline_error.dart';
import '../../application/member_federated_auth_coordinator.dart';
import '../../data/member_federated_auth_service.dart';

class MemberFederatedAuthActions extends ConsumerStatefulWidget {
  const MemberFederatedAuthActions({super.key, required this.onSignedIn});

  final VoidCallback onSignedIn;

  @override
  ConsumerState<MemberFederatedAuthActions> createState() =>
      _MemberFederatedAuthActionsState();
}

class _MemberFederatedAuthActionsState
    extends ConsumerState<MemberFederatedAuthActions> {
  MemberFederatedProvider? _loadingProvider;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final federatedAuth = ref.watch(memberFederatedAuthServiceProvider);
    if (!federatedAuth.isAvailable) {
      return const SizedBox.shrink();
    }
    final l10n = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: Divider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                l10n.memberAuthAlternative,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const Expanded(child: Divider()),
          ],
        ),
        const SizedBox(height: 16),
        _FederatedButton(
          label: l10n.memberContinueWithGoogle,
          icon: Icons.g_mobiledata_rounded,
          loading: _loadingProvider == MemberFederatedProvider.google,
          enabled: _loadingProvider == null,
          onPressed: () => _authenticate(MemberFederatedProvider.google),
        ),
        const SizedBox(height: 12),
        _FederatedButton(
          label: l10n.memberContinueWithApple,
          icon: Icons.apple,
          loading: _loadingProvider == MemberFederatedProvider.apple,
          enabled: _loadingProvider == null,
          onPressed: () => _authenticate(MemberFederatedProvider.apple),
        ),
        if (_error != null) ...[
          const SizedBox(height: 10),
          MemberAuthInlineError(message: _error!),
        ],
      ],
    );
  }

  Future<void> _authenticate(MemberFederatedProvider provider) async {
    setState(() {
      _loadingProvider = provider;
      _error = null;
    });
    try {
      final result = await ref
          .read(memberFederatedAuthCoordinatorProvider)
          .signIn(provider);
      if (!mounted) return;
      if (result.session != null) {
        widget.onSignedIn();
      } else {
        setState(() {
          _error = AppLocalizations.of(context)!
              .memberRegistrationPendingApproval;
        });
      }
    } on MemberFederatedAuthCanceled {
      // Closing a provider sheet is an intentional no-op.
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _messageFor(error));
    } finally {
      if (mounted) setState(() => _loadingProvider = null);
    }
  }

  String _messageFor(Object error) {
    final l10n = AppLocalizations.of(context)!;
    if (error is MemberFederatedAuthException &&
        error.code == 'firebase_not_configured') {
      return l10n.memberFederatedSetupUnavailable;
    }
    if (error is ApiError &&
        error.hasCode(const {'member_firebase_auth_unavailable'})) {
      return l10n.memberFederatedSetupUnavailable;
    }
    if (error is ApiError &&
        error.hasCode(const {'member_registration_closed'})) {
      return l10n.memberRegistrationClosed;
    }
    return l10n.memberFederatedSignInFailed;
  }
}

class _FederatedButton extends StatelessWidget {
  const _FederatedButton({
    required this.label,
    required this.icon,
    required this.loading,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool loading;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: AppButton(
        label: label,
        icon: icon,
        variant: AppButtonVariant.tonal,
        minHeight: 52,
        loading: loading,
        onPressed: enabled ? onPressed : null,
      ),
    );
  }
}
