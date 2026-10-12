import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:just_audio/just_audio.dart';

import '../../../../core/media/app_media_session.dart';
import '../../domain/sermon.dart';

const _defaultSermonArtworkAssetUri =
    'asset:///assets/sermons/default_sermon_artwork.png';

class SermonAudioEngineState {
  const SermonAudioEngineState({
    required this.isPlaying,
    required this.isBuffering,
    required this.isCompleted,
  });

  final bool isPlaying;
  final bool isBuffering;
  final bool isCompleted;
}

abstract class SermonAudioEngine {
  Stream<Duration> get positionStream;

  Stream<Duration?> get durationStream;

  Stream<SermonAudioEngineState> get stateStream;

  Future<Duration?> setSource(Sermon sermon, {required double speed});

  Future<void> setSpeed(double speed);

  Future<void> play();

  Future<void> pause();

  Future<void> stop();

  Future<void> seek(Duration position);

  Future<void> dispose();
}

class JustAudioSermonAudioEngine
    implements SermonAudioEngine, AppMediaSessionDelegate {
  JustAudioSermonAudioEngine({
    AudioPlayer? player,
    AppMediaSession? mediaSession,
  }) : _mediaSession = mediaSession,
       _player =
           player ??
           AudioPlayer(
             userAgent: 'MBCWalkWith/1.0 sermon-audio',
             handleInterruptions: true,
             handleAudioSessionActivation: true,
           );

  final AudioPlayer _player;
  final AppMediaSession? _mediaSession;
  Sermon? _sermon;
  double _speed = 1;

  @override
  Stream<Duration> get positionStream => _player.positionStream;

  @override
  Stream<Duration?> get durationStream => _player.durationStream;

  @override
  Stream<SermonAudioEngineState> get stateStream =>
      _player.playerStateStream.map((state) {
        _publishCurrentState();
        return _mapPlayerState(state);
      });

  @override
  Future<Duration?> setSource(Sermon sermon, {required double speed}) async {
    _sermon = sermon;
    _speed = speed;
    final audioUrl = sermon.audioUrl;
    if (audioUrl == null || audioUrl.isEmpty) {
      await stop();
      return null;
    }

    await _configureAudioSession();
    await setSpeed(speed);
    return _player.setAudioSource(AudioSource.uri(Uri.parse(audioUrl)));
  }

  @override
  Future<void> setSpeed(double speed) {
    _speed = speed;
    return _player.setSpeed(speed);
  }

  @override
  Future<void> play() async {
    final sermon = _sermon;
    final mediaSession = _mediaSession;
    if (sermon != null && mediaSession != null) {
      final activated = await mediaSession.activate(
        owner: AppMediaOwner.sermon,
        delegate: this,
        profile: AppMediaControlProfile.sermon,
        item: _mediaItemFor(sermon),
      );
      if (!activated) {
        return;
      }
    }
    await _player.play();
  }

  @override
  Future<void> pause() {
    return _player.pause();
  }

  @override
  Future<void> stop() {
    _mediaSession?.release(AppMediaOwner.sermon);
    return _player.stop();
  }

  @override
  Future<void> seek(Duration position) {
    _publishCurrentState(position: position);
    return _player.seek(position);
  }

  @override
  Future<void> rewind() => seek(_clampedPosition(const Duration(seconds: -15)));

  @override
  Future<void> fastForward() =>
      seek(_clampedPosition(const Duration(seconds: 15)));

  @override
  Future<void> skipToPrevious() => rewind();

  @override
  Future<void> skipToNext() => fastForward();

  @override
  Future<void> dispose() {
    _mediaSession?.release(AppMediaOwner.sermon);
    return _player.dispose();
  }

  MediaItem _mediaItemFor(Sermon sermon) {
    return MediaItem(
      id: 'sermon:${sermon.id}',
      title: sermon.title,
      artist: sermon.speaker,
      album: sermon.series,
      duration: sermon.duration,
      artUri: _sermonArtworkUri(sermon),
    );
  }

  Duration _clampedPosition(Duration offset) {
    final next = _player.position + offset;
    if (next < Duration.zero) {
      return Duration.zero;
    }
    final duration = _player.duration;
    if (duration != null && next > duration) {
      return duration;
    }
    return next;
  }

  void _publishCurrentState({Duration? position}) {
    final state = _player.playerState;
    _mediaSession?.publishState(
      owner: AppMediaOwner.sermon,
      playing: state.playing,
      processingState: _audioProcessingState(state.processingState),
      position: position ?? _player.position,
      speed: _speed,
    );
  }
}

Uri _sermonArtworkUri(Sermon sermon) {
  final thumbnailUrl = sermon.thumbnailUrl?.trim();
  if (thumbnailUrl != null && thumbnailUrl.isNotEmpty) {
    final uri = Uri.tryParse(thumbnailUrl);
    if (uri != null) {
      return uri;
    }
  }
  return Uri.parse(_defaultSermonArtworkAssetUri);
}

Future<void> _configureAudioSession() async {
  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration.speech());
}

SermonAudioEngineState _mapPlayerState(PlayerState state) {
  final processingState = state.processingState;
  return SermonAudioEngineState(
    isPlaying: state.playing,
    isBuffering:
        processingState == ProcessingState.loading ||
        processingState == ProcessingState.buffering,
    isCompleted: processingState == ProcessingState.completed,
  );
}

AudioProcessingState _audioProcessingState(ProcessingState state) {
  return switch (state) {
    ProcessingState.idle => AudioProcessingState.idle,
    ProcessingState.loading => AudioProcessingState.loading,
    ProcessingState.buffering => AudioProcessingState.buffering,
    ProcessingState.ready => AudioProcessingState.ready,
    ProcessingState.completed => AudioProcessingState.completed,
  };
}
