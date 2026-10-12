import '../../../../core/api/api_client.dart';
import '../../domain/sermon_list_request.dart';
import '../dto/sermon_discovery_facets_dto.dart';
import '../dto/sermon_dto.dart';
import 'sermons_remote_data_source.dart';

class ApiSermonsRemoteDataSource implements SermonsRemoteDataSource {
  const ApiSermonsRemoteDataSource({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    final params = request.toQueryParameters();
    final response = await apiClient.getJsonMap(
      '/sermons?${Uri(queryParameters: params).query}',
    );
    return _sermonsFromEnvelope(response);
  }

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async {
    if (sermonId.trim().isEmpty) {
      return null;
    }
    final response = await apiClient.getJsonMap(
      '/sermons/${Uri.encodeComponent(sermonId)}',
    );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Sermon detail response is malformed.');
    }
    return SermonDto.fromJson(data, apiBaseUrl: apiClient.config.apiBaseUrl);
  }

  @override
  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async {
    final response = await apiClient.getJsonMap('/sermons/facets');
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Sermon discovery response is malformed.');
    }
    return SermonDiscoveryFacetsDto.fromJson(data);
  }

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    final params = {
      'bookId': bookId,
      'chapter': '$chapter',
      'limit': '$limit',
      'verseId': ?verseId,
    };
    final query = Uri(queryParameters: params).query;
    final response = await apiClient.getJsonMap(
      '/sermons/recommendations?$query',
    );
    return _sermonsFromEnvelope(response);
  }

  List<SermonDto> _sermonsFromEnvelope(Map<String, Object?> response) {
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Sermon list response is malformed.');
    }
    final items = data['items'];
    if (items is! List<Object?>) {
      throw const FormatException('Sermon list response is malformed.');
    }
    return items.map((item) {
      if (item is! Map<String, Object?>) {
        throw const FormatException('Sermon list item is malformed.');
      }
      return SermonDto.fromJson(item, apiBaseUrl: apiClient.config.apiBaseUrl);
    }).toList();
  }
}
