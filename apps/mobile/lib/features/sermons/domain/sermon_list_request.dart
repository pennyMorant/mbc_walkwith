class SermonListRequest {
  const SermonListRequest({
    this.limit = 50,
    this.query,
    this.speaker,
    this.series,
    this.topic,
    this.from,
    this.to,
  });

  final int limit;
  final String? query;
  final String? speaker;
  final String? series;
  final String? topic;
  final DateTime? from;
  final DateTime? to;

  bool get isDefault =>
      limit == 50 &&
      (query == null || query!.trim().isEmpty) &&
      !hasDiscoveryFilters &&
      from == null &&
      to == null;

  bool get hasDiscoveryFilters =>
      _hasValue(speaker) || _hasValue(series) || _hasValue(topic);

  bool get canRefreshCache =>
      (query == null || query!.trim().isEmpty) && !hasDiscoveryFilters;

  Map<String, String> toQueryParameters() {
    return {
      'limit': '$limit',
      if (query != null && query!.trim().isNotEmpty) 'query': query!.trim(),
      if (_hasValue(speaker)) 'speaker': speaker!.trim(),
      if (_hasValue(series)) 'series': series!.trim(),
      if (_hasValue(topic)) 'topic': topic!.trim(),
      if (from != null) 'from': from!.toUtc().toIso8601String(),
      if (to != null) 'to': to!.toUtc().toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is SermonListRequest &&
            runtimeType == other.runtimeType &&
            limit == other.limit &&
            query == other.query &&
            speaker == other.speaker &&
            series == other.series &&
            topic == other.topic &&
            from == other.from &&
            to == other.to;
  }

  @override
  int get hashCode =>
      Object.hash(limit, query, speaker, series, topic, from, to);
}

bool _hasValue(String? value) => value != null && value.trim().isNotEmpty;
