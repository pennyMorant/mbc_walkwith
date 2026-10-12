import '../../domain/course_learning.dart';
import 'course_learning_json_reader.dart';

const _courseStatuses = {
  'draft',
  'open',
  'closed',
  'in_progress',
  'completed',
  'archived',
};
const _courseLessonStatuses = {'scheduled', 'published', 'completed'};
const _courseEnrollmentStatuses = {
  'submitted',
  'enrolled',
  'waitlisted',
  'cancelled',
  'completed',
};
const _courseVisibilities = {'public', 'members', 'group', 'private'};

class CourseLessonDto {
  const CourseLessonDto({
    required this.id,
    required this.courseId,
    required this.title,
    required this.description,
    required this.startsAt,
    required this.status,
    required this.sortOrder,
  });

  factory CourseLessonDto.fromJson(Map<String, Object?> json) {
    readCourseDateTime(json, 'createdAt');
    readCourseDateTime(json, 'updatedAt');
    return CourseLessonDto(
      id: readCourseString(json, 'id', allowEmpty: false),
      courseId: readCourseString(json, 'courseId', allowEmpty: false),
      title: readCourseString(json, 'title', allowEmpty: false),
      description: readCourseString(json, 'description'),
      startsAt: readNullableCourseDateTime(json, 'startsAt'),
      status: readCourseEnum(json, 'status', _courseLessonStatuses),
      sortOrder: readCourseNonNegativeInt(json, 'sortOrder'),
    );
  }

  final String id;
  final String courseId;
  final String title;
  final String description;
  final DateTime? startsAt;
  final String status;
  final int sortOrder;

  CourseLesson toDomain() {
    return CourseLesson(
      id: id,
      courseId: courseId,
      title: title,
      description: description,
      startsAt: startsAt,
      status: status,
      sortOrder: sortOrder,
    );
  }
}

class CourseLearningDto {
  const CourseLearningDto({
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

  factory CourseLearningDto.fromJson(Map<String, Object?> json) {
    readCourseDateTime(json, 'createdAt');
    readCourseDateTime(json, 'updatedAt');
    final lessons = readCourseObjectList(
      json,
      'lessons',
    ).map(CourseLessonDto.fromJson).toList();
    final lessonCount = readCourseNonNegativeInt(json, 'lessonCount');
    final completedLessonCount = readCourseNonNegativeInt(
      json,
      'myCompletedLessonCount',
    );
    final capacity = readNullableCourseCapacity(json, 'capacity');
    final enrolledCount = readCourseNonNegativeInt(json, 'enrolledCount');
    final enrollmentStatus = readNullableCourseEnum(
      json,
      'myEnrollmentStatus',
      _courseEnrollmentStatuses,
    );
    if (lessonCount != lessons.length) {
      throw const FormatException('lessonCount must match lessons.');
    }
    if (completedLessonCount > lessonCount) {
      throw const FormatException(
        'myCompletedLessonCount must not exceed lessonCount.',
      );
    }
    if (capacity != null && enrolledCount > capacity) {
      throw const FormatException('enrolledCount must not exceed capacity.');
    }
    if (completedLessonCount != 0 &&
        enrollmentStatus != 'enrolled' &&
        enrollmentStatus != 'completed') {
      throw const FormatException(
        'Only enrolled or completed enrollments can hold progress.',
      );
    }
    return CourseLearningDto(
      id: readCourseString(json, 'id', allowEmpty: false),
      title: readCourseString(json, 'title', allowEmpty: false),
      description: readCourseString(json, 'description'),
      teacherName: readCourseString(json, 'teacherName'),
      location: readCourseString(json, 'location'),
      scheduleText: readCourseString(json, 'scheduleText'),
      visibility: readCourseEnum(json, 'visibility', _courseVisibilities),
      status: readCourseEnum(json, 'status', _courseStatuses),
      capacity: capacity,
      enrolledCount: enrolledCount,
      lessonCount: lessonCount,
      myEnrollmentStatus: enrollmentStatus,
      myCompletedLessonCount: completedLessonCount,
      lessons: lessons,
    );
  }

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
  final List<CourseLessonDto> lessons;

  CourseLearning toDomain() {
    return CourseLearning(
      id: id,
      title: title,
      description: description,
      teacherName: teacherName,
      location: location,
      scheduleText: scheduleText,
      visibility: visibility,
      status: status,
      capacity: capacity,
      enrolledCount: enrolledCount,
      lessonCount: lessonCount,
      myEnrollmentStatus: myEnrollmentStatus,
      myCompletedLessonCount: myCompletedLessonCount,
      lessons: lessons.map((lesson) => lesson.toDomain()).toList(),
    );
  }
}
