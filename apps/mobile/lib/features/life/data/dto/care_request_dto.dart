import '../../domain/care_request.dart';

class CareRequestDto {
  const CareRequestDto({
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

  factory CareRequestDto.fromJson(Map<String, Object?> json) {
    return CareRequestDto(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      memberDisplayName: json['memberDisplayName'] as String? ?? '',
      memberEmail: json['memberEmail'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      status: json['status'] as String? ?? 'submitted',
      privacyLevel: json['privacyLevel'] as String? ?? 'pastoral_only',
      assigneeName: json['assigneeName'] as String? ?? '',
      nextFollowUpAt: _parseDateTime(json['nextFollowUpAt']),
      createdAt: _parseDateTime(json['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDateTime(json['updatedAt']) ?? DateTime.now(),
    );
  }

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

  CareRequest toDomain() {
    return CareRequest(
      id: id,
      userId: userId,
      memberDisplayName: memberDisplayName,
      memberEmail: memberEmail,
      title: title,
      body: body,
      status: status,
      privacyLevel: privacyLevel,
      assigneeName: assigneeName,
      nextFollowUpAt: nextFollowUpAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

DateTime? _parseDateTime(Object? value) {
  if (value is! String || value.isEmpty) {
    return null;
  }
  return DateTime.tryParse(value);
}
