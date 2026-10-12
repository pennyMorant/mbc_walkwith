import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../l10n/app_localizations.dart';
import '../utils/date_period.dart';

Future<DatePeriod?> showPeriodSelectorSheet(
  BuildContext context,
  DatePeriod initialPeriod,
) {
  return showModalBottomSheet<DatePeriod>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => _PeriodSelectorSheet(initialPeriod: initialPeriod),
  );
}

String periodLabel(
  BuildContext context,
  DatePeriod period, {
  bool short = false,
}) {
  final l10n = AppLocalizations.of(context)!;
  final locale = Localizations.localeOf(context).toLanguageTag();
  if (period.isCurrent) {
    return switch (period.mode) {
      DatePeriodMode.week => l10n.periodThisWeek,
      DatePeriodMode.month => l10n.periodThisMonth,
    };
  }
  if (period.mode == DatePeriodMode.month) {
    return DateFormat.yMMM(locale).format(period.start);
  }
  final start = DateFormat.Md(locale).format(period.start);
  final end = DateFormat.Md(
    locale,
  ).format(period.end.subtract(const Duration(days: 1)));
  return short ? '$start-$end' : '$start - $end';
}

class _PeriodSelectorSheet extends StatefulWidget {
  const _PeriodSelectorSheet({required this.initialPeriod});

  final DatePeriod initialPeriod;

  @override
  State<_PeriodSelectorSheet> createState() => _PeriodSelectorSheetState();
}

class _PeriodSelectorSheetState extends State<_PeriodSelectorSheet> {
  late DatePeriod _period = widget.initialPeriod;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: _period.mode == DatePeriodMode.month
              ? _MonthPickerGrid(
                  selectedPeriod: _period,
                  onYearChanged: (period) => setState(() => _period = period),
                  onSelected: _selectPeriod,
                )
              : _WeekCalendarPicker(
                  selectedPeriod: _period,
                  onSelected: _selectPeriod,
                ),
        ),
      ),
    );
  }

  void _selectPeriod(DatePeriod period) {
    Navigator.pop(context, period);
  }
}

class _MonthPickerGrid extends StatelessWidget {
  const _MonthPickerGrid({
    required this.selectedPeriod,
    required this.onYearChanged,
    required this.onSelected,
  });

  final DatePeriod selectedPeriod;
  final ValueChanged<DatePeriod> onYearChanged;
  final ValueChanged<DatePeriod> onSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final locale = Localizations.localeOf(context).toLanguageTag();

    return Column(
      children: [
        Row(
          children: [
            IconButton.filledTonal(
              tooltip: AppLocalizations.of(context)!.periodPreviousAction,
              onPressed: () => onYearChanged(_yearPeriod(selectedPeriod, -1)),
              icon: const Icon(Icons.chevron_left),
            ),
            Expanded(
              child: Center(
                child: Text(
                  DateFormat.y(locale).format(selectedPeriod.start),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            IconButton.filledTonal(
              tooltip: AppLocalizations.of(context)!.periodNextAction,
              onPressed: () => onYearChanged(_yearPeriod(selectedPeriod, 1)),
              icon: const Icon(Icons.chevron_right),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 12,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.55,
          ),
          itemBuilder: (context, index) {
            final month = index + 1;
            final monthPeriod = DatePeriod.fromDate(
              mode: DatePeriodMode.month,
              date: DateTime(selectedPeriod.start.year, month),
            );
            final selected = month == selectedPeriod.start.month;
            return FilledButton.tonal(
              style: FilledButton.styleFrom(
                backgroundColor: selected
                    ? colorScheme.primary
                    : colorScheme.surfaceContainerHighest.withValues(
                        alpha: 0.55,
                      ),
                foregroundColor: selected
                    ? colorScheme.onPrimary
                    : colorScheme.onSurface,
                shape: const StadiumBorder(),
              ),
              onPressed: () => onSelected(monthPeriod),
              child: Text(DateFormat.MMM(locale).format(monthPeriod.start)),
            );
          },
        ),
      ],
    );
  }
}

class _WeekCalendarPicker extends StatelessWidget {
  const _WeekCalendarPicker({
    required this.selectedPeriod,
    required this.onSelected,
  });

  final DatePeriod selectedPeriod;
  final ValueChanged<DatePeriod> onSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: ColoredBox(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
        child: CalendarDatePicker(
          initialDate: selectedPeriod.anchor,
          firstDate: DateTime(2020),
          lastDate: DateTime(2035, 12, 31),
          onDateChanged: (date) {
            onSelected(
              DatePeriod.fromDate(mode: selectedPeriod.mode, date: date),
            );
          },
        ),
      ),
    );
  }
}

DatePeriod _yearPeriod(DatePeriod period, int offset) => DatePeriod.fromDate(
  mode: DatePeriodMode.month,
  date: DateTime(period.start.year + offset, period.start.month),
);
