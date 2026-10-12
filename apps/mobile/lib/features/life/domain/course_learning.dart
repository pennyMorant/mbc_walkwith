class CourseLesson {
  const CourseLesson({
    required this.id,
    required this.courseId,
    required this.title,
    required this.description,
    required this.startsAt,
    required this.status,
    required this.sortOrder,
  });

  final String id;
  final String courseId;
  final String title;
  final String description;
  final DateTime? startsAt;
  final String status;
  final int sortOrder;
}

class CourseLearning {
  const CourseLearning({
    required this.id,
    required this.title,
    required this.description,
    required this.teacherName,
    required this.location,
    required this.scheduleText,
    required this.visibility,
    required this.status,
    required this.capacity,
    required this.enrolledCount,
    required this.lessonCount,
    required this.myEnrollmentStatus,
    required this.myCompletedLessonCount,
    required this.lessons,
  });

  final String id;
  final String title;
  final String description;
  final String teacherName;
  final String location;
  final String scheduleText;
  final String visibility;
  final String status;
  final int? capacity;
  final int enrolledCount;
  final int lessonCount;
  final String? myEnrollmentStatus;
  final int myCompletedLessonCount;
  final List<CourseLesson> lessons;

  bool get isEnrolled =>
      myEnrollmentStatus == 'enrolled' || myEnrollmentStatus == 'completed';

  bool get canEnroll =>
      (myEnrollmentStatus == null || myEnrollmentStatus == 'cancelled') &&
      (status == 'open' || status == 'in_progress');
}
