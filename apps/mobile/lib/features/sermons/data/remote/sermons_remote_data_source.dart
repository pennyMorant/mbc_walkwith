import '../../domain/sermon_list_request.dart';
import '../dto/sermon_discovery_facets_dto.dart';
import '../dto/sermon_dto.dart';

abstract class SermonsRemoteDataSource {
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  });

  Future<SermonDto?> fetchSermonById(String sermonId);

  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets();

  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  });
}
