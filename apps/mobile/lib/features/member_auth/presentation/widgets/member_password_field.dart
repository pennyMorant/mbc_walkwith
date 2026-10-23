import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';

class MemberPasswordField extends StatefulWidget {
  const MemberPasswordField({
    super.key,
    required this.controller,
    required this.hintText,
    this.prefixIcon = const Icon(Icons.lock_outline),
    this.enabled = true,
    this.autofocus = false,
    this.textInputAction,
    this.autofillHints,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String hintText;
  final Widget prefixIcon;
  final bool enabled;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;

  @override
  State<MemberPasswordField> createState() => _MemberPasswordFieldState();
}

class _MemberPasswordFieldState extends State<MemberPasswordField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return AppFilledTextField(
      controller: widget.controller,
      hintText: widget.hintText,
      prefixIcon: widget.prefixIcon,
      suffixIcon: IconButton(
        tooltip: _obscureText
            ? l10n.memberShowPasswordTooltip
            : l10n.memberHidePasswordTooltip,
        onPressed: widget.enabled
            ? () => setState(() => _obscureText = !_obscureText)
            : null,
        icon: Icon(
          _obscureText
              ? Icons.visibility_outlined
              : Icons.visibility_off_outlined,
        ),
      ),
      obscureText: _obscureText,
      enabled: widget.enabled,
      autofocus: widget.autofocus,
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      onSubmitted: widget.onSubmitted,
    );
  }
}
