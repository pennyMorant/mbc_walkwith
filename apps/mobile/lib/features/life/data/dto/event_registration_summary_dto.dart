import '../../domain/life_post.dart';
import 'life_post_json_reader.dart';

const _eventRegistrationStatuses = {
  'confirmed',
  'cancelled',
  'checked_in',
  'absent',
};
const _eventCheckInMethods = {'member_self', 'onsite_qr', 'admin_manual'};

class EventRegistrationSummaryDto {
  const EventRegistrationSummaryDto({
    required this.enabled,
    this.capacity,
    required this.registeredCount,
    this.remainingCount,
    this.myRegistrationStatus,
    this.myPartySize,
    this.myNote,
    this.myCheckedInAt,
    this.myCheckInMethod,
  });

  final bool enabled;
  final int? capacity;
  final int registeredCount;
  final int? remainingCount;
  final String? myRegistrationStatus;
  final int? myPartySize;
  final String? myNote;
  final String? myCheckedInAt;
  final String? myCheckInMethod;

  factory EventRegistrationSummaryDto.fromJson(Map<String, Object?> json) {
    final capacity = readNullableLifePostInt(json, 'capacity', minimum: 1);
    final registeredCount = readLifePostInt(
      json,
      'registeredCount',
      minimum: 0,
    );
    final remainingCount = readNullableLifePostInt(
      json,
      'remainingCount',
      minimum: 0,
    );
    final registrationStatus = readNullableLifePostEnum(
      json,
      'myRegistrationStatus',
      _eventRegistrationStatuses,
    );
    final partySize = readNullableLifePostInt(
      json,
      'myPartySize',
      minimum: 1,
      maximum: 20,
    );
    final note = readNullableLifePostString(json, 'myNote');
    final checkedInAt = readNullableLifePostIsoDateTime(json, 'myCheckedInAt');
    final checkInMethod = readNullableLifePostEnum(
      json,
      'myCheckInMethod',
      _eventCheckInMethods,
    );
    if (capacity == null && remainingCount != null ||
        capacity != null &&
            remainingCount != (capacity - registeredCount).clamp(0, capacity)) {
      throw const FormatException(
        'Registration remaining count is inconsistent.',
      );
    }
    if (registrationStatus == null && (partySize != null || note != null) ||
        registrationStatus != null && partySize == null) {
      throw const FormatException(
        'Member registration summary is inconsistent.',
      );
    }
    if (registrationStatus == 'checked_in' &&
            (checkedInAt == null || checkInMethod == null) ||
        registrationStatus != 'checked_in' &&
            (checkedInAt != null || checkInMethod != null)) {
      throw const FormatException('Member check-in summary is inconsistent.');
    }
    return EventRegistrationSummaryDto(
      enabled: readLifePostBool(json, 'enabled'),
      capacity: capacity,
      registeredCount: registeredCount,
      remainingCount: remainingCount,
      myRegistrationStatus: registrationStatus,
      myPartySize: partySize,
      myNote: note,
      myCheckedInAt: checkedInAt,
      myCheckInMethod: checkInMethod,
    );
  }

  EventRegistrationSummary toDomain() {
    return EventRegistrationSummary(
      enabled: enabled,
      capacity: capacity,
      registeredCount: registeredCount,
      remainingCount: remainingCount,
      myRegistrationStatus: _registrationStatusFromWire(myRegistrationStatus),
      myPartySize: myPartySize,
      myNote: myNote,
      myCheckedInAt: _dateFromString(myCheckedInAt),
      myCheckInMethod: _checkInMethodFromWire(myCheckInMethod),
    );
  }
}

DateTime? _dateFromString(String? value) =>
    value == null ? null : DateTime.parse(value).toLocal();

EventRegistrationStatus? _registrationStatusFromWire(String? value) =>
    switch (value) {
      'confirmed' => EventRegistrationStatus.confirmed,
      'cancelled' => EventRegistrationStatus.cancelled,
      'checked_in' => EventRegistrationStatus.checkedIn,
      'absent' => EventRegistrationStatus.absent,
      null => null,
      _ => throw FormatException('Unsupported registration status: $value'),
    };

EventCheckInMethod? _checkInMethodFromWire(String? value) => switch (value) {
  'member_self' => EventCheckInMethod.memberSelf,
  'onsite_qr' => EventCheckInMethod.onsiteQr,
  'admin_manual' => EventCheckInMethod.adminManual,
  null => null,
  _ => throw FormatException('Unsupported check-in method: $value'),
};
