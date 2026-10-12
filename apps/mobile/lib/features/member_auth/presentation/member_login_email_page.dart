import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/settings/app_settings_repository.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/filled_text_field.dart';
import 'widgets/member_auth_page_layout.dart';
import 'widgets/member_federated_auth_actions.dart';
import 'widgets/member_auth_inline_error.dart';

class MemberLoginEmailPage extends ConsumerStatefulWidget {
  const MemberLoginEmailPage({super.key});

  @override
  ConsumerState<MemberLoginEmailPage> createState() =>
      _MemberLoginEmailPageState();
}

class _MemberLoginEmailPageState extends ConsumerState<MemberLoginEmailPage> {
  final _emailController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(
          data: (settings) => settings,
          orElse: () => AppSettings.defaults,
        );
    return MemberAuthPageLayout(
      title: l10n.memberLoginEmailTitle,
      body: l10n.memberLoginEmailBody,
      children: [
        AutofillGroup(
          child: AppFilledTextField(
            controller: _emailController,
            autofillHints: const [AutofillHints.email],
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofocus: true,
            hintText: l10n.memberEmailLabel,
            prefixIcon: const Icon(Icons.mail_outline),
            onSubmitted: (_) => _continueToPassword(),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          MemberAuthInlineError(message: _error!),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: AppButton(
            label: l10n.memberNextAction,
            variant: AppButtonVariant.filled,
            minHeight: 52,
            onPressed: _continueToPassword,
          ),
        ),
        if (settings.memberRegistrationOpen) ...[
          const SizedBox(height: 8),
          Center(
            child: AppButton(
              label: l10n.memberCreateAccountAction,
              variant: AppButtonVariant.text,
              onPressed: () => context.pushNamed(AppRouteNames.memberRegister),
            ),
          ),
        ],
        const SizedBox(height: 24),
        MemberFederatedAuthActions(onSignedIn: _finishSignedIn),
      ],
    );
  }

  void _continueToPassword() {
    final email = _emailController.text.trim().toLowerCase();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _error = AppLocalizations.of(context)!.memberInvalidEmail);
      return;
    }
    context.pushNamed(AppRouteNames.memberLoginPassword, extra: email);
  }

  void _finishSignedIn() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.mine);
  }
}
