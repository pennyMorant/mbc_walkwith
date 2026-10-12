import '../../domain/sermon_discovery_facets.dart';

class SermonDiscoveryFacetsDto {
  const SermonDiscoveryFacetsDto({
    this.speakers = const [],
    this.series = const [],
    this.topics = const [],
  });

  final List<String> speakers;
  final List<String> series;
  final List<String> topics;

  factory SermonDiscoveryFacetsDto.fromJson(Map<String, Object?> json) {
    return SermonDiscoveryFacetsDto(
      speakers: _stringList(json['speakers']),
      series: _stringList(json['series']),
      topics: _stringList(json['topics']),
    );
  }

  SermonDiscoveryFacets toDomain() {
    return SermonDiscoveryFacets(
      speakers: List.unmodifiable(speakers),
      series: List.unmodifiable(series),
      topics: List.unmodifiable(topics),
    );
  }
}

List<String> _stringList(Object? value) {
  if (value is! List<Object?> || value.any((item) => item is! String)) {
    throw const FormatException('Sermon discovery facets are malformed.');
  }
  return value.cast<String>();
}
