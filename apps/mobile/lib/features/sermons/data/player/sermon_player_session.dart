import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../domain/sermon.dart';
import '../sermon_progress_repository.dart';
import 'sermon_audio_engine.dart';
import 'sermon_playback_progress_coordinator.dart';

class SermonPlayerSession extends ChangeNotifier {
  SermonPlayerSession({
    required SermonProgressRepository Function() repository,
    SermonAudioEngine Function()? audioEngineFactory,
    ValueChanged<String>? onRecentPlayedChanged,
  }) : _progress = SermonPlaybackProgressCoordinator(repository: repository),
       _audioEngineFactory =
           audioEngineFactory ?? JustAudioSermonAudioEngine.new,
       _onRecentPlayedChanged = onRecentPlayedChanged;
  final SermonPlaybackProgressCoordinator _progress;
  final SermonAudioEngine Function() _audioEngineFactory;
  final ValueChanged<String>? _onRecentPlayedChanged;
  SermonAudioEngine? _engine;
  StreamSubscription<Duration>? _positionSubscription;
  StreamSubscription<Duration?>? _durationSubscription;
  StreamSubscription<SermonAudioEngineState>? _engineStateSubscription;
  Timer? _progressReportTimer;
  Timer? _positionSaveDebounce;
  Sermon? _sermon;
  double _speed = 1;
  int _loadVersion = 0;
  bool _disposed = false;
  String? _loadingUrl;
  Duration position = Duration.zero;
  Duration duration = Duration.zero;
  String? loadedUrl;
  String? loadError;
  bool isPlaying = false;
  bool isBuffering = false;
  bool isLoadingSource = false;
  bool isCompleted = false;
  String? get currentSermonId => _sermon?.id;
  Duration effectiveDuration(Sermon sermon) =>
      duration > Duration.zero ? duration : sermon.duration;
  Future<void> update({
    required Sermon sermon,
    required double speed,
    bool reloadSource = false,
  }) async {
    final previous = _sermon;
    final sourceChanged =
        previous?.id != sermon.id || previous?.audioUrl != sermon.audioUrl;
    if (sourceChanged || reloadSource) {
      final switchVersion = ++_loadVersion;
      await _prepareForSourceSwitch(previous);
      if (_disposed || switchVersion != _loadVersion) {
        return;
      }
      _sermon = sermon;
      _speed = speed;
      duration = sermon.duration;
      await _syncAudioSource(sermon, reloadSource: reloadSource);
      return;
    }
    _sermon = sermon;
    _speed = speed;
    duration = duration > Duration.zero ? duration : sermon.duration;
    await _engine?.setSpeed(speed);
  }

  Future<void> togglePlayback() async {
    final sermon = _sermon;
    if (sermon == null) {
      return;
    }
    if (isPlaying) {
      await _engine?.pause();
      await _saveAndReportProgress();
      return;
    }
    if (loadedUrl != sermon.audioUrl) {
      await _syncAudioSource(sermon);
    }
    if (loadError == null) {
      if (isCompleted) {
        await seekToProgress(0);
      }
      await _progress.saveRecentPlayedSermonId(sermon.id);
      _onRecentPlayedChanged?.call(sermon.id);
      _startProgressReporting();
      await _engine?.play();
    }
  }

  Future<void> seekToProgress(double value) async {
    final sermon = _sermon;
    if (sermon == null) {
      return;
    }
    final currentDuration = effectiveDuration(sermon);
    if (currentDuration.inMilliseconds <= 0) {
      return;
    }
    final nextPosition = Duration(
      milliseconds: (currentDuration.inMilliseconds * value.clamp(0, 1))
          .round(),
    );
    isCompleted = false;
    await _engine?.seek(nextPosition);
    await _saveAndReportProgress(positionOverride: nextPosition);
    _notify();
  }

  Future<void> seekRelative(Duration offset) async {
    final sermon = _sermon;
    if (sermon == null) {
      return;
    }
    final currentDuration = effectiveDuration(sermon);
    final next = position + offset;
    final clamped = next < Duration.zero
        ? Duration.zero
        : next > currentDuration
        ? currentDuration
        : next;
    isCompleted = false;
    await _engine?.seek(clamped);
    await _saveAndReportProgress(positionOverride: clamped);
    _notify();
  }

  Future<void> _saveAndReportProgress({Duration? positionOverride}) async {
    final sermon = _sermon;
    if (sermon == null || !sermon.hasAudio) {
      return;
    }
    await _progress.saveAndReport(
      sermon: sermon,
      position: positionOverride ?? position,
      duration: effectiveDuration(sermon),
    );
  }

  Future<void> _prepareForSourceSwitch(Sermon? previous) async {
    _progressReportTimer?.cancel();
    _progressReportTimer = null;
    _positionSaveDebounce?.cancel();
    _positionSaveDebounce = null;

    final previousPosition = position;
    final previousDuration = previous == null
        ? Duration.zero
        : effectiveDuration(previous);
    final shouldSave =
        previous != null &&
        previous.hasAudio &&
        (loadedUrl == previous.audioUrl || previousPosition > Duration.zero);

    isPlaying = false;
    isBuffering = false;
    if (!shouldSave) {
      return;
    }
    await _progress.saveForSourceSwitch(
      sermon: previous,
      position: previousPosition,
      duration: previousDuration,
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _progressReportTimer?.cancel();
    _positionSaveDebounce?.cancel();
    unawaited(_saveAndReportProgress());
    _positionSubscription?.cancel();
    _durationSubscription?.cancel();
    _engineStateSubscription?.cancel();
    final engine = _engine;
    if (engine != null) unawaited(engine.dispose());
    super.dispose();
  }

  SermonAudioEngine _ensureEngine() {
    final existing = _engine;
    if (existing != null) {
      return existing;
    }

    final engine = _audioEngineFactory();
    _engine = engine;
    _positionSubscription = engine.positionStream.listen((nextPosition) {
      position = nextPosition;
      _notify();
      _schedulePositionSave(nextPosition);
    });
    _durationSubscription = engine.durationStream.listen((nextDuration) {
      if (nextDuration == null) {
        return;
      }
      duration = nextDuration;
      _notify();
    });
    _engineStateSubscription = engine.stateStream.listen(_handleEngineState);
    return engine;
  }

  Future<void> _syncAudioSource(
    Sermon sermon, {
    bool reloadSource = false,
  }) async {
    final audioUrl = sermon.audioUrl;
    if (audioUrl == null || audioUrl.isEmpty) {
      _loadVersion++;
      _loadingUrl = null;
      loadedUrl = null;
      loadError = null;
      position = Duration.zero;
      duration = sermon.duration;
      isCompleted = false;
      await _engine?.stop();
      _notify();
      return;
    }
    if (!reloadSource) {
      if (loadedUrl == audioUrl) {
        return;
      }
      if (isLoadingSource && _loadingUrl == audioUrl) {
        return;
      }
    }

    final engine = _ensureEngine();
    final loadVersion = ++_loadVersion;
    _loadingUrl = audioUrl;
    isLoadingSource = true;
    loadError = null;
    position = Duration.zero;
    duration = sermon.duration;
    isCompleted = false;
    _notify();

    try {
      final loadedDuration = await engine.setSource(sermon, speed: _speed);
      if (!_isCurrentLoad(loadVersion, sermon.id, audioUrl)) {
        return;
      }
      final restoredPosition = await _progress.restoreSavedPosition(
        sermon: sermon,
        loadedDuration: loadedDuration,
        seek: engine.seek,
      );
      if (!_isCurrentLoad(loadVersion, sermon.id, audioUrl)) {
        return;
      }
      loadedUrl = audioUrl;
      _loadingUrl = null;
      position = restoredPosition ?? position;
      duration = loadedDuration ?? sermon.duration;
      isLoadingSource = false;
      _notify();
    } catch (_) {
      if (!_isCurrentLoad(loadVersion, sermon.id, audioUrl)) {
        return;
      }
      loadedUrl = null;
      _loadingUrl = null;
      loadError = 'unavailable';
      isLoadingSource = false;
      isCompleted = false;
      _notify();
    }
  }

  void _schedulePositionSave(Duration nextPosition) {
    final sermon = _sermon;
    if (sermon == null || !sermon.hasAudio || isCompleted) {
      return;
    }
    _positionSaveDebounce?.cancel();
    _positionSaveDebounce = Timer(const Duration(seconds: 1), () {
      unawaited(
        _progress.saveLocalPosition(
          sermonId: sermon.id,
          position: nextPosition,
        ),
      );
    });
  }

  void _handleEngineState(SermonAudioEngineState nextState) {
    final wasPlaying = isPlaying;
    final becameCompleted = nextState.isCompleted && !isCompleted;
    isPlaying = nextState.isPlaying;
    isBuffering = nextState.isBuffering;
    isCompleted = nextState.isCompleted;

    if (isPlaying) {
      _startProgressReporting();
    } else {
      _stopProgressReporting();
    }

    if (becameCompleted) {
      _positionSaveDebounce?.cancel();
      final sermon = _sermon;
      if (sermon != null) {
        final completedPosition = effectiveDuration(sermon);
        if (completedPosition > Duration.zero) {
          position = completedPosition;
        }
        unawaited(_saveAndReportProgress(positionOverride: position));
      }
    } else if (wasPlaying && !isPlaying) {
      unawaited(_saveAndReportProgress());
    }

    _notify();
  }

  void _startProgressReporting() {
    _progressReportTimer ??= Timer.periodic(const Duration(seconds: 15), (_) {
      unawaited(_saveAndReportProgress());
    });
  }

  void _stopProgressReporting() {
    _progressReportTimer?.cancel();
    _progressReportTimer = null;
  }

  bool _isCurrentLoad(int version, String sermonId, String audioUrl) =>
      !_disposed &&
      version == _loadVersion &&
      _sermon?.id == sermonId &&
      _sermon?.audioUrl == audioUrl;

  void _notify() {
    if (!_disposed) {
      notifyListeners();
    }
  }
}
