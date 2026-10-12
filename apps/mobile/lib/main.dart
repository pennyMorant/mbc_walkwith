import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/walk_with_app.dart';
import 'core/media/app_media_session.dart';
import 'core/media/app_media_session_provider.dart';
import 'core/storage/shared_preferences_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final mediaSession = await AudioService.init<AppMediaSession>(
    builder: AppMediaSession.new,
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'org.mbc.walkwith.playback',
      androidNotificationChannelName: 'MBCG Playback',
      androidNotificationIcon: 'drawable/ic_launcher_monochrome',
      androidStopForegroundOnPause: false,
      fastForwardInterval: Duration(seconds: 15),
      rewindInterval: Duration(seconds: 15),
    ),
  );

  final sharedPreferences = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(sharedPreferences),
        appMediaSessionProvider.overrideWithValue(mediaSession),
      ],
      child: WalkWithApp(),
    ),
  );
}
