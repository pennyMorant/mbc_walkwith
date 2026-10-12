import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/newcomer_repository.dart';

class NewcomerWelcomeSheet extends ConsumerStatefulWidget {
  const NewcomerWelcomeSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => const NewcomerWelcomeSheet(),
    );
  }

  @override
  ConsumerState<NewcomerWelcomeSheet> createState() =>
      _NewcomerWelcomeSheetState();
}

class _NewcomerWelcomeSheetState extends ConsumerState<NewcomerWelcomeSheet> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _interestController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _interestController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.waving_hand_outlined, color: colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      l10n.newcomerSheetTitle,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                session == null
                    ? l10n.newcomerSheetGuestBody
                    : l10n.newcomerSheetMemberBody,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 18),
              AppFilledTextField(
                controller: _nameController,
                enabled: !_isSubmitting,
                textInputAction: TextInputAction.next,
                hintText: l10n.newcomerNameLabel,
              ),
              const SizedBox(height: 10),
              AppFilledTextField(
                controller: _emailController,
                enabled: !_isSubmitting,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                hintText: l10n.newcomerEmailLabel,
              ),
              const SizedBox(height: 10),
              AppFilledTextField(
                controller: _phoneController,
                enabled: !_isSubmitting,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                hintText: l10n.newcomerPhoneLabel,
              ),
              const SizedBox(height: 10),
              AppFilledTextField(
                controller: _interestController,
                enabled: !_isSubmitting,
                minLines: 3,
                maxLines: 5,
                textInputAction: TextInputAction.newline,
                hintText: l10n.newcomerInterestLabel,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _isSubmitting ? null : _submit,
                  icon: _isSubmitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send_outlined),
                  label: Text(l10n.newcomerSubmitAction),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_isSubmitting) {
      return;
    }
    final l10n = AppLocalizations.of(context)!;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final displayName = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final interest = _interestController.text.trim();

    if (displayName.isEmpty) {
      setState(() => _error = l10n.newcomerNameValidationError);
      return;
    }
    if (email.isEmpty && phone.isEmpty) {
      setState(() => _error = l10n.newcomerContactValidationError);
      return;
    }
    if (email.isNotEmpty && !_looksLikeEmail(email)) {
      setState(() => _error = l10n.newcomerEmailValidationError);
      return;
    }
    final preferredLanguage = Localizations.localeOf(context).toLanguageTag();

    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      final identity = await ref.read(newcomerIdentityProvider.future);
      await ref
          .read(newcomerRepositoryProvider)
          .submitNewcomer(
            identity: identity,
            displayName: displayName,
            preferredLanguage: preferredLanguage,
            email: email.isEmpty ? null : email,
            phone: phone.isEmpty ? null : phone,
            interest: interest.isEmpty ? null : interest,
          );
      if (mounted) {
        navigator.pop();
        messenger.showSnackBar(
          SnackBar(content: Text(l10n.newcomerSubmittedMessage)),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = formatApiErrorMessage(error));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}

bool _looksLikeEmail(String value) {
  return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
}
