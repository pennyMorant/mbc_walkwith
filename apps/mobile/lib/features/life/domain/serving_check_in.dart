class ServingCheckIn {
  const ServingCheckIn({
    required this.id,
    required this.assignmentId,
    required this.status,
    required this.checkedInAt,
    required this.note,
  });

  final String id;
  final String assignmentId;
  final String status;
  final DateTime? checkedInAt;
  final String note;

  bool get canMemberCheckIn => status == 'pending';
}
