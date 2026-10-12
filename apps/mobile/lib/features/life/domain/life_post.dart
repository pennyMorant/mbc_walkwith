enum EventRegistrationStatus { confirmed, cancelled, checkedIn, absent }

enum EventCheckInMethod { memberSelf, onsiteQr, adminManual }

class LifePost {
  const LifePost({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.meta,
    required this.iconName,
    this.startsAt,
    this.endsAt,
    this.visibility = 'public',
    this.status = 'published',
    this.imageUrl,
    this.displayWeight = 0,
    this.ctaLabel,
    this.ctaUrl,
    this.registrationEnabled = false,
    this.registrationCapacity,
    this.registrationDeadline,
    this.registrationAllowCancellation = true,
    this.registrationMaxPartySize = 1,
    this.registrationSummary,
    this.updatedAt,
    this.isRead = false,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String meta;
  final String iconName;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String visibility;
  final String status;
  final String? imageUrl;
  final int displayWeight;
  final String? ctaLabel;
  final String? ctaUrl;
  final bool registrationEnabled;
  final int? registrationCapacity;
  final DateTime? registrationDeadline;
  final bool registrationAllowCancellation;
  final int registrationMaxPartySize;
  final EventRegistrationSummary? registrationSummary;
  final DateTime? updatedAt;
  final bool isRead;
  final DateTime? readAt;
}

class EventRegistrationSummary {
  const EventRegistrationSummary({
    this.enabled = false,
    this.capacity,
    this.registeredCount = 0,
    this.remainingCount,
    this.myRegistrationStatus,
    this.myPartySize,
    this.myNote,
    this.myCheckedInAt,
    this.myCheckInMethod,
  });

  final bool enabled;
  final int? capacity;
  final int registeredCount;
  final int? remainingCount;
  final EventRegistrationStatus? myRegistrationStatus;
  final int? myPartySize;
  final String? myNote;
  final DateTime? myCheckedInAt;
  final EventCheckInMethod? myCheckInMethod;

  bool get isFull => remainingCount != null && remainingCount! <= 0;
  bool get isRegistered =>
      myRegistrationStatus == EventRegistrationStatus.confirmed ||
      myRegistrationStatus == EventRegistrationStatus.checkedIn;
  bool get isCheckedIn =>
      myRegistrationStatus == EventRegistrationStatus.checkedIn;
}
