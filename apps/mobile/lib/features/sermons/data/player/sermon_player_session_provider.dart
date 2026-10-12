import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/media/app_media_session_provider.dart';
import '../sermon_progress_repository.dart';
import 'sermon_audio_engine.dart';
import 'sermon_player_session.dart';

final sermonPlayerSessionProvider = Provider<SermonPlayerSession>((ref) {
  final session = SermonPlayerSession(
    repository: () => ref.read(sermonProgressRepositoryProvider),
    audioEngineFactory: () => JustAudioSermonAudioEngine(
      mediaSession: ref.read(appMediaSessionProvider),
    ),
    onRecentPlayedChanged: (sermonId) {
      ref.read(recentPlayedSermonIdProvider.notifier).setCurrent(sermonId);
    },
  );
  ref.onDispose(session.dispose);
  return session;
});
