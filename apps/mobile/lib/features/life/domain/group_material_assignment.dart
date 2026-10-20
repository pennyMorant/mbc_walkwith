class GroupMaterialAssignment {
  const GroupMaterialAssignment({
    required this.id,
    required this.groupId,
    required this.materialType,
    required this.materialId,
    required this.title,
    required this.status,
    required this.dueAt,
  });

  final String id;
  final String groupId;
  final String materialType;
  final String materialId;
  final String title;
  final String status;
  final DateTime? dueAt;
}
