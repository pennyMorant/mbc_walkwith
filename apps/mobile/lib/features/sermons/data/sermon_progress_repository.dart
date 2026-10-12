import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../../core/identity/external_user_identity_repository.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import '../../member_auth/data/member_session_repository.dart';
import 'sermon_progress_models.dart';

final sermonProgressRepositoryProvider = Provider<SermonProgressRepository>((
  ref,
) {
  return SermonProgressRepository(
    apiClient: ref.watch(apiClientProvider),
    sharedPreferences: ref.watch(sharedPreferencesProvider),
    useMockRemoteData: ref.watch(appConfigProvider).useMockRemoteData,
    identity: () async {
      final session = await ref.read(memberSessionProvider.future);
      final externalUserId = await ref.read(externalUserIdProvider.future);
      return SermonProgressIdentity(
        externalUserId: externalUserId,
        accessToken: session?.accessToken,
      );
    },
  );
});

final recentPlayedSermonIdProvider =
    NotifierProvider<RecentPlayedSermonIdNotifier, String?>(
      RecentPlayedSermonIdNotifier.new,
    );

class RecentPlayedSermonIdNotifier extends Notifier<String?> {
  @override
  String? build() {
    return ref.watch(sermonProgressRepositoryProvider).recentPlayedSermonId();
  }

  void setCurrent(String sermonId) {
    state = sermonId;
  }
}

class SermonProgressRepository {
  const SermonProgressRepository({
    required this.apiClient,
    required this.sharedPreferences,
    required this.useMockRemoteData,
    required this.identity,
  });

  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  final bool useMockRemoteData;
  final Future<SermonProgressIdentity> Function() identity;

  SermonLocalProgress savedLocalProgress(String sermonId) {
    final seconds = sharedPreferences.getInt(_positionKey(sermonId)) ?? 0;
    final updatedAtMilliseconds = sharedPreferences.getInt(
      _positionUpdatedAtKey(sermonId),
    );
    return SermonLocalProgress(
      position: Duration(seconds: seconds),
      updatedAt: updatedAtMilliseconds == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(
              updatedAtMilliseconds,
              isUtc: true,
            ),
    );
  }

  Duration savedPosition(String sermonId) {
    return savedLocalProgress(sermonId).position;
  }

  double savedProgress({required String sermonId, required Duration duration}) {
    if (duration.inSeconds <= 0) {
      return 0;
    }
    final position = savedPosition(sermonId);
    if (position <= Duration.zero) {
      return 0;
    }
    if (position >= duration - const Duration(seconds: 15)) {
      return 0;
    }
    return (position.inMilliseconds / duration.inMilliseconds)
        .clamp(0, 1)
        .toDouble();
  }

  double savedSpeed() {
    final speed = sharedPreferences.getDouble(_speedKey) ?? 1;
    return _allowedSpeeds.contains(speed) ? speed : 1;
  }

  Future<void> saveSpeed(double speed) async {
    final double nextSpeed = _allowedSpeeds.contains(speed) ? speed : 1;
    await sharedPreferences.setDouble(_speedKey, nextSpeed);
  }

  Future<void> savePosition({
    required String sermonId,
    required Duration position,
  }) async {
    await sharedPreferences.setInt(_positionKey(sermonId), position.inSeconds);
    await _savePositionUpdatedAt(sermonId, DateTime.now().toUtc());
  }

  Future<void> clearPosition(String sermonId) async {
    await sharedPreferences.remove(_positionKey(sermonId));
    await _savePositionUpdatedAt(sermonId, DateTime.now().toUtc());
  }

  Future<void> applyRemoteProgress(SermonRemoteProgress progress) async {
    if (progress.completed) {
      await sharedPreferences.remove(_positionKey(progress.sermonId));
    } else {
      await sharedPreferences.setInt(
        _positionKey(progress.sermonId),
        progress.position.inSeconds,
      );
    }
    await _savePositionUpdatedAt(progress.sermonId, progress.updatedAt);
  }

  String? recentPlayedSermonId() {
    final value = sharedPreferences.getString(_recentPlayedSermonKey);
    if (value == null || value.trim().isEmpty) {
      return null;
    }
    return value;
  }

  Future<void> saveRecentPlayedSermonId(String sermonId) async {
    await sharedPreferences.setString(_recentPlayedSermonKey, sermonId);
  }

  Future<void> reportProgress({
    required String sermonId,
    required Duration position,
    required bool completed,
  }) async {
    if (useMockRemoteData) {
      return;
    }
    final progressIdentity = await identity();
    final encodedSermonId = Uri.encodeComponent(sermonId);
    final response = await apiClient.postJsonMapWithIdentity(
      '/sermons/$encodedSermonId/progress',
      {'positionSeconds': position.inSeconds, 'completed': completed},
      accessToken: progressIdentity.accessToken,
      externalUserId: progressIdentity.externalUserId,
    );
    _progressForSermonFromEnvelope(response, sermonId);
  }

  Future<SermonRemoteProgress?> fetchRemoteProgress(String sermonId) async {
    if (useMockRemoteData) {
      return null;
    }
    final progressIdentity = await identity();
    final encodedSermonId = Uri.encodeComponent(sermonId);
    final response = await apiClient.getJsonMapWithIdentity(
      '/sermons/$encodedSermonId/progress',
      accessToken: progressIdentity.accessToken,
      externalUserId: progressIdentity.externalUserId,
    );
    return _progressForSermonFromEnvelope(response, sermonId);
  }

  Future<void> _savePositionUpdatedAt(String sermonId, DateTime updatedAt) {
    return sharedPreferences.setInt(
      _positionUpdatedAtKey(sermonId),
      updatedAt.toUtc().millisecondsSinceEpoch,
    );
  }
}

SermonRemoteProgress? _progressFromEnvelope(Map<String, Object?> envelope) {
  final data = envelope['data'];
  if (data == null) {
    return null;
  }
  if (data is! Map<String, Object?>) {
    throw const FormatException('Sermon progress response is malformed.');
  }
  return SermonRemoteProgress.fromJson(data);
}

SermonRemoteProgress? _progressForSermonFromEnvelope(
  Map<String, Object?> envelope,
  String sermonId,
) {
  final progress = _progressFromEnvelope(envelope);
  if (progress != null && progress.sermonId != sermonId) {
    throw const FormatException('Sermon progress resource id does not match.');
  }
  return progress;
}

String _positionKey(String sermonId) => 'sermon_progress_seconds_$sermonId';
String _positionUpdatedAtKey(String sermonId) =>
    'sermon_progress_updated_at_$sermonId';

const _speedKey = 'sermon_playback_speed';
const _recentPlayedSermonKey = 'sermon_recent_played_id';
const _allowedSpeeds = <double>[1, 1.25, 1.5, 2];
