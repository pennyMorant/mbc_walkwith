class ServingAssignment {
  const ServingAssignment({
    required this.id,
    required this.teamName,
    required this.roleName,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.status,
    required this.note,
    required this.responseNote,
  });

  final String id;
  final String teamName;
  final String roleName;
  final String title;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String location;
  final String status;
  final String note;
  final String responseNote;

  bool get canConfirm => status == 'scheduled' || status == 'declined';
  bool get canRequestLeave => status == 'scheduled' || status == 'confirmed';
  bool get canCheckIn => status == 'scheduled' || status == 'confirmed';
}
