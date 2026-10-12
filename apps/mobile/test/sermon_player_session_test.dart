import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/sermons/data/player/sermon_audio_engine.dart';
import 'package:mbc_walkwith/features/sermons/data/player/sermon_player_session.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_progress_repository.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_progress_models.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test(
    'reports completion from native playback state and can replay',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      final repository = _RecordingSermonProgressRepository(preferences);
      final engine = _FakeSermonAudioEngine();
      final session = SermonPlayerSession(
        repository: () => repository,
        audioEngineFactory: () => engine,
      );
      addTearDown(session.dispose);

      await session.update(sermon: _sermon, speed: 1.25);

      expect(engine.lastSource?.id, _sermon.id);
      expect(engine.lastSpeed, 1.25);
      expect(session.loadedUrl, _sermon.audioUrl);

      await session.togglePlayback();
      await _flushAsync();
      expect(session.isPlaying, isTrue);

      engine.emitPosition(const Duration(minutes: 29, seconds: 58));
      engine.emitState(
        const SermonAudioEngineState(
          isPlaying: false,
          isBuffering: false,
          isCompleted: true,
        ),
      );
      await _flushAsync();

      expect(session.isCompleted, isTrue);
      expect(session.position, _sermon.duration);
      expect(repository.clearedSermonIds, contains(_sermon.id));
      expect(repository.reports.last.completed, isTrue);

      await session.togglePlayback();
      await _flushAsync();

      expect(engine.seekCalls.last, Duration.zero);
      expect(engine.playCount, 2);
    },
  );

  test('saves progress when native media controls pause playback', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = _RecordingSermonProgressRepository(preferences);
    final engine = _FakeSermonAudioEngine();
    final session = SermonPlayerSession(
      repository: () => repository,
      audioEngineFactory: () => engine,
    );
    addTearDown(session.dispose);

    await session.update(sermon: _sermon, speed: 1);
    await session.togglePlayback();
    await _flushAsync();

    const pausedPosition = Duration(minutes: 7, seconds: 12);
    engine.emitPosition(pausedPosition);
    engine.emitState(
      const SermonAudioEngineState(
        isPlaying: false,
        isBuffering: false,
        isCompleted: false,
      ),
    );
    await _flushAsync();

    expect(repository.savedPositions.last.position, pausedPosition);
    expect(repository.reports.last.position, pausedPosition);
    expect(repository.reports.last.completed, isFalse);
  });

  test('records recently played sermon when playback starts', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = _RecordingSermonProgressRepository(preferences);
    final engine = _FakeSermonAudioEngine();
    String? recentSermonId;
    final session = SermonPlayerSession(
      repository: () => repository,
      audioEngineFactory: () => engine,
      onRecentPlayedChanged: (sermonId) => recentSermonId = sermonId,
    );
    addTearDown(session.dispose);

    await session.update(sermon: _sermon, speed: 1);
    await session.togglePlayback();
    await _flushAsync();

    expect(recentSermonId, _sermon.id);
    expect(repository.recentPlayedSermonId(), _sermon.id);
  });

  test('loads the next sermon when switching during source loading', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = _RecordingSermonProgressRepository(preferences);
    final engine = _BlockingSermonAudioEngine();
    final session = SermonPlayerSession(
      repository: () => repository,
      audioEngineFactory: () => engine,
    );
    addTearDown(session.dispose);

    final firstLoad = session.update(sermon: _sermon, speed: 1);
    await _flushAsync();

    expect(session.isLoadingSource, isTrue);
    expect(engine.sourceIds, [_sermon.id]);

    final secondLoad = session.update(sermon: _secondSermon, speed: 1);
    await _flushAsync();

    expect(engine.sourceIds, [_sermon.id, _secondSermon.id]);

    engine.completeLoad(0, _sermon.duration);
    await firstLoad;
    await _flushAsync();

    expect(session.loadedUrl, isNull);
    expect(session.isLoadingSource, isTrue);

    engine.completeLoad(1, _secondSermon.duration);
    await secondLoad;
    await _flushAsync();

    expect(session.loadedUrl, _secondSermon.audioUrl);
    expect(session.duration, _secondSermon.duration);
    expect(session.isLoadingSource, isFalse);
  });

  test('keeps source-switch progress owned by the previous sermon', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = _RecordingSermonProgressRepository(preferences);
    final engine = _PausingOnSourceChangeAudioEngine();
    final session = SermonPlayerSession(
      repository: () => repository,
      audioEngineFactory: () => engine,
    );
    addTearDown(session.dispose);

    await session.update(sermon: _sermon, speed: 1);
    await session.togglePlayback();
    engine.emitPosition(const Duration(minutes: 8));
    await _flushAsync();

    await session.update(sermon: _secondSermon, speed: 1);
    await _flushAsync();

    expect(repository.savedPositions.last.sermonId, _sermon.id);
    expect(repository.savedPositions.last.position, const Duration(minutes: 8));
    expect(repository.reports.last.sermonId, _sermon.id);
    expect(
      repository.reports.where((report) => report.sermonId == _secondSermon.id),
      isEmpty,
    );
  });

  test('restores newer server progress over stale local progress', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = _RecordingSermonProgressRepository(preferences);
    await repository.savePosition(
      sermonId: _sermon.id,
      position: const Duration(minutes: 2),
    );
    repository.remoteProgress = SermonRemoteProgress(
      sermonId: _sermon.id,
      position: const Duration(minutes: 10),
      completed: false,
      updatedAt: DateTime.now().toUtc().add(const Duration(minutes: 1)),
    );
    final engine = _FakeSermonAudioEngine();
    final session = SermonPlayerSession(
      repository: () => repository,
      audioEngineFactory: () => engine,
    );
    addTearDown(session.dispose);

    await session.update(sermon: _sermon, speed: 1);

    expect(engine.seekCalls.last, const Duration(minutes: 10));
    expect(repository.savedPosition(_sermon.id), const Duration(minutes: 10));
  });
}

Future<void> _flushAsync() async {
  await Future<void>.delayed(Duration.zero);
  await Future<void>.delayed(Duration.zero);
}

class _FakeSermonAudioEngine implements SermonAudioEngine {
  final _positionController = StreamController<Duration>.broadcast();
  final _durationController = StreamController<Duration?>.broadcast();
  final _stateController = StreamController<SermonAudioEngineState>.broadcast();

  Sermon? lastSource;
  double? lastSpeed;
  int playCount = 0;
  int pauseCount = 0;
  int stopCount = 0;
  final seekCalls = <Duration>[];

  @override
  Stream<Duration> get positionStream => _positionController.stream;

  @override
  Stream<Duration?> get durationStream => _durationController.stream;

  @override
  Stream<SermonAudioEngineState> get stateStream => _stateController.stream;

  @override
  Future<Duration?> setSource(Sermon sermon, {required double speed}) async {
    lastSource = sermon;
    lastSpeed = speed;
    _durationController.add(sermon.duration);
    return sermon.duration;
  }

  @override
  Future<void> setSpeed(double speed) async {
    lastSpeed = speed;
  }

  @override
  Future<void> play() async {
    playCount += 1;
    emitState(
      const SermonAudioEngineState(
        isPlaying: true,
        isBuffering: false,
        isCompleted: false,
      ),
    );
  }

  @override
  Future<void> pause() async {
    pauseCount += 1;
    emitState(
      const SermonAudioEngineState(
        isPlaying: false,
        isBuffering: false,
        isCompleted: false,
      ),
    );
  }

  @override
  Future<void> stop() async {
    stopCount += 1;
    emitState(
      const SermonAudioEngineState(
        isPlaying: false,
        isBuffering: false,
        isCompleted: false,
      ),
    );
  }

  @override
  Future<void> seek(Duration position) async {
    seekCalls.add(position);
    emitPosition(position);
  }

  void emitPosition(Duration position) {
    _positionController.add(position);
  }

  void emitState(SermonAudioEngineState state) {
    _stateController.add(state);
  }

  @override
  Future<void> dispose() async {
    await _positionController.close();
    await _durationController.close();
    await _stateController.close();
  }
}

class _BlockingSermonAudioEngine extends _FakeSermonAudioEngine {
  final _sourceCompleters = <Completer<Duration?>>[];
  final sourceIds = <String>[];

  @override
  Future<Duration?> setSource(Sermon sermon, {required double speed}) {
    lastSource = sermon;
    lastSpeed = speed;
    sourceIds.add(sermon.id);
    final completer = Completer<Duration?>();
    _sourceCompleters.add(completer);
    return completer.future;
  }

  void completeLoad(int index, Duration? duration) {
    _durationController.add(duration);
    _sourceCompleters[index].complete(duration);
  }
}

class _PausingOnSourceChangeAudioEngine extends _FakeSermonAudioEngine {
  @override
  Future<Duration?> setSource(Sermon sermon, {required double speed}) {
    if (lastSource != null) {
      emitState(
        const SermonAudioEngineState(
          isPlaying: false,
          isBuffering: false,
          isCompleted: false,
        ),
      );
    }
    return super.setSource(sermon, speed: speed);
  }
}

class _RecordingSermonProgressRepository extends SermonProgressRepository {
  _RecordingSermonProgressRepository(SharedPreferences preferences)
    : super(
        apiClient: ApiClient(config: _testConfig),
        sharedPreferences: preferences,
        useMockRemoteData: false,
        identity: _testProgressIdentity,
      );

  final savedPositions = <_SavedPosition>[];
  final clearedSermonIds = <String>[];
  final reports = <_ProgressReport>[];
  SermonRemoteProgress? remoteProgress;

  @override
  Future<SermonRemoteProgress?> fetchRemoteProgress(String sermonId) async {
    return remoteProgress;
  }

  @override
  Future<void> savePosition({
    required String sermonId,
    required Duration position,
  }) async {
    savedPositions.add(_SavedPosition(sermonId, position));
    await super.savePosition(sermonId: sermonId, position: position);
  }

  @override
  Future<void> clearPosition(String sermonId) async {
    clearedSermonIds.add(sermonId);
    await super.clearPosition(sermonId);
  }

  @override
  Future<void> reportProgress({
    required String sermonId,
    required Duration position,
    required bool completed,
  }) async {
    reports.add(_ProgressReport(sermonId, position, completed));
  }
}

class _SavedPosition {
  const _SavedPosition(this.sermonId, this.position);

  final String sermonId;
  final Duration position;
}

class _ProgressReport {
  const _ProgressReport(this.sermonId, this.position, this.completed);

  final String sermonId;
  final Duration position;
  final bool completed;
}

const _sermon = Sermon(
  id: 'native-player-sermon',
  title: 'Native Player Sermon',
  speaker: 'Pastor',
  date: '2026-06-07',
  series: 'Sunday',
  primaryReference: 'John 15:5',
  duration: Duration(minutes: 30),
  summary: 'Sermon summary.',
  outline: [],
  references: [],
  audioUrl: 'https://example.com/native-player-sermon.mp3',
);

const _secondSermon = Sermon(
  id: 'native-player-sermon-2',
  title: 'Second Native Player Sermon',
  speaker: 'Pastor',
  date: '2026-06-14',
  series: 'Sunday',
  primaryReference: 'John 15:6',
  duration: Duration(minutes: 28),
  summary: 'Second sermon summary.',
  outline: [],
  references: [],
  audioUrl: 'https://example.com/native-player-sermon-2.mp3',
);

const _testConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);

Future<SermonProgressIdentity> _testProgressIdentity() async {
  return const SermonProgressIdentity(
    externalUserId: 'ext_player_session_test',
  );
}
