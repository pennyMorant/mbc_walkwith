import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../data/member_session_repository.dart';
import 'member_auth_error_message.dart';
import 'widgets/member_auth_inline_error.dart';
import 'widgets/member_auth_page_layout.dart';
import 'widgets/member_federated_auth_actions.dart';
import 'widgets/member_password_field.dart';

class MemberRegistrationPage extends ConsumerStatefulWidget {
  const MemberRegistrationPage({super.key});

  @override
  ConsumerState<MemberRegistrationPage> createState() =>
      _MemberRegistrationPageState();
}

class _MemberRegistrationPageState
    extends ConsumerState<MemberRegistrationPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return MemberAuthPageLayout(
      title: l10n.memberCreateAccountAction,
      children: [
        AppFilledTextField(
          controller: _emailController,
          enabled: !_loading,
          autofillHints: const [AutofillHints.newUsername],
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          hintText: l10n.memberEmailLabel,
          prefixIcon: const Icon(Icons.mail_outline),
        ),
        const SizedBox(height: 12),
        MemberPasswordField(
          controller: _passwordController,
          enabled: !_loading,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.next,
          hintText: l10n.memberPasswordLabel,
        ),
        const SizedBox(height: 12),
        MemberPasswordField(
          controller: _confirmController,
          enabled: !_loading,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.done,
          hintText: l10n.memberConfirmPasswordLabel,
          prefixIcon: const Icon(Icons.lock_reset_outlined),
          onSubmitted: (_) => _register(),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          MemberAuthInlineError(message: _error!),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: AppButton(
            label: l10n.memberRegisterAction,
            variant: AppButtonVariant.filled,
            minHeight: 52,
            loading: _loading,
            onPressed: _loading ? null : _register,
          ),
        ),
        const SizedBox(height: 20),
        MemberFederatedAuthActions(onSignedIn: _finishSignedIn),
      ],
    );
  }

  Future<void> _register() async {
    final l10n = AppLocalizations.of(context)!;
    if (_passwordController.text != _confirmController.text) {
      setState(() => _error = l10n.memberPasswordMismatch);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(memberSessionRepositoryProvider)
          .register(
            email: _emailController.text,
            password: _passwordController.text,
          );
      if (!mounted) return;
      if (result.session != null) {
        ref.invalidate(memberSessionProvider);
        _finishSignedIn();
      } else if (result.codeRequest != null) {
        context.replaceNamed(
          AppRouteNames.memberEmailVerification,
          extra: result.codeRequest,
        );
      } else {
        setState(() => _error = l10n.memberRegistrationPendingApproval);
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = memberAuthErrorMessage(
            error,
            fallback: l10n.memberAuthRequestError,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _finishSignedIn() {
    if (context.canPop()) {
      context.pop();
    }
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.mine);
  }
}
