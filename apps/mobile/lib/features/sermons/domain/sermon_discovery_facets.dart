class SermonDiscoveryFacets {
  const SermonDiscoveryFacets({
    this.speakers = const [],
    this.series = const [],
    this.topics = const [],
  });

  final List<String> speakers;
  final List<String> series;
  final List<String> topics;

  bool get isEmpty => speakers.isEmpty && series.isEmpty && topics.isEmpty;
}
