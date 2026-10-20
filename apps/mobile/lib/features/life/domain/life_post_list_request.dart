class LifePostListRequest {
  const LifePostListRequest({
    this.limit = 20,
    this.offset = 0,
    this.loadAll = false,
    this.query,
    this.type,
    this.from,
    this.to,
  });

  final int limit;
  final int offset;
  final bool loadAll;
  final String? query;
  final String? type;
  final DateTime? from;
  final DateTime? to;

  bool get isDefault =>
      limit == 20 &&
      offset == 0 &&
      !loadAll &&
      (query == null || query!.trim().isEmpty) &&
      (type == null || type!.trim().isEmpty) &&
      from == null &&
      to == null;

  bool get canRefreshCache =>
      (query == null || query!.trim().isEmpty) &&
      (type == null || type!.trim().isEmpty) &&
      from == null &&
      to == null;

  Map<String, String> toQueryParameters() {
    return {
      'limit': '$limit',
      'offset': '$offset',
      if (query != null && query!.trim().isNotEmpty) 'query': query!.trim(),
      if (type != null && type!.trim().isNotEmpty) 'type': type!.trim(),
      if (from != null) 'from': from!.toUtc().toIso8601String(),
      if (to != null) 'to': to!.toUtc().toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is LifePostListRequest &&
            runtimeType == other.runtimeType &&
            limit == other.limit &&
            offset == other.offset &&
            loadAll == other.loadAll &&
            query == other.query &&
            type == other.type &&
            from == other.from &&
            to == other.to;
  }

  @override
  int get hashCode =>
      Object.hash(limit, offset, loadAll, query, type, from, to);

  LifePostListRequest page(int nextOffset) => LifePostListRequest(
    limit: limit,
    offset: nextOffset,
    loadAll: loadAll,
    query: query,
    type: type,
    from: from,
    to: to,
  );
}
