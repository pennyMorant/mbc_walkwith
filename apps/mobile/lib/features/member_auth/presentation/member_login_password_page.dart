import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../life/presentation/push_notifications_controller.dart';
import '../data/member_session_repository.dart';
import 'member_auth_error_message.dart';
import 'widgets/member_auth_account_row.dart';
import 'widgets/member_auth_inline_error.dart';
import 'widgets/member_auth_page_layout.dart';
import 'widgets/member_password_field.dart';

class MemberLoginPasswordPage extends ConsumerStatefulWidget {
  const MemberLoginPasswordPage({super.key, required this.email});

  final String? email;

  @override
  ConsumerState<MemberLoginPasswordPage> createState() =>
      _MemberLoginPasswordPageState();
}

class _MemberLoginPasswordPageState
    extends ConsumerState<MemberLoginPasswordPage> {
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final email = widget.email;
    final l10n = AppLocalizations.of(context)!;
    if (email == null || email.isEmpty) {
      return MemberAuthPageLayout(
        title: l10n.memberLoginEmailTitle,
        body: l10n.memberLoginEmailBody,
        children: [
          AppButton(
            label: l10n.memberBackToSignInAction,
            variant: AppButtonVariant.filled,
            minHeight: 52,
            onPressed: () => context.goNamed(AppRouteNames.memberLoginEmail),
          ),
        ],
      );
    }
    return PopScope(
      canPop: !_isLoading,
      child: MemberAuthPageLayout(
        title: l10n.memberPasswordTitle,
        children: [
          MemberAuthAccountRow(
            email: email,
            actionLabel: l10n.memberChangeEmailAction,
            onPressed: _isLoading ? null : context.pop,
          ),
          const SizedBox(height: 16),
          AutofillGroup(
            child: MemberPasswordField(
              controller: _passwordController,
              autofillHints: const [AutofillHints.password],
              enabled: !_isLoading,
              autofocus: true,
              textInputAction: TextInputAction.done,
              hintText: l10n.memberPasswordLabel,
              onSubmitted: (_) => _login(email),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            MemberAuthInlineError(message: _error!),
          ],
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: AppButton(
              label: l10n.memberForgotPasswordAction,
              variant: AppButtonVariant.text,
              minHeight: 40,
              onPressed: _isLoading
                  ? null
                  : () => context.pushNamed(
                      AppRouteNames.memberPasswordRecovery,
                      extra: email,
                    ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: l10n.memberSignInAction,
              variant: AppButtonVariant.filled,
              minHeight: 52,
              loading: _isLoading,
              onPressed: _isLoading ? null : () => _login(email),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _login(String email) async {
    final requestError = AppLocalizations.of(context)!.memberAuthRequestError;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ref
          .read(memberSessionRepositoryProvider)
          .login(email: email, password: _passwordController.text);
      TextInput.finishAutofillContext();
      ref.invalidate(memberSessionProvider);
      try {
        await ref
            .read(pushNotificationsControllerProvider.notifier)
            .syncCurrentSession();
      } catch (_) {}
      if (mounted) {
        _finishSignedIn();
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = memberAuthErrorMessage(error, fallback: requestError),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
