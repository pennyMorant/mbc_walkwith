import '../../../core/api/api_client.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_availability.dart';
import '../domain/serving_check_in.dart';
import 'dto/serving_assignment_dto.dart';
import 'dto/serving_availability_dto.dart';
import 'dto/serving_check_in_dto.dart';
import 'dto/serving_json_reader.dart';
import 'serving_repository_contract.dart';

class ApiServingRepository implements ServingRepository {
  const ApiServingRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<ServingAssignment>> getAssignments(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/serving-assignments',
      session.accessToken,
    );
    return readServingItems(response)
        .map(ServingAssignmentDto.fromJson)
        .map((assignment) => assignment.toDomain())
        .toList(growable: false);
  }

  @override
  Future<List<ServingAvailability>> getAvailability(
    MemberSession session,
  ) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/serving-availability',
      session.accessToken,
    );
    return readServingItems(response)
        .map(ServingAvailabilityDto.fromJson)
        .map((record) => record.toDomain())
        .toList(growable: false);
  }

  @override
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/serving-check-ins',
      session.accessToken,
    );
    return readServingItems(response)
        .map(ServingCheckInDto.fromJson)
        .map((record) => record.toDomain())
        .toList(growable: false);
  }

  @override
  Future<ServingAssignment> confirm(
    String assignmentId,
    MemberSession session,
  ) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/serving-assignments/${Uri.encodeComponent(assignmentId)}/confirm',
      const {},
      session.accessToken,
    );
    return ServingAssignmentDto.fromJson(readServingData(response)).toDomain();
  }

  @override
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  ) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/serving-assignments/${Uri.encodeComponent(assignmentId)}/leave-request',
      const {},
      session.accessToken,
    );
    return ServingAssignmentDto.fromJson(readServingData(response)).toDomain();
  }

  @override
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  ) async {
    final response = await apiClient
        .postJsonMapWithBearer('/me/serving-availability', {
          'startsAt': draft.startsAt.toUtc().toIso8601String(),
          'endsAt': draft.endsAt.toUtc().toIso8601String(),
          'status': draft.status,
          'note': draft.note.trim(),
        }, session.accessToken);
    return ServingAvailabilityDto.fromJson(
      readServingData(response),
    ).toDomain();
  }

  @override
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  }) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/serving-assignments/${Uri.encodeComponent(assignmentId)}/check-in',
      {'status': 'checked_in', 'note': note.trim()},
      session.accessToken,
    );
    return ServingCheckInDto.fromJson(readServingData(response)).toDomain();
  }
}
