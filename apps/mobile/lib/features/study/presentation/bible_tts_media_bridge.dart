import 'dart:io';

import 'package:audio_service/audio_service.dart';

import '../../../core/media/app_media_session.dart';
import '../data/bible_tts_state.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';

class BibleTtsMediaBridge {
  BibleTtsMediaBridge({
    required AppMediaSession? mediaSession,
    required Future<void> Function() onPlay,
    required Future<void> Function() onPause,
    required Future<void> Function() onStop,
    required Future<void> Function(int delta) onMove,
  }) : _mediaSession = mediaSession,
       _delegate = _BibleTtsMediaDelegate(
         onPlay: onPlay,
         onPause: onPause,
         onStop: onStop,
         onMove: onMove,
       );

  final AppMediaSession? _mediaSession;
  final AppMediaSessionDelegate _delegate;
  BibleTranslation? _translation;
  String? _bookId;
  String? _bookName;
  int? _chapter;
  List<BibleVerse> _verses = const [];

  Future<bool> activate({
    required BibleTranslation translation,
    required String bookId,
    required String bookName,
    required int chapter,
    required List<BibleVerse> verses,
    required int verseIndex,
  }) async {
    _translation = translation;
    _bookId = bookId;
    _bookName = bookName;
    _chapter = chapter;
    _verses = verses;
    final mediaSession = _mediaSession;
    if (mediaSession == null) {
      return true;
    }
    final activated = await mediaSession.activate(
      owner: AppMediaOwner.bibleTts,
      delegate: _delegate,
      profile: AppMediaControlProfile.bibleTts,
      item: _mediaItemFor(verseIndex),
    );
    if (!activated) {
      return false;
    }
    if (Platform.isAndroid) {
      try {
        await AudioService.androidForceEnableMediaButtons();
      } catch (_) {
        // Media-button routing is supplementary; speech can still start while
        // Android recreates the stopped media service from playback state.
      }
    }
    return true;
  }

  void sync(BibleTtsState state) {
    final mediaSession = _mediaSession;
    if (mediaSession == null ||
        mediaSession.activeOwner != AppMediaOwner.bibleTts) {
      return;
    }
    final index = state.currentVerseIndex;
    if (index != null && index >= 0 && index < _verses.length) {
      mediaSession.publishMediaItem(
        owner: AppMediaOwner.bibleTts,
        item: _mediaItemFor(index),
      );
    }
    switch (state.status) {
      case BibleTtsStatus.loading:
        _publish(state, AudioProcessingState.loading, playing: false);
      case BibleTtsStatus.speaking:
        _publish(state, AudioProcessingState.ready, playing: true);
      case BibleTtsStatus.paused || BibleTtsStatus.interrupted:
        _publish(state, AudioProcessingState.ready, playing: false);
      case BibleTtsStatus.idle ||
          BibleTtsStatus.stopped ||
          BibleTtsStatus.error:
        release();
    }
  }

  void release() {
    _mediaSession?.release(AppMediaOwner.bibleTts);
  }

  MediaItem _mediaItemFor(int index) {
    final verse = _verses[index];
    final translation = _translation!;
    return MediaItem(
      id: 'bible:${translation.id}:$_bookId:$_chapter',
      title: '$_bookName $_chapter:${verse.number}',
      artist: translation.name,
      album: 'MBCG',
      extras: {
        'bookId': _bookId,
        'chapter': _chapter,
        'verseId': verse.id,
        'verse': verse.number,
        'translationId': translation.id,
      },
    );
  }

  void _publish(
    BibleTtsState state,
    AudioProcessingState processingState, {
    required bool playing,
  }) {
    _mediaSession?.publishState(
      owner: AppMediaOwner.bibleTts,
      playing: playing,
      processingState: processingState,
      speed: state.rate,
    );
  }
}

class _BibleTtsMediaDelegate implements AppMediaSessionDelegate {
  const _BibleTtsMediaDelegate({
    required Future<void> Function() onPlay,
    required Future<void> Function() onPause,
    required Future<void> Function() onStop,
    required Future<void> Function(int delta) onMove,
  }) : _onPlay = onPlay,
       _onPause = onPause,
       _onStop = onStop,
       _onMove = onMove;

  final Future<void> Function() _onPlay;
  final Future<void> Function() _onPause;
  final Future<void> Function() _onStop;
  final Future<void> Function(int delta) _onMove;

  @override
  Future<void> play() => _onPlay();

  @override
  Future<void> pause() => _onPause();

  @override
  Future<void> stop() => _onStop();

  @override
  Future<void> skipToPrevious() => _onMove(-1);

  @override
  Future<void> skipToNext() => _onMove(1);

  @override
  Future<void> rewind() => skipToPrevious();

  @override
  Future<void> fastForward() => skipToNext();

  @override
  Future<void> seek(Duration position) async {}
}
