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

class MemberEmailVerificationPage extends ConsumerStatefulWidget {
  const MemberEmailVerificationPage({super.key, required this.request});
  final MemberCodeRequestResult? request;

  @override
  ConsumerState<MemberEmailVerificationPage> createState() =>
      _MemberEmailVerificationPageState();
}

class _MemberEmailVerificationPageState
    extends ConsumerState<MemberEmailVerificationPage> {
  final _codeController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final request = widget.request;
    if (request == null) {
      return MemberAuthPageLayout(
        title: l10n.memberRegisterAction,
        children: [
          FilledButton(
            onPressed: () => context.goNamed(AppRouteNames.memberRegister),
            child: Text(l10n.memberBackToSignInAction),
          ),
        ],
      );
    }
    return MemberAuthPageLayout(
      title: l10n.memberVerifyEmailAction,
      body: request.maskedEmail,
      children: [
        AppFilledTextField(
          controller: _codeController,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          hintText: l10n.memberCodeLabel,
          prefixIcon: const Icon(Icons.pin_outlined),
          onSubmitted: (_) => _verify(request),
        ),
        if (kDebugMode && request.devCode != null) ...[
          const SizedBox(height: 8),
          Text('Dev code: ${request.devCode}'),
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
            onPressed: _loading ? null : () => _verify(request),
            child: Text(l10n.memberVerifyEmailAction),
          ),
        ),
      ],
    );
  }

  Future<void> _verify(MemberCodeRequestResult request) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(memberSessionRepositoryProvider)
          .verifyCode(
            challengeId: request.challengeId,
            code: _codeController.text,
          );
      if (!mounted) return;
      if (result.session != null) {
        ref.invalidate(memberSessionProvider);
        _finishSignedIn();
      } else {
        setState(
          () => _error = AppLocalizations.of(
            context,
          )!.memberRegistrationPendingApproval,
        );
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
