class MinistryGroup {
  const MinistryGroup({
    required this.id,
    required this.name,
    required this.description,
    required this.meetingTime,
    required this.location,
    required this.leaderName,
    required this.visibility,
    required this.status,
    required this.capacity,
    required this.memberCount,
    required this.myApplicationId,
    required this.myApplicationStatus,
    required this.myMembershipStatus,
  });

  final String id;
  final String name;
  final String description;
  final String meetingTime;
  final String location;
  final String leaderName;
  final String visibility;
  final String status;
  final int? capacity;
  final int memberCount;
  final String? myApplicationId;
  final String? myApplicationStatus;
  final String? myMembershipStatus;

  bool get isMember =>
      myMembershipStatus == 'active' || myMembershipStatus == 'leader';
  bool get hasSubmittedApplication => myApplicationStatus == 'submitted';
  bool get isFull => capacity != null && memberCount >= capacity!;
  bool get canApply => !isMember && !hasSubmittedApplication && !isFull;
}
