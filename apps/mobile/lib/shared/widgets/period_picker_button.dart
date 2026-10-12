import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../utils/date_period.dart';
import 'period_selector_sheet.dart';

typedef DatePeriodLabelBuilder =
    String Function(BuildContext context, DatePeriod period);

class PeriodPickerButton extends StatelessWidget {
  const PeriodPickerButton({
    super.key,
    required this.period,
    required this.onChanged,
    this.labelBuilder,
  });

  final DatePeriod period;
  final ValueChanged<DatePeriod> onChanged;
  final DatePeriodLabelBuilder? labelBuilder;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final label =
        labelBuilder?.call(context, period) ??
        periodLabel(context, period, short: true);

    return Tooltip(
      message: l10n.periodPickerTooltip,
      child: Material(
        color: colorScheme.primary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: () async {
            final selected = await showPeriodSelectorSheet(context, period);
            if (selected != null) {
              onChanged(selected);
            }
          },
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.calendar_month_outlined,
                    color: colorScheme.primary,
                    size: 21,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
