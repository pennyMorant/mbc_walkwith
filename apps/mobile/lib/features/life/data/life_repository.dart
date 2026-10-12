import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../../core/database/app_database.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';
import 'cached_life_repository.dart';
import 'life_repository_contract.dart';
import 'local/life_local_data_source.dart';
import 'remote/api_life_remote_data_source.dart';
import 'remote/life_remote_data_source.dart';
import 'remote/mock_life_remote_data_source.dart';

export 'cached_life_repository.dart';
export 'life_repository_contract.dart';
export 'remote_life_repository.dart';

final lifeRemoteDataSourceProvider = Provider<LifeRemoteDataSource>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockLifeRemoteDataSource();
  }
  return ApiLifeRemoteDataSource(apiClient: ref.watch(apiClientProvider));
});

final lifeLocalDataSourceProvider = Provider<LifeLocalDataSource>((ref) {
  return LifeLocalDataSource(database: ref.watch(appDatabaseProvider));
});

final lifeRepositoryProvider = Provider<LifeRepository>((ref) {
  return CachedLifeRepository(
    remoteDataSource: ref.watch(lifeRemoteDataSourceProvider),
    localDataSource: ref.watch(lifeLocalDataSourceProvider),
  );
});

final lifePostListProvider =
    FutureProvider.family<List<LifePost>, LifePostListRequest>((ref, request) {
      final session = ref
          .watch(memberSessionProvider)
          .maybeWhen(data: (session) => session, orElse: () => null);
      return ref
          .watch(lifeRepositoryProvider)
          .getLifePosts(session: session, request: request);
    });

final lifePostsProvider = FutureProvider<List<LifePost>>((ref) {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  return ref.watch(lifeRepositoryProvider).getLifePosts(session: session);
});

final lifePostByIdProvider = FutureProvider.family<LifePost?, String>((
  ref,
  postId,
) {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  return ref
      .watch(lifeRepositoryProvider)
      .getLifePostById(postId, session: session);
});
