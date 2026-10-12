import 'dart:io';

import 'package:audio_session/audio_session.dart';
import 'package:flutter_tts/flutter_tts.dart';

abstract class TtsPlaybackEngine {
  Future<void> prepareForBackgroundPlayback();

  Future<void> awaitSpeakCompletion(bool enabled);

  Future<Object?> setLanguage(String languageCode);

  Future<void> setSpeechRate(double rate);

  Future<void> setVolume(double volume);

  Future<void> setPitch(double pitch);

  Future<Object?> speak(String text);

  Future<void> pause();

  Future<void> stop();
}

class FlutterTtsPlaybackEngine implements TtsPlaybackEngine {
  FlutterTtsPlaybackEngine([FlutterTts? tts]) : _tts = tts ?? FlutterTts();

  final FlutterTts _tts;

  @override
  Future<void> prepareForBackgroundPlayback() async {
    final audioSession = await AudioSession.instance;
    await audioSession.configure(const AudioSessionConfiguration.speech());

    if (!Platform.isIOS) {
      return;
    }
    await _tts.setIosAudioCategory(
      IosTextToSpeechAudioCategory.playback,
      const [
        IosTextToSpeechAudioCategoryOptions.allowBluetooth,
        IosTextToSpeechAudioCategoryOptions.allowBluetoothA2DP,
        IosTextToSpeechAudioCategoryOptions.allowAirPlay,
      ],
      IosTextToSpeechAudioMode.spokenAudio,
    );
  }

  @override
  Future<void> awaitSpeakCompletion(bool enabled) {
    return _tts.awaitSpeakCompletion(enabled);
  }

  @override
  Future<Object?> setLanguage(String languageCode) {
    return _tts.setLanguage(languageCode);
  }

  @override
  Future<void> setSpeechRate(double rate) {
    return _tts.setSpeechRate(rate);
  }

  @override
  Future<void> setVolume(double volume) {
    return _tts.setVolume(volume);
  }

  @override
  Future<void> setPitch(double pitch) {
    return _tts.setPitch(pitch);
  }

  @override
  Future<Object?> speak(String text) async {
    if (!Platform.isIOS) {
      return _tts.speak(text, focus: Platform.isAndroid);
    }

    await _tts.setSharedInstance(true);
    try {
      return await _tts.speak(text);
    } finally {
      await _tts.setSharedInstance(false);
    }
  }

  @override
  Future<void> pause() {
    return _tts.pause();
  }

  @override
  Future<void> stop() {
    return _tts.stop();
  }
}

typedef TtsPlaybackEngineFactory = TtsPlaybackEngine Function();
