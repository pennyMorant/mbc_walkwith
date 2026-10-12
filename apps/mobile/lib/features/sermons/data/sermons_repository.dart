import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_error.dart';
import '../../../core/config/app_config.dart';
import '../../../core/database/app_database.dart';
import '../domain/sermon.dart';
import '../domain/sermon_discovery_facets.dart';
import '../domain/sermon_list_request.dart';
import 'local/sermons_local_data_source.dart';
import 'remote/api_sermons_remote_data_source.dart';
import 'remote/mock_sermons_remote_data_source.dart';
import 'remote/sermons_remote_data_source.dart';

final sermonsRemoteDataSourceProvider = Provider<SermonsRemoteDataSource>((
  ref,
) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockSermonsRemoteDataSource();
  }
  return ApiSermonsRemoteDataSource(apiClient: ref.watch(apiClientProvider));
});

final sermonsLocalDataSourceProvider = Provider<SermonsLocalDataSource>((ref) {
  return SermonsLocalDataSource(database: ref.watch(appDatabaseProvider));
});

final sermonsRepositoryProvider = Provider<SermonsRepository>((ref) {
  return CachedSermonsRepository(
    remoteDataSource: ref.watch(sermonsRemoteDataSourceProvider),
    localDataSource: ref.watch(sermonsLocalDataSourceProvider),
  );
});

final sermonsProvider = FutureProvider.autoDispose
    .family<List<Sermon>, SermonListRequest>((ref, request) {
      return ref.watch(sermonsRepositoryProvider).getSermons(request: request);
    });

final recentSermonsProvider = FutureProvider.autoDispose<List<Sermon>>((ref) {
  return ref.watch(sermonsRepositoryProvider).getSermons();
});

final sermonDiscoveryFacetsProvider =
    FutureProvider.autoDispose<SermonDiscoveryFacets>((ref) {
      return ref.watch(sermonsRepositoryProvider).getDiscoveryFacets();
    });

final sermonByIdProvider = FutureProvider.autoDispose.family<Sermon?, String>((
  ref,
  sermonId,
) {
  return ref.watch(sermonsRepositoryProvider).getSermonById(sermonId);
});

final recommendedSermonsProvider = FutureProvider.autoDispose
    .family<List<Sermon>, SermonRecommendationRequest>((ref, request) {
      return ref
          .watch(sermonsRepositoryProvider)
          .getRecommendedSermons(
            bookId: request.bookId,
            chapter: request.chapter,
            verseId: request.verseId,
            limit: request.limit,
          );
    });

class SermonRecommendationRequest {
  const SermonRecommendationRequest({
    required this.bookId,
    required this.chapter,
    this.verseId,
    this.limit = 3,
  });

  final String bookId;
  final int chapter;
  final String? verseId;
  final int limit;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is SermonRecommendationRequest &&
            runtimeType == other.runtimeType &&
            bookId == other.bookId &&
            chapter == other.chapter &&
            verseId == other.verseId &&
            limit == other.limit;
  }

  @override
  int get hashCode => Object.hash(bookId, chapter, verseId, limit);
}

abstract class SermonsRepository {
  Future<List<Sermon>> getSermons({
    SermonListRequest request = const SermonListRequest(),
  });

  Future<Sermon?> getSermonById(String sermonId);

  Future<SermonDiscoveryFacets> getDiscoveryFacets();

  Future<List<Sermon>> getRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  });
}

class RemoteSermonsRepository implements SermonsRepository {
  const RemoteSermonsRepository({required this.remoteDataSource});

  final SermonsRemoteDataSource remoteDataSource;

  @override
  Future<List<Sermon>> getSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    final sermonDtos = await remoteDataSource.fetchSermons(request: request);
    return sermonDtos.map((sermon) => sermon.toDomain()).toList();
  }

  @override
  Future<Sermon?> getSermonById(String sermonId) async {
    final sermonDto = await remoteDataSource.fetchSermonById(sermonId);
    return sermonDto?.toDomain();
  }

  @override
  Future<SermonDiscoveryFacets> getDiscoveryFacets() async {
    return (await remoteDataSource.fetchDiscoveryFacets()).toDomain();
  }

  @override
  Future<List<Sermon>> getRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    final sermonDtos = await remoteDataSource.fetchRecommendedSermons(
      bookId: bookId,
      chapter: chapter,
      verseId: verseId,
      limit: limit,
    );
    return sermonDtos.map((sermon) => sermon.toDomain()).toList();
  }
}

class CachedSermonsRepository implements SermonsRepository {
  const CachedSermonsRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  final SermonsRemoteDataSource remoteDataSource;
  final SermonsLocalDataSource localDataSource;

  @override
  Future<List<Sermon>> getSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    try {
      final sermonDtos = await remoteDataSource.fetchSermons(request: request);
      if (request.canRefreshCache) {
        final canReconcileRange =
            request.from != null &&
            request.to != null &&
            sermonDtos.length < request.limit;
        await localDataSource.cacheSermons(
          sermonDtos,
          reconcileFrom: canReconcileRange ? request.from : null,
          reconcileTo: canReconcileRange ? request.to : null,
        );
      }
      return sermonDtos.map((sermon) => sermon.toDomain()).toList();
    } on ApiError {
      final cachedDtos = await localDataSource.fetchSermons(request: request);
      if (cachedDtos.isNotEmpty) {
        return cachedDtos.map((sermon) => sermon.toDomain()).toList();
      }
      rethrow;
    }
  }

  @override
  Future<Sermon?> getSermonById(String sermonId) async {
    try {
      final sermonDto = await remoteDataSource.fetchSermonById(sermonId);
      if (sermonDto != null) {
        return sermonDto.toDomain();
      }
      await localDataSource.deleteSermon(sermonId);
      return null;
    } on ApiError catch (error) {
      if (_isAuthoritativeSermonMiss(error)) {
        await localDataSource.deleteSermon(sermonId);
        return null;
      }
      final cachedDto = await localDataSource.fetchSermonById(sermonId);
      if (cachedDto != null) {
        return cachedDto.toDomain();
      }
      rethrow;
    }
  }

  @override
  Future<SermonDiscoveryFacets> getDiscoveryFacets() async {
    try {
      return (await remoteDataSource.fetchDiscoveryFacets()).toDomain();
    } on ApiError {
      return (await localDataSource.fetchDiscoveryFacets()).toDomain();
    }
  }

  @override
  Future<List<Sermon>> getRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    try {
      final sermonDtos = await remoteDataSource.fetchRecommendedSermons(
        bookId: bookId,
        chapter: chapter,
        verseId: verseId,
        limit: limit,
      );
      return sermonDtos.map((sermon) => sermon.toDomain()).toList();
    } on ApiError {
      final cachedDtos = await localDataSource.fetchRecommendedSermons(
        bookId: bookId,
        chapter: chapter,
        verseId: verseId,
        limit: limit,
      );
      if (cachedDtos.isNotEmpty) {
        return cachedDtos.map((sermon) => sermon.toDomain()).toList();
      }
      rethrow;
    }
  }
}

bool _isAuthoritativeSermonMiss(ApiError error) {
  return error.isNotFound || error.hasCode(const {'sermon_not_found'});
}
