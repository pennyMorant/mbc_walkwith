import '../../domain/serving_availability.dart';
import 'serving_json_reader.dart';

const _availabilityStatuses = {'available', 'unavailable', 'preferred'};

class ServingAvailabilityDto {
  const ServingAvailabilityDto({
    required this.id,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.note,
  });

  factory ServingAvailabilityDto.fromJson(Map<String, Object?> json) {
    readServingString(json, 'userId', allowEmpty: false);
    readServingDateTime(json, 'createdAt');
    readServingDateTime(json, 'updatedAt');
    final startsAt = readServingDateTime(json, 'startsAt');
    final endsAt = readServingDateTime(json, 'endsAt');
    if (!endsAt.isAfter(startsAt)) {
      throw const FormatException('endsAt must be later than startsAt.');
    }
    return ServingAvailabilityDto(
      id: readServingString(json, 'id', allowEmpty: false),
      startsAt: startsAt,
      endsAt: endsAt,
      status: readServingEnum(json, 'status', _availabilityStatuses),
      note: readServingString(json, 'note'),
    );
  }

  final String id;
  final DateTime startsAt;
  final DateTime endsAt;
  final String status;
  final String note;

  ServingAvailability toDomain() {
    return ServingAvailability(
      id: id,
      startsAt: startsAt,
      endsAt: endsAt,
      status: status,
      note: note,
    );
  }
}
