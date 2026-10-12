import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../domain/sermon_discovery_facets.dart';

class SermonFilterSelection {
  const SermonFilterSelection({this.speaker, this.series, this.topic});

  final String? speaker;
  final String? series;
  final String? topic;

  int get activeCount => [speaker, series, topic].whereType<String>().length;
  bool get isEmpty => activeCount == 0;
}

Future<SermonFilterSelection?> showSermonFilterSheet(
  BuildContext context, {
  required SermonDiscoveryFacets facets,
  required SermonFilterSelection initialSelection,
}) {
  return showModalBottomSheet<SermonFilterSelection>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (context) =>
        _SermonFilterSheet(facets: facets, initialSelection: initialSelection),
  );
}

class SermonActiveFiltersBar extends StatelessWidget {
  const SermonActiveFiltersBar({
    super.key,
    required this.selection,
    required this.onChanged,
  });

  final SermonFilterSelection selection;
  final ValueChanged<SermonFilterSelection> onChanged;

  @override
  Widget build(BuildContext context) {
    final buttons = <Widget>[
      if (selection.speaker != null)
        _removeButton(
          selection.speaker!,
          () => onChanged(
            SermonFilterSelection(
              series: selection.series,
              topic: selection.topic,
            ),
          ),
        ),
      if (selection.series != null)
        _removeButton(
          selection.series!,
          () => onChanged(
            SermonFilterSelection(
              speaker: selection.speaker,
              topic: selection.topic,
            ),
          ),
        ),
      if (selection.topic != null)
        _removeButton(
          selection.topic!,
          () => onChanged(
            SermonFilterSelection(
              speaker: selection.speaker,
              series: selection.series,
            ),
          ),
        ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: Row(spacing: 8, children: buttons),
    );
  }

  Widget _removeButton(String label, VoidCallback onPressed) {
    return AppButton(
      label: label,
      icon: Icons.close,
      selected: true,
      minHeight: 36,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      onPressed: onPressed,
    );
  }
}

class _SermonFilterSheet extends StatefulWidget {
  const _SermonFilterSheet({
    required this.facets,
    required this.initialSelection,
  });

  final SermonDiscoveryFacets facets;
  final SermonFilterSelection initialSelection;

  @override
  State<_SermonFilterSheet> createState() => _SermonFilterSheetState();
}

class _SermonFilterSheetState extends State<_SermonFilterSheet> {
  late String? _speaker = widget.initialSelection.speaker;
  late String? _series = widget.initialSelection.series;
  late String? _topic = widget.initialSelection.topic;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final maxHeight = MediaQuery.sizeOf(context).height * 0.85;

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: maxHeight),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.sermonFilterTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _FilterGroup(
                      title: l10n.sermonFilterSpeakerLabel,
                      values: widget.facets.speakers,
                      selectedValue: _speaker,
                      onSelected: (value) => setState(() => _speaker = value),
                    ),
                    _FilterGroup(
                      title: l10n.sermonFilterSeriesLabel,
                      values: widget.facets.series,
                      selectedValue: _series,
                      onSelected: (value) => setState(() => _series = value),
                    ),
                    _FilterGroup(
                      title: l10n.sermonFilterTopicLabel,
                      values: widget.facets.topics,
                      selectedValue: _topic,
                      onSelected: (value) => setState(() => _topic = value),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: l10n.sermonFilterClearAction,
                    onPressed: () => setState(() {
                      _speaker = null;
                      _series = null;
                      _topic = null;
                    }),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    label: l10n.periodApplyAction,
                    variant: AppButtonVariant.filled,
                    onPressed: () => Navigator.of(context).pop(
                      SermonFilterSelection(
                        speaker: _speaker,
                        series: _series,
                        topic: _topic,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterGroup extends StatelessWidget {
  const _FilterGroup({
    required this.title,
    required this.values,
    required this.selectedValue,
    required this.onSelected,
  });

  final String title;
  final List<String> values;
  final String? selectedValue;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    if (values.isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: values
                .map((value) {
                  final selected = value == selectedValue;
                  return AppButton(
                    label: value,
                    selected: selected,
                    minHeight: 38,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    onPressed: () => onSelected(selected ? null : value),
                  );
                })
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}
