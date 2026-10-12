class PrayerRequest {
  const PrayerRequest({
    required this.id,
    required this.title,
    required this.body,
    required this.visibility,
    required this.groupId,
    required this.status,
    required this.submitterName,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String title;
  final String body;
  final String visibility;
  final String? groupId;
  final String status;
  final String submitterName;
  final DateTime createdAt;
  final DateTime updatedAt;
}
