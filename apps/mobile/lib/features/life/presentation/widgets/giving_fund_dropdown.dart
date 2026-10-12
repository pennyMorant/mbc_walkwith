import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../domain/giving_record.dart';

class GivingFundDropdown extends StatelessWidget {
  const GivingFundDropdown({
    super.key,
    required this.funds,
    required this.selectedFundId,
    required this.onChanged,
  });

  final List<GivingFund> funds;
  final String? selectedFundId;
  final ValueChanged<String?>? onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final String selectedId =
        selectedFundId != null && funds.any((fund) => fund.id == selectedFundId)
        ? selectedFundId!
        : funds.first.id;
    final selectedFund = _fundById(selectedId);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          initialValue: selectedId,
          decoration: appFilledInputDecoration(
            context,
            hintText: l10n.givingFundLabel,
          ),
          items: [
            for (final fund in funds)
              DropdownMenuItem<String>(
                value: fund.id,
                child: Text(fund.name, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: onChanged,
        ),
        if (selectedFund.description.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            selectedFund.description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }

  GivingFund _fundById(String id) {
    for (final fund in funds) {
      if (fund.id == id) {
        return fund;
      }
    }
    return funds.first;
  }
}
