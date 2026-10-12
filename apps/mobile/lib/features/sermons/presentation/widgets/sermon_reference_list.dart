import 'package:flutter/material.dart';

import '../../domain/sermon.dart';

class SermonReferenceList extends StatelessWidget {
  const SermonReferenceList({
    super.key,
    required this.sermon,
    required this.onReferenceSelected,
  });

  final Sermon sermon;
  final ValueChanged<SermonReference> onReferenceSelected;

  @override
  Widget build(BuildContext context) {
    if (sermon.references.isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          for (final reference in sermon.references)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => onReferenceSelected(reference),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                reference.reference,
                                style: Theme.of(context).textTheme.titleSmall
                                    ?.copyWith(fontWeight: FontWeight.w800),
                              ),
                              if (reference.note.trim().isNotEmpty) ...[
                                const SizedBox(height: 5),
                                Text(
                                  reference.note,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: Theme.of(
                                          context,
                                        ).colorScheme.onSurfaceVariant,
                                        height: 1.35,
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Icon(Icons.chevron_right),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
