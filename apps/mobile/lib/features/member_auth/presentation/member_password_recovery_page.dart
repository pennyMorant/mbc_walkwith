import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../data/member_session_repository.dart';
import 'widgets/member_auth_page_layout.dart';

class MemberPasswordRecoveryPage extends ConsumerStatefulWidget {
  const MemberPasswordRecoveryPage({super.key, this.email});
  final String? email;

  @override
  ConsumerState<MemberPasswordRecoveryPage> createState() =>
      _MemberPasswordRecoveryPageState();
}

class _MemberPasswordRecoveryPageState
    extends ConsumerState<MemberPasswordRecoveryPage> {
  late final TextEditingController _emailController;
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  MemberCodeRequestResult? _request;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.email ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final request = _request;
    return MemberAuthPageLayout(
      title: l10n.memberPasswordResetTitle,
      body: request == null
          ? l10n.memberPasswordResetRequestBody
          : l10n.memberPasswordResetCodeBody,
      children: [
        if (request == null)
          AppFilledTextField(
            controller: _emailController,
            autofillHints: const [AutofillHints.email],
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            hintText: l10n.memberEmailLabel,
            prefixIcon: const Icon(Icons.mail_outline),
            onSubmitted: (_) => _requestCode(),
          ),
        if (request != null) ...[
          AppFilledTextField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            hintText: l10n.memberCodeLabel,
            prefixIcon: const Icon(Icons.pin_outlined),
          ),
          const SizedBox(height: 12),
          AppFilledTextField(
            controller: _passwordController,
            autofillHints: const [AutofillHints.newPassword],
            obscureText: true,
            textInputAction: TextInputAction.done,
            hintText: l10n.memberPasswordLabel,
            prefixIcon: const Icon(Icons.lock_outline),
            onSubmitted: (_) => _confirm(request),
          ),
          if (kDebugMode && request.devCode != null) ...[
            const SizedBox(height: 8),
            Text('Dev code: ${request.devCode}'),
          ],
        ],
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _loading
                ? null
                : request == null
                ? _requestCode
                : () => _confirm(request),
            child: Text(
              request == null
                  ? l10n.memberNextAction
                  : l10n.memberPasswordResetAction,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _requestCode() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(memberSessionRepositoryProvider)
          .requestPasswordReset(email: _emailController.text);
      if (mounted) setState(() => _request = result);
    } catch (error) {
      if (mounted) setState(() => _error = formatApiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirm(MemberCodeRequestResult request) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(memberSessionRepositoryProvider)
          .confirmPasswordReset(
            challengeId: request.challengeId,
            code: _codeController.text,
            password: _passwordController.text,
          );
      await ref.read(memberSessionRepositoryProvider).clearLocalSession();
      ref.invalidate(memberSessionProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.memberPasswordResetComplete,
            ),
          ),
        );
        context.goNamed(AppRouteNames.memberLoginEmail);
      }
    } catch (error) {
      if (mounted) setState(() => _error = formatApiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
