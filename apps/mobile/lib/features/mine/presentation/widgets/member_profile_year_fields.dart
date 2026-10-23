import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';

class MemberProfileYearFields extends StatelessWidget {
  const MemberProfileYearFields({
    super.key,
    required this.faithYearController,
    required this.baptizedYearController,
    required this.enabled,
  });

  final TextEditingController faithYearController;
  final TextEditingController baptizedYearController;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final faithYearField = AppFilledTextField(
      controller: faithYearController,
      enabled: enabled,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.next,
      hintText: l10n.memberFaithStartYearLabel,
    );
    final baptizedYearField = AppFilledTextField(
      controller: baptizedYearController,
      enabled: enabled,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.next,
      hintText: l10n.memberBaptizedYearLabel,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final stackFields = constraints.maxWidth < 300 || textScale > 1.15;
        if (stackFields) {
          return Column(
            children: [
              faithYearField,
              const SizedBox(height: 12),
              baptizedYearField,
            ],
          );
        }
        return Row(
          children: [
            Expanded(child: faithYearField),
            const SizedBox(width: 12),
            Expanded(child: baptizedYearField),
          ],
        );
      },
    );
  }
}
