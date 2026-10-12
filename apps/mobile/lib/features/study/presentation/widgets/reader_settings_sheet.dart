import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';

class ReaderSettingsSheet extends StatefulWidget {
  const ReaderSettingsSheet({
    super.key,
    required this.readerScale,
    required this.onReaderScaleChanged,
  });

  final double readerScale;
  final ValueChanged<double> onReaderScaleChanged;

  @override
  State<ReaderSettingsSheet> createState() => _ReaderSettingsSheetState();
}

class _ReaderSettingsSheetState extends State<ReaderSettingsSheet> {
  late double _readerScale;

  @override
  void initState() {
    super.initState();
    _readerScale = widget.readerScale;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.readerSettingsTitle,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.format_size),
              Expanded(
                child: Slider(
                  value: _readerScale,
                  min: 0.9,
                  max: 1.35,
                  divisions: 9,
                  label: '${(_readerScale * 100).round()}%',
                  onChanged: (value) {
                    setState(() {
                      _readerScale = value;
                    });
                    widget.onReaderScaleChanged(value);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
