import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../data/member_session_repository.dart';
import 'widgets/member_auth_page_layout.dart';
import 'widgets/member_federated_auth_actions.dart';

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
          autofillHints: const [AutofillHints.newUsername],
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          hintText: l10n.memberEmailLabel,
          prefixIcon: const Icon(Icons.mail_outline),
        ),
        const SizedBox(height: 12),
        AppFilledTextField(
          controller: _passwordController,
          autofillHints: const [AutofillHints.newPassword],
          obscureText: true,
          textInputAction: TextInputAction.next,
          hintText: l10n.memberPasswordLabel,
          prefixIcon: const Icon(Icons.lock_outline),
        ),
        const SizedBox(height: 12),
        AppFilledTextField(
          controller: _confirmController,
          autofillHints: const [AutofillHints.newPassword],
          obscureText: true,
          textInputAction: TextInputAction.done,
          hintText: l10n.memberConfirmPasswordLabel,
          prefixIcon: const Icon(Icons.lock_reset_outlined),
          onSubmitted: (_) => _register(),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(
            _error!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _loading ? null : _register,
            child: Text(l10n.memberRegisterAction),
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
      if (mounted) setState(() => _error = formatApiErrorMessage(error));
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
