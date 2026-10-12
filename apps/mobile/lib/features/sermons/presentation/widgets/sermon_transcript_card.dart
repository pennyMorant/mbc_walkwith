import 'package:flutter/material.dart';

import '../../domain/sermon.dart';

class SermonTranscriptCard extends StatelessWidget {
  const SermonTranscriptCard({super.key, required this.sermon});

  final Sermon sermon;

  @override
  Widget build(BuildContext context) {
    final transcript = sermon.transcript;
    if (transcript == null || !transcript.isNotEmpty) {
      return const SizedBox.shrink();
    }

    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final text = transcript.text.trim();
    final transcriptMaxHeight = (MediaQuery.sizeOf(context).height * 0.48)
        .clamp(320.0, 520.0)
        .toDouble();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (transcript.source != null && transcript.source!.isNotEmpty)
                Text(
                  transcript.source!,
                  style: textTheme.labelMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              if (transcript.source != null && transcript.source!.isNotEmpty)
                const SizedBox(height: 8),
              ConstrainedBox(
                constraints: BoxConstraints(maxHeight: transcriptMaxHeight),
                child: SingleChildScrollView(
                  primary: false,
                  child: Text(
                    text,
                    style: textTheme.bodyLarge?.copyWith(height: 1.55),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
