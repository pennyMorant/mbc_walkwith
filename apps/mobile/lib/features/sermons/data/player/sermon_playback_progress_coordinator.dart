import 'dart:async';

import '../sermon_progress_repository.dart';
import '../../domain/sermon.dart';

class SermonPlaybackProgressCoordinator {
  const SermonPlaybackProgressCoordinator({
    required SermonProgressRepository Function() repository,
  }) : _repository = repository;

  final SermonProgressRepository Function() _repository;

  Duration savedPosition(String sermonId) {
    return _repository().savedPosition(sermonId);
  }

  Future<Duration?> restoreSavedPosition({
    required Sermon sermon,
    required Duration? loadedDuration,
    required Future<void> Function(Duration position) seek,
  }) async {
    final repository = _repository();
    final localProgress = repository.savedLocalProgress(sermon.id);
    var savedPosition = localProgress.position;
    try {
      final remoteProgress = await repository.fetchRemoteProgress(sermon.id);
      if (remoteProgress != null &&
          (localProgress.updatedAt == null ||
              remoteProgress.updatedAt.isAfter(localProgress.updatedAt!))) {
        await repository.applyRemoteProgress(remoteProgress);
        savedPosition = remoteProgress.completed
            ? Duration.zero
            : remoteProgress.position;
      }
    } catch (_) {
      // Playback recovery remains available when progress sync is offline.
    }
    final restoreDuration = loadedDuration ?? sermon.duration;
    if (savedPosition <= const Duration(seconds: 5)) {
      return null;
    }
    if (restoreDuration > Duration.zero &&
        savedPosition >= restoreDuration - const Duration(seconds: 15)) {
      return null;
    }
    await seek(savedPosition);
    return savedPosition;
  }

  Future<void> saveLocalPosition({
    required String sermonId,
    required Duration position,
  }) {
    return _repository().savePosition(sermonId: sermonId, position: position);
  }

  Future<void> saveRecentPlayedSermonId(String sermonId) {
    return _repository().saveRecentPlayedSermonId(sermonId);
  }

  Future<void> saveAndReport({
    required Sermon sermon,
    required Duration position,
    required Duration duration,
  }) async {
    if (!sermon.hasAudio) {
      return;
    }
    final completed = isComplete(duration: duration, position: position);
    await _saveLocalProgress(
      sermonId: sermon.id,
      position: position,
      completed: completed,
    );
    await _reportProgress(
      sermonId: sermon.id,
      position: position,
      completed: completed,
    );
  }

  Future<void> saveForSourceSwitch({
    required Sermon sermon,
    required Duration position,
    required Duration duration,
  }) async {
    if (!sermon.hasAudio) {
      return;
    }
    final completed = isComplete(duration: duration, position: position);
    await _saveLocalProgress(
      sermonId: sermon.id,
      position: position,
      completed: completed,
    );
    unawaited(
      _reportProgress(
        sermonId: sermon.id,
        position: position,
        completed: completed,
      ),
    );
  }

  Future<void> _saveLocalProgress({
    required String sermonId,
    required Duration position,
    required bool completed,
  }) async {
    final repository = _repository();
    if (completed) {
      await repository.clearPosition(sermonId);
    } else {
      await repository.savePosition(sermonId: sermonId, position: position);
    }
  }

  Future<void> _reportProgress({
    required String sermonId,
    required Duration position,
    required bool completed,
  }) async {
    try {
      await _repository().reportProgress(
        sermonId: sermonId,
        position: position,
        completed: completed,
      );
    } catch (_) {
      // Local progress should not be blocked by a network-only sync failure.
    }
  }

  bool isComplete({required Duration duration, required Duration position}) {
    if (duration <= Duration.zero) {
      return false;
    }
    return position >= duration - const Duration(seconds: 15);
  }
}
