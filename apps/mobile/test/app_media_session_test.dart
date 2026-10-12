import 'package:audio_service/audio_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/media/app_media_session.dart';

void main() {
  test('activating a new owner stops the previous media delegate', () async {
    final session = AppMediaSession();
    final sermon = _RecordingMediaDelegate();
    final tts = _RecordingMediaDelegate();

    await session.activate(
      owner: AppMediaOwner.sermon,
      delegate: sermon,
      profile: AppMediaControlProfile.sermon,
      item: const MediaItem(id: 'sermon:1', title: 'Sermon'),
    );
    final activated = await session.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: tts,
      profile: AppMediaControlProfile.bibleTts,
      item: const MediaItem(id: 'bible:john:1', title: 'John 1'),
    );

    expect(activated, isTrue);
    expect(sermon.stopCount, 1);
    expect(session.activeOwner, AppMediaOwner.bibleTts);
    expect(session.mediaItem.value?.id, 'bible:john:1');
  });

  test('native media controls route only to the active delegate', () async {
    final session = AppMediaSession();
    final tts = _RecordingMediaDelegate();
    await session.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: tts,
      profile: AppMediaControlProfile.bibleTts,
      item: const MediaItem(id: 'bible:john:1', title: 'John 1'),
    );

    await session.play();
    await session.pause();
    await session.skipToPrevious();
    await session.skipToNext();

    expect(tts.playCount, 1);
    expect(tts.pauseCount, 1);
    expect(tts.previousCount, 1);
    expect(tts.nextCount, 1);
  });

  test('playback state exposes controls for the active profile', () async {
    final session = AppMediaSession();
    final tts = _RecordingMediaDelegate();
    await session.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: tts,
      profile: AppMediaControlProfile.bibleTts,
      item: const MediaItem(id: 'bible:john:1', title: 'John 1'),
    );

    session.publishState(
      owner: AppMediaOwner.bibleTts,
      playing: true,
      processingState: AudioProcessingState.ready,
    );

    final state = session.playbackState.value;
    expect(state.playing, isTrue);
    expect(state.controls.map((control) => control.action), [
      MediaAction.skipToPrevious,
      MediaAction.pause,
      MediaAction.stop,
      MediaAction.skipToNext,
    ]);
  });

  test('a stopped media session can activate TTS again', () async {
    final session = AppMediaSession();
    final firstDelegate = _RecordingMediaDelegate();
    final secondDelegate = _RecordingMediaDelegate();
    const item = MediaItem(id: 'bible:john:1', title: 'John 1');

    await session.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: firstDelegate,
      profile: AppMediaControlProfile.bibleTts,
      item: item,
    );
    session.publishState(
      owner: AppMediaOwner.bibleTts,
      playing: true,
      processingState: AudioProcessingState.ready,
    );
    await session.stop();

    expect(firstDelegate.stopCount, 1);
    expect(session.activeOwner, isNull);
    expect(
      session.playbackState.value.processingState,
      AudioProcessingState.idle,
    );

    final activated = await session.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: secondDelegate,
      profile: AppMediaControlProfile.bibleTts,
      item: item,
    );
    session.publishState(
      owner: AppMediaOwner.bibleTts,
      playing: true,
      processingState: AudioProcessingState.ready,
    );

    expect(activated, isTrue);
    expect(session.activeOwner, AppMediaOwner.bibleTts);
    expect(session.playbackState.value.playing, isTrue);
  });
}

class _RecordingMediaDelegate implements AppMediaSessionDelegate {
  int playCount = 0;
  int pauseCount = 0;
  int stopCount = 0;
  int previousCount = 0;
  int nextCount = 0;

  @override
  Future<void> play() async => playCount++;

  @override
  Future<void> pause() async => pauseCount++;

  @override
  Future<void> stop() async => stopCount++;

  @override
  Future<void> seek(Duration position) async {}

  @override
  Future<void> rewind() async {}

  @override
  Future<void> fastForward() async {}

  @override
  Future<void> skipToPrevious() async => previousCount++;

  @override
  Future<void> skipToNext() async => nextCount++;
}
