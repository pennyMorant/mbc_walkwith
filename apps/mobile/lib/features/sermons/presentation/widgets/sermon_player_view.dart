import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../domain/sermon.dart';
import 'sermon_audio_status_pill.dart';

class SermonPlayerView extends StatelessWidget {
  const SermonPlayerView({
    super.key,
    required this.sermon,
    required this.progress,
    required this.speed,
    required this.position,
    required this.duration,
    required this.loadedUrl,
    required this.loadError,
    required this.isPlaying,
    required this.isBuffering,
    required this.isLoadingSource,
    required this.onProgressChanged,
    required this.onSeekToProgress,
    required this.onRetryLoad,
    required this.onRewind,
    required this.onForward,
    required this.onTogglePlayback,
    required this.onSpeedPressed,
  });

  final Sermon sermon;
  final double progress;
  final double speed;
  final Duration position;
  final Duration duration;
  final String? loadedUrl;
  final String? loadError;
  final bool isPlaying;
  final bool isBuffering;
  final bool isLoadingSource;
  final ValueChanged<double> onProgressChanged;
  final ValueChanged<double> onSeekToProgress;
  final VoidCallback onRetryLoad;
  final VoidCallback onRewind;
  final VoidCallback onForward;
  final VoidCallback onTogglePlayback;
  final VoidCallback onSpeedPressed;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final hasAudio = sermon.hasAudio;
    final canSeek = hasAudio && loadedUrl != null && loadError == null;
    final progressValue = _progressValue(hasAudio: hasAudio);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SermonAudioStatusPill(
              label: _audioStatusLabel(l10n, hasAudio: hasAudio),
              icon: _audioStatusIcon(hasAudio: hasAudio),
              color: _audioStatusColor(colorScheme, hasAudio: hasAudio),
            ),
            const SizedBox(height: 14),
            Slider(
              value: progressValue,
              onChanged: canSeek ? onSeekToProgress : null,
            ),
            Row(
              children: [
                Text(
                  formatDurationClock(
                    hasAudio ? position : _positionForProgress(sermon),
                  ),
                ),
                const Spacer(),
                Text(formatDurationClock(duration)),
              ],
            ),
            if (loadError != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.sermonAudioUnavailable,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.error,
                      ),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: onRetryLoad,
                    icon: const Icon(Icons.refresh),
                    label: Text(l10n.retryAction),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                IconButton.filledTonal(
                  tooltip: l10n.rewindTooltip,
                  onPressed: canSeek ? onRewind : null,
                  icon: const Icon(Icons.replay_rounded),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: l10n.playTooltip,
                  iconSize: 32,
                  onPressed: hasAudio && !isLoadingSource && loadError == null
                      ? onTogglePlayback
                      : null,
                  icon: Icon(
                    isBuffering
                        ? Icons.hourglass_top
                        : isPlaying
                        ? Icons.pause
                        : Icons.play_arrow,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: l10n.forwardTooltip,
                  onPressed: canSeek ? onForward : null,
                  icon: const Icon(Icons.forward_30),
                ),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: hasAudio ? onSpeedPressed : null,
                  icon: const Icon(Icons.speed),
                  label: Text('${speed.toStringAsFixed(speed == 1 ? 0 : 2)}x'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  double _progressValue({required bool hasAudio}) {
    if (!hasAudio) {
      return progress.clamp(0, 1).toDouble();
    }
    if (duration.inMilliseconds <= 0) {
      return 0;
    }
    return (position.inMilliseconds / duration.inMilliseconds)
        .clamp(0, 1)
        .toDouble();
  }

  String _audioStatusLabel(AppLocalizations l10n, {required bool hasAudio}) {
    if (!hasAudio) {
      return l10n.sermonAudioMissing;
    }
    if (loadError != null) {
      return l10n.sermonAudioUnavailable;
    }
    if (isLoadingSource) {
      return l10n.sermonAudioLoading;
    }
    if (loadedUrl != null) {
      return l10n.sermonAudioReady;
    }
    return l10n.sermonAudioPreparing;
  }

  IconData _audioStatusIcon({required bool hasAudio}) {
    if (!hasAudio) {
      return Icons.volume_off_outlined;
    }
    if (loadError != null) {
      return Icons.error_outline;
    }
    if (isLoadingSource) {
      return Icons.downloading_outlined;
    }
    if (loadedUrl != null) {
      return Icons.check_circle_outline;
    }
    return Icons.schedule_outlined;
  }

  Color _audioStatusColor(ColorScheme colorScheme, {required bool hasAudio}) {
    if (!hasAudio) {
      return colorScheme.onSurfaceVariant;
    }
    if (loadError != null) {
      return colorScheme.error;
    }
    if (loadedUrl != null) {
      return colorScheme.primary;
    }
    return colorScheme.tertiary;
  }

  Duration _positionForProgress(Sermon sermon) {
    return Duration(
      seconds: (sermon.duration.inSeconds * progress.clamp(0, 1)).round(),
    );
  }
}
