import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../theme/app_theme.dart';
import '../../data/bible_tts_controller.dart';

const bibleTtsDefaultRate = 0.48;
const bibleTtsMinRate = 0.32;
const bibleTtsMaxRate = 0.72;

class BibleTtsBar extends StatelessWidget {
  const BibleTtsBar({
    super.key,
    required this.status,
    required this.errorCode,
    required this.rate,
    required this.currentVerseNumber,
    required this.onPlay,
    required this.onPause,
    required this.onStop,
    required this.onPrevious,
    required this.onNext,
    required this.onRateChanged,
  });

  final BibleTtsStatus status;
  final String? errorCode;
  final double rate;
  final int? currentVerseNumber;
  final VoidCallback onPlay;
  final VoidCallback onPause;
  final VoidCallback onStop;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final ValueChanged<double> onRateChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final isLoading = status == BibleTtsStatus.loading;
    final isSpeaking = status == BibleTtsStatus.speaking;
    final isActive =
        status == BibleTtsStatus.loading ||
        status == BibleTtsStatus.speaking ||
        status == BibleTtsStatus.paused;
    final canMove = isSpeaking || status == BibleTtsStatus.paused;
    final errorMessage = _errorMessage(l10n);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.secondaryContainer.withValues(alpha: 0.56),
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.record_voice_over, color: colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _ttsTitle(l10n),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    l10n.bibleTtsRateLabel(_rateDisplayValue(rate)),
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  IconButton.filledTonal(
                    tooltip: l10n.bibleTtsPreviousVerseTooltip,
                    onPressed: canMove ? onPrevious : null,
                    icon: const Icon(Icons.skip_previous),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: isSpeaking
                        ? l10n.bibleTtsPauseTooltip
                        : l10n.bibleTtsPlayTooltip,
                    onPressed: isLoading
                        ? null
                        : isSpeaking
                        ? onPause
                        : onPlay,
                    icon: Icon(isSpeaking ? Icons.pause : Icons.play_arrow),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    tooltip: l10n.bibleTtsNextVerseTooltip,
                    onPressed: canMove ? onNext : null,
                    icon: const Icon(Icons.skip_next),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: l10n.bibleTtsStopTooltip,
                    onPressed: isActive ? onStop : null,
                    icon: const Icon(Icons.stop),
                  ),
                  Expanded(
                    child: Slider(
                      value: rate,
                      min: bibleTtsMinRate,
                      max: bibleTtsMaxRate,
                      divisions: 8,
                      label: l10n.bibleTtsRateLabel(_rateDisplayValue(rate)),
                      onChanged: isLoading ? null : onRateChanged,
                    ),
                  ),
                ],
              ),
              if (errorMessage != null) ...[
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 18,
                      color: colorScheme.error,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        errorMessage,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _ttsTitle(AppLocalizations l10n) {
    final verseNumber = currentVerseNumber;
    if (status == BibleTtsStatus.paused && verseNumber != null) {
      return l10n.bibleTtsPausedVerse(verseNumber);
    }
    if (verseNumber != null) {
      return l10n.bibleTtsCurrentVerse(verseNumber);
    }
    return l10n.bibleTtsReadyTitle;
  }

  String? _errorMessage(AppLocalizations l10n) {
    return switch (errorCode) {
      BibleTtsErrorCode.bibleTextMissing => l10n.bibleTtsErrorTextMissing,
      BibleTtsErrorCode.ttsLanguageUnavailable =>
        l10n.bibleTtsErrorLanguageUnavailable,
      BibleTtsErrorCode.ttsInterrupted => l10n.bibleTtsErrorInterrupted,
      BibleTtsErrorCode.ttsStartFailed => l10n.bibleTtsErrorStartFailed,
      BibleTtsErrorCode.ttsEngineUnavailable ||
      BibleTtsErrorCode.ttsDisposed => l10n.bibleTtsErrorEngineUnavailable,
      _ => null,
    };
  }
}

double _rateDisplayValue(double rate) {
  return rate / bibleTtsDefaultRate;
}
