import 'package:flutter/material.dart';

import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_button.dart';

class ServingDateTimeField extends StatelessWidget {
  const ServingDateTimeField({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final DateTime value;
  final IconData icon;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ServingFieldLabel(text: label),
        SizedBox(
          width: double.infinity,
          child: AppButton(
            label: formatDateTime(context, value),
            icon: icon,
            shape: AppButtonShape.rounded,
            onPressed: enabled ? onPressed : null,
          ),
        ),
      ],
    );
  }
}

class ServingFieldLabel extends StatelessWidget {
  const ServingFieldLabel({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: Theme.of(
          context,
        ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

Future<DateTime?> selectServingDateTime(
  BuildContext context, {
  required DateTime current,
}) async {
  final now = DateTime.now();
  final selectedDate = await showDatePicker(
    context: context,
    initialDate: current,
    firstDate: DateTime(now.year, now.month, now.day),
    lastDate: now.add(const Duration(days: 730)),
  );
  if (selectedDate == null || !context.mounted) {
    return null;
  }
  final selectedTime = await showTimePicker(
    context: context,
    initialTime: TimeOfDay.fromDateTime(current),
  );
  if (selectedTime == null) {
    return null;
  }
  return DateTime(
    selectedDate.year,
    selectedDate.month,
    selectedDate.day,
    selectedTime.hour,
    selectedTime.minute,
  );
}
