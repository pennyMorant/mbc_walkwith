class CareRequest {
  const CareRequest({
    required this.id,
    required this.userId,
    required this.memberDisplayName,
    required this.memberEmail,
    required this.title,
    required this.body,
    required this.status,
    required this.privacyLevel,
    required this.assigneeName,
    required this.nextFollowUpAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String memberDisplayName;
  final String memberEmail;
  final String title;
  final String body;
  final String status;
  final String privacyLevel;
  final String assigneeName;
  final DateTime? nextFollowUpAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isActive =>
      status == 'submitted' || status == 'assigned' || status == 'in_progress';
}
