class ServingAvailability {
  const ServingAvailability({
    required this.id,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.note,
  });

  final String id;
  final DateTime startsAt;
  final DateTime endsAt;
  final String status;
  final String note;
}

class ServingAvailabilityDraft {
  const ServingAvailabilityDraft({
    required this.startsAt,
    required this.endsAt,
    required this.status,
    this.note = '',
  });

  final DateTime startsAt;
  final DateTime endsAt;
  final String status;
  final String note;
}
