import 'dart:async';

import 'sermon_audio_engine.dart';

class SermonPlaybackSubscriptions {
  StreamSubscription<Duration>? _position;
  StreamSubscription<Duration?>? _duration;
  StreamSubscription<SermonAudioEngineState>? _state;

  void bind({
    required SermonAudioEngine engine,
    required void Function(Duration) onPosition,
    required void Function(Duration?) onDuration,
    required void Function(SermonAudioEngineState) onState,
  }) {
    cancel();
    _position = engine.positionStream.listen(onPosition);
    _duration = engine.durationStream.listen(onDuration);
    _state = engine.stateStream.listen(onState);
  }

  void cancel() {
    unawaited(_position?.cancel());
    unawaited(_duration?.cancel());
    unawaited(_state?.cancel());
    _position = null;
    _duration = null;
    _state = null;
  }
}

class SermonPlaybackScheduler {
  Timer? _progressReportTimer;
  Timer? _positionSaveDebounce;

  void startProgressReporting(Future<void> Function() report) {
    _progressReportTimer ??= Timer.periodic(const Duration(seconds: 15), (_) {
      unawaited(report());
    });
  }

  void stopProgressReporting() {
    _progressReportTimer?.cancel();
    _progressReportTimer = null;
  }

  void schedulePositionSave(Future<void> Function() save) {
    _positionSaveDebounce?.cancel();
    _positionSaveDebounce = Timer(const Duration(seconds: 1), () {
      unawaited(save());
    });
  }

  void cancelPositionSave() {
    _positionSaveDebounce?.cancel();
    _positionSaveDebounce = null;
  }

  void cancelAll() {
    stopProgressReporting();
    cancelPositionSave();
  }
}
