import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

class AppFilledTextField extends StatelessWidget {
  const AppFilledTextField({
    super.key,
    required this.controller,
    required this.hintText,
    this.prefixIcon,
    this.prefixText,
    this.suffixIcon,
    this.fillColor,
    this.helperText,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.enabled,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.onSubmitted,
    this.autofillHints,
    this.autofocus = false,
  });

  final TextEditingController controller;
  final String hintText;
  final Widget? prefixIcon;
  final String? prefixText;
  final Widget? suffixIcon;
  final Color? fillColor;
  final String? helperText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool? enabled;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      cursorColor: Theme.of(context).colorScheme.onSurfaceVariant,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      obscureText: obscureText,
      autofillHints: autofillHints,
      autofocus: autofocus,
      enabled: enabled,
      minLines: obscureText ? 1 : minLines,
      maxLines: obscureText ? 1 : maxLines,
      maxLength: maxLength,
      decoration: appFilledInputDecoration(
        context,
        hintText: hintText,
        prefixIcon: prefixIcon,
        prefixText: prefixText,
        suffixIcon: suffixIcon,
        fillColor: fillColor,
        helperText: helperText,
      ),
      onChanged: onChanged,
      onSubmitted: onSubmitted,
    );
  }
}

InputDecoration appFilledInputDecoration(
  BuildContext context, {
  required String hintText,
  Widget? prefixIcon,
  String? prefixText,
  Widget? suffixIcon,
  Color? fillColor,
  String? helperText,
}) {
  final colorScheme = Theme.of(context).colorScheme;
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(16),
    borderSide: BorderSide.none,
  );
  return InputDecoration(
    hintText: hintText,
    helperText: helperText,
    prefixIcon: prefixIcon,
    prefixText: prefixText,
    suffixIcon: suffixIcon,
    floatingLabelBehavior: FloatingLabelBehavior.never,
    filled: true,
    fillColor: fillColor ?? colorScheme.tintedCardColor,
    border: border,
    enabledBorder: border,
    disabledBorder: border,
    focusedBorder: border,
    errorBorder: border.copyWith(
      borderSide: BorderSide(color: colorScheme.error, width: 1.2),
    ),
    focusedErrorBorder: border.copyWith(
      borderSide: BorderSide(color: colorScheme.error, width: 1.2),
    ),
  );
}
