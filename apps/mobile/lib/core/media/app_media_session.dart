import 'package:audio_service/audio_service.dart';

enum AppMediaOwner { sermon, bibleTts }

enum AppMediaControlProfile { sermon, bibleTts }

abstract interface class AppMediaSessionDelegate {
  Future<void> play();

  Future<void> pause();

  Future<void> stop();

  Future<void> seek(Duration position);

  Future<void> rewind();

  Future<void> fastForward();

  Future<void> skipToPrevious();

  Future<void> skipToNext();
}

class AppMediaSession extends BaseAudioHandler {
  AppMediaOwner? _owner;
  AppMediaSessionDelegate? _delegate;
  AppMediaControlProfile? _profile;
  int _transitionId = 0;

  AppMediaOwner? get activeOwner => _owner;

  Future<bool> activate({
    required AppMediaOwner owner,
    required AppMediaSessionDelegate delegate,
    required AppMediaControlProfile profile,
    required MediaItem item,
  }) async {
    final transitionId = ++_transitionId;
    final previousOwner = _owner;
    final previousDelegate = _delegate;

    if (previousOwner != null && previousOwner != owner) {
      _clearActiveSession();
      await previousDelegate?.stop();
      if (transitionId != _transitionId) {
        return false;
      }
    }

    _owner = owner;
    _delegate = delegate;
    _profile = profile;
    mediaItem.add(item);
    publishState(
      owner: owner,
      playing: false,
      processingState: AudioProcessingState.ready,
    );
    return true;
  }

  void publishMediaItem({
    required AppMediaOwner owner,
    required MediaItem item,
  }) {
    if (_owner == owner) {
      mediaItem.add(item);
    }
  }

  void publishState({
    required AppMediaOwner owner,
    required bool playing,
    required AudioProcessingState processingState,
    Duration position = Duration.zero,
    double speed = 1,
    String? errorMessage,
  }) {
    if (_owner != owner) {
      return;
    }
    final controls = _controlsFor(playing);
    playbackState.add(
      PlaybackState(
        controls: controls,
        androidCompactActionIndices: _compactIndices(controls),
        systemActions: _systemActions,
        processingState: processingState,
        playing: playing,
        updatePosition: position,
        speed: speed,
        errorCode: errorMessage == null ? null : 1,
        errorMessage: errorMessage,
      ),
    );
  }

  void release(AppMediaOwner owner) {
    if (_owner != owner) {
      return;
    }
    _transitionId++;
    _clearActiveSession();
  }

  @override
  Future<void> play() async => _delegate?.play();

  @override
  Future<void> pause() async => _delegate?.pause();

  @override
  Future<void> stop() async {
    final owner = _owner;
    final delegate = _delegate;
    await delegate?.stop();
    if (owner != null) {
      release(owner);
    }
  }

  @override
  Future<void> seek(Duration position) async => _delegate?.seek(position);

  @override
  Future<void> rewind() async => _delegate?.rewind();

  @override
  Future<void> fastForward() async => _delegate?.fastForward();

  @override
  Future<void> skipToPrevious() async => _delegate?.skipToPrevious();

  @override
  Future<void> skipToNext() async => _delegate?.skipToNext();

  Set<MediaAction> get _systemActions {
    return switch (_profile) {
      AppMediaControlProfile.sermon => const {
        MediaAction.seek,
        MediaAction.seekBackward,
        MediaAction.seekForward,
      },
      AppMediaControlProfile.bibleTts || null => const {},
    };
  }

  List<MediaControl> _controlsFor(bool playing) {
    final playPause = playing ? MediaControl.pause : MediaControl.play;
    return switch (_profile) {
      AppMediaControlProfile.sermon => [
        MediaControl.rewind,
        playPause,
        MediaControl.stop,
        MediaControl.fastForward,
      ],
      AppMediaControlProfile.bibleTts => [
        MediaControl.skipToPrevious,
        playPause,
        MediaControl.stop,
        MediaControl.skipToNext,
      ],
      null => const [],
    };
  }

  List<int>? _compactIndices(List<MediaControl> controls) {
    return controls.length >= 4 ? const [0, 1, 3] : null;
  }

  void _clearActiveSession() {
    _owner = null;
    _delegate = null;
    _profile = null;
    playbackState.add(
      PlaybackState(processingState: AudioProcessingState.idle),
    );
    mediaItem.add(null);
  }
}
